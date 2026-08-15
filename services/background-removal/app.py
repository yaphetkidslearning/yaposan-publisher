import base64
import hashlib
import io
import math
import os
import threading
import time
from collections import Counter, OrderedDict
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps, ImageStat
from rembg import new_session, remove

STANDARD_MODEL = os.environ.get("YAPOSAN_BG_STANDARD_MODEL", "u2net")
DETAIL_MODEL = os.environ.get("YAPOSAN_BG_DETAIL_MODEL", "birefnet-general")
MAX_BYTES = int(os.environ.get("YAPOSAN_BG_MAX_BYTES", "50000000"))
MAX_PIXELS = int(os.environ.get("YAPOSAN_BG_MAX_PIXELS", "50000000"))
REVIEW_SCORE = float(os.environ.get("YAPOSAN_BG_REVIEW_SCORE", "0.93"))
RETRY_SCORE = float(os.environ.get("YAPOSAN_BG_RETRY_SCORE", "0.90"))
AGREEMENT_IOU = float(os.environ.get("YAPOSAN_BG_AGREEMENT_IOU", "0.91"))
AUTO_DETAIL_DIFFICULTY = float(os.environ.get("YAPOSAN_BG_AUTO_DETAIL_DIFFICULTY", "0.28"))
MAX_CONCURRENCY = max(1, int(os.environ.get("YAPOSAN_BG_MAX_CONCURRENCY", "8")))
RETRY_ATTEMPTS = max(1, min(5, int(os.environ.get("YAPOSAN_BG_RETRY_ATTEMPTS", "3"))))
CACHE_SIZE = max(0, int(os.environ.get("YAPOSAN_BG_CACHE_SIZE", "256")))
CATALOG_OCCUPANCY = float(os.environ.get("YAPOSAN_BG_CATALOG_OCCUPANCY", "0.78"))
DEFAULT_WEBP_QUALITY = max(60, min(100, int(os.environ.get("YAPOSAN_BG_WEBP_QUALITY", "92"))))

Image.MAX_IMAGE_PIXELS = max(MAX_PIXELS, 1)
app = FastAPI(title="Yaposan Product Photo Engine", version="91.8")
_SEMAPHORE = threading.BoundedSemaphore(MAX_CONCURRENCY)
_METRICS_LOCK = threading.Lock()
_METRICS = Counter()
_CATEGORY_METRICS: dict[str, Counter] = {}
_RESULT_CACHE: "OrderedDict[str, dict]" = OrderedDict()
_FEEDBACK = Counter()

CATEGORY_VALUES = {
    "auto", "hard-goods", "footwear", "apparel", "furniture", "thin-structures",
    "hair-fur", "glass-transparent", "jewelry", "general-merchandise"
}


class RemoveRequest(BaseModel):
    image_base64: str
    mime_type: str
    background: str = "transparent"
    background_color: str | None = None
    quality_mode: str = "auto"
    preset: str = "marketplace-product"
    padding_percent: float = 10.0
    square_canvas: bool = True
    preserve_shadow: bool = True
    category_hint: str = "auto"
    output_format: str = "png"
    normalize_lighting: bool = False
    catalog_target_occupancy: float = CATALOG_OCCUPANCY
    catalog_canvas_px: int | None = None
    target_luma: float | None = None
    target_rgb: list[float] | None = None
    strict_white: bool = False
    white_audit_threshold: float = 1.0


class AnalyzeRequest(BaseModel):
    image_base64: str
    mime_type: str
    category_hint: str = "auto"


class ReviewFeedback(BaseModel):
    category: str = "general-merchandise"
    failure_reason: str
    corrected: bool = True


@lru_cache(maxsize=8)
def session_for(model: str):
    # onnxruntime chooses an installed execution provider. Deployments can use
    # rembg[gpu] for CUDA while CPU-only deployments continue to work unchanged.
    return new_session(model)


def decode_image(req: RemoveRequest):
    if req.mime_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(status_code=415, detail="unsupported image type")
    try:
        raw = base64.b64decode(req.image_base64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="invalid image data") from exc
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="image too large")
    try:
        opened = Image.open(io.BytesIO(raw))
        opened.load()
        if opened.width * opened.height > MAX_PIXELS:
            raise HTTPException(status_code=413, detail="image pixel count too large")
        image = ImageOps.exif_transpose(opened).convert("RGBA")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="invalid or corrupt image") from exc
    normalized = io.BytesIO()
    image.save(normalized, format="PNG")
    return normalized.getvalue(), image, hashlib.sha256(raw).hexdigest()


def image_stats(image: Image.Image) -> dict:
    sample = image.convert("RGB")
    sample.thumbnail((512, 512), Image.Resampling.LANCZOS)
    gray = sample.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    rgb_stat = ImageStat.Stat(sample)
    gray_stat = ImageStat.Stat(gray)
    saturation = ImageStat.Stat(ImageOps.autocontrast(sample).convert("HSV").getchannel("S")).mean[0] / 255.0
    edge_mean = ImageStat.Stat(edges).mean[0] / 255.0
    contrast = min(1.0, gray_stat.stddev[0] / 64.0)
    mean_luma = gray_stat.mean[0] / 255.0
    channels = rgb_stat.mean
    wb_spread = (max(channels) - min(channels)) / 255.0
    return {
        "edge_mean": edge_mean,
        "contrast": contrast,
        "mean_luma": mean_luma,
        "saturation": saturation,
        "wb_spread": wb_spread,
    }


def border_luma(image: Image.Image) -> float:
    gray = image.convert("L")
    gray.thumbnail((512, 512), Image.Resampling.LANCZOS)
    w, h = gray.size
    border = Image.new("L", gray.size, 0)
    px = border.load()
    for x in range(w):
        px[x, 0] = 255; px[x, h - 1] = 255
    for y in range(h):
        px[0, y] = 255; px[w - 1, y] = 255
    return ImageStat.Stat(gray, mask=border).mean[0] / 255.0


def visual_conditions(image: Image.Image, stats: dict) -> list[str]:
    conditions: list[str] = []
    b = border_luma(image)
    if stats["edge_mean"] > 0.20:
        conditions.append("fine-or-busy-edges")
    if stats["contrast"] < 0.22:
        conditions.append("low-contrast-subject")
    if b > 0.86:
        conditions.append("white-on-white-risk")
    if b < 0.12:
        conditions.append("black-on-black-risk")
    if stats["saturation"] > 0.65:
        conditions.append("color-spill-risk")
    if stats["wb_spread"] > 0.18:
        conditions.append("white-balance-variance")
    return conditions


def difficulty_score(image: Image.Image) -> tuple[float, list[str], dict]:
    stats = image_stats(image)
    reasons = visual_conditions(image, stats)
    score = stats["edge_mean"] * 0.58 + stats["contrast"] * 0.22
    if "fine-or-busy-edges" in reasons: score += 0.18
    if "low-contrast-subject" in reasons: score += 0.18
    if "white-on-white-risk" in reasons or "black-on-black-risk" in reasons: score += 0.10
    if "color-spill-risk" in reasons: score += 0.07
    return max(0.0, min(1.0, score)), reasons, stats


def routed_category(req: RemoveRequest, conditions: list[str]) -> str:
    if req.category_hint in CATEGORY_VALUES and req.category_hint != "auto":
        return req.category_hint
    if any(x in conditions for x in ("white-on-white-risk", "black-on-black-risk", "color-spill-risk")):
        return "hard-goods"
    if "fine-or-busy-edges" in conditions:
        return "thin-structures"
    return "general-merchandise"


def model_strategy(category: str, conditions: list[str], quality_mode: str) -> list[tuple[str, bool, str]]:
    # Three candidates use independent matting parameters while keeping two proven model families.
    strategies: list[tuple[str, bool, str]] = [(STANDARD_MODEL, False, "standard")]
    hard = category in {"thin-structures", "hair-fur", "glass-transparent", "jewelry", "apparel"}
    if quality_mode == "quality" or hard or conditions:
        strategies.append((DETAIL_MODEL, True, "detail-matte"))
    if quality_mode == "quality" or category in {"glass-transparent", "hair-fur", "thin-structures", "jewelry"}:
        strategies.append((DETAIL_MODEL, True, "detail-soft-matte"))
    return strategies[:3]


def connected_components(alpha: Image.Image) -> int:
    mask = alpha.resize((128, 128), Image.Resampling.NEAREST).point(lambda p: 255 if p >= 128 else 0)
    pix = mask.load(); w, h = mask.size
    seen = set(); count = 0
    for y in range(h):
        for x in range(w):
            if pix[x, y] == 0 or (x, y) in seen: continue
            count += 1
            stack = [(x, y)]; seen.add((x, y)); area = 0
            while stack:
                cx, cy = stack.pop(); area += 1
                for nx, ny in ((cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)):
                    if 0 <= nx < w and 0 <= ny < h and pix[nx, ny] != 0 and (nx, ny) not in seen:
                        seen.add((nx, ny)); stack.append((nx, ny))
            if area < 3: count -= 1
    return count


def bbox_geometry(alpha: Image.Image) -> dict:
    bbox = alpha.getbbox()
    if not bbox:
        return {"left": 0, "top": 0, "width": 0, "height": 0, "center_x": 0.5, "center_y": 0.5, "occupied_fraction": 0.0}
    l, t, r, b = bbox
    w, h = alpha.size
    return {
        "left": l, "top": t, "width": r-l, "height": b-t,
        "center_x": round(((l+r)/2) / max(1, w), 5),
        "center_y": round(((t+b)/2) / max(1, h), 5),
        "occupied_fraction": round(((r-l)*(b-t)) / max(1, w*h), 5),
    }


def edge_complexity(alpha: Image.Image) -> float:
    small = alpha.resize((256, 256), Image.Resampling.LANCZOS)
    e = small.filter(ImageFilter.FIND_EDGES)
    return min(1.0, ImageStat.Stat(e).mean[0] / 38.0)


def alpha_hole_fraction(alpha: Image.Image) -> float:
    # Estimate transparent holes enclosed by the foreground. This is diagnostic only;
    # the pipeline intentionally does not fill holes.
    bbox = alpha.getbbox()
    if not bbox: return 0.0
    crop = alpha.crop(bbox).resize((160, 160), Image.Resampling.LANCZOS)
    hard = crop.point(lambda p: 255 if p >= 128 else 0)
    inv = ImageOps.invert(hard)
    # Flood exterior background from image edges, then remaining inverse pixels are holes.
    pix = inv.load(); w, h = inv.size
    seen = set(); stack = []
    for x in range(w):
        if pix[x,0]: stack.append((x,0)); seen.add((x,0))
        if pix[x,h-1]: stack.append((x,h-1)); seen.add((x,h-1))
    for y in range(h):
        if pix[0,y]: stack.append((0,y)); seen.add((0,y))
        if pix[w-1,y]: stack.append((w-1,y)); seen.add((w-1,y))
    while stack:
        x,y=stack.pop()
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<w and 0<=ny<h and pix[nx,ny] and (nx,ny) not in seen:
                seen.add((nx,ny)); stack.append((nx,ny))
    holes=sum(1 for y in range(h) for x in range(w) if pix[x,y] and (x,y) not in seen)
    return holes / max(1,w*h)


def analyze_cutout(fg: Image.Image, original_size: tuple[int, int]) -> tuple[float, str, list[str], dict]:
    alpha = fg.getchannel("A")
    hist = alpha.histogram(); total = max(1, fg.width * fg.height)
    transparent = sum(hist[:6]) / total
    opaque = sum(hist[250:]) / total
    soft = sum(hist[6:250]) / total
    foreground = 1.0 - transparent
    reasons: list[str] = []
    score = 0.992
    if foreground < 0.02: score -= 0.74; reasons.append("subject-nearly-empty")
    elif foreground < 0.05: score -= 0.28; reasons.append("subject-very-small")
    if foreground > 0.94: score -= 0.44; reasons.append("background-mostly-retained")
    if soft > 0.40: score -= 0.18; reasons.append("large-soft-alpha-region")
    if soft < 0.00015 and foreground > 0.10: score -= 0.05; reasons.append("hard-mask-review-fine-edges")
    if fg.size != original_size: score -= 0.30; reasons.append("resolution-changed")
    if opaque < 0.01: score -= 0.50; reasons.append("no-solid-foreground")

    ap = alpha.load(); w, h = alpha.size
    border_pixels=[]
    for x in range(w): border_pixels.extend((ap[x,0], ap[x,h-1]))
    for y in range(1,max(1,h-1)): border_pixels.extend((ap[0,y], ap[w-1,y]))
    border_leak=sum(1 for p in border_pixels if p>=32)/max(1,len(border_pixels))
    if border_leak>0.45: score-=0.22; reasons.append("foreground-touches-most-borders")
    elif border_leak>0.20: score-=0.08; reasons.append("foreground-touches-border")

    components=connected_components(alpha)
    if components>14: score-=0.13; reasons.append("many-disconnected-fragments")
    elif components>8: score-=0.06; reasons.append("fragmented-mask")

    geom=bbox_geometry(alpha)
    if geom["occupied_fraction"]<0.015: score-=0.18; reasons.append("foreground-bounds-too-small")
    if geom["left"]<=1 or geom["top"]<=1 or geom["left"]+geom["width"]>=w-1 or geom["top"]+geom["height"]>=h-1:
        score-=0.06; reasons.append("partial-product-or-border-contact")

    complexity=edge_complexity(alpha)
    hole_fraction=alpha_hole_fraction(alpha)
    score=max(0.0,min(1.0,score))
    blockers={"subject-nearly-empty","background-mostly-retained","resolution-changed","no-solid-foreground"}
    status="pass" if score>=REVIEW_SCORE and not blockers.intersection(reasons) else "review"
    diagnostics={
        "foreground_coverage":round(foreground,5),"soft_alpha_fraction":round(soft,5),
        "border_leak_fraction":round(border_leak,5),"component_count":components,
        "bbox_coverage":geom["occupied_fraction"],"edge_complexity":round(complexity,5),
        "hole_fraction":round(hole_fraction,5),
    }
    return score,status,reasons,diagnostics


def remove_once(raw: bytes, model: str, detail: bool, strategy: str) -> bytes:
    kwargs = dict(session=session_for(model), force_return_bytes=True)
    if detail:
        if strategy == "detail-soft-matte":
            kwargs.update(alpha_matting=True, alpha_matting_foreground_threshold=225, alpha_matting_background_threshold=20, alpha_matting_erode_size=4)
        else:
            kwargs.update(alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=8)
    return remove(raw, **kwargs)


def remove_with_retry(raw: bytes, model: str, detail: bool, strategy: str) -> bytes:
    last_exc = None
    for attempt in range(RETRY_ATTEMPTS):
        try:
            return remove_once(raw, model, detail, strategy)
        except Exception as exc:
            last_exc = exc
            if detail:
                try:
                    return remove(raw, session=session_for(model), force_return_bytes=True)
                except Exception:
                    pass
            if attempt + 1 < RETRY_ATTEMPTS:
                time.sleep(0.25 * (2 ** attempt))
    raise last_exc if last_exc else RuntimeError("background removal failed")


def refine_alpha(fg: Image.Image, category: str) -> Image.Image:
    # Preserve genuine semi-transparency while smoothing jagged transitions.
    alpha = fg.getchannel("A")
    radius = 0.55 if category in {"glass-transparent", "hair-fur", "thin-structures", "jewelry"} else 0.35
    soft = alpha.filter(ImageFilter.GaussianBlur(radius=radius))
    # Recover very thin structures conservatively by mixing a one-pixel maximum filter.
    if category in {"thin-structures", "hair-fur", "jewelry"}:
        expanded = alpha.filter(ImageFilter.MaxFilter(3))
        soft = Image.blend(soft, expanded, 0.12)
    out = fg.copy(); out.putalpha(soft)
    return out


def estimate_background_color(original: Image.Image) -> tuple[int,int,int]:
    rgb=original.convert("RGB")
    rgb.thumbnail((512,512),Image.Resampling.LANCZOS)
    w,h=rgb.size; pixels=[]
    for x in range(w): pixels.extend([rgb.getpixel((x,0)),rgb.getpixel((x,h-1))])
    for y in range(h): pixels.extend([rgb.getpixel((0,y)),rgb.getpixel((w-1,y))])
    if not pixels: return (255,255,255)
    return tuple(int(sum(p[i] for p in pixels)/len(pixels)) for i in range(3))


def decontaminate_edges(original: Image.Image, fg: Image.Image) -> Image.Image:
    # Edge-only color decontamination reduces colored halos while keeping opaque product pixels unchanged.
    alpha=fg.getchannel("A"); bg=estimate_background_color(original); src=original.convert("RGB")
    out=fg.copy(); op=out.load(); sp=src.load(); ap=alpha.load(); w,h=out.size
    for y in range(h):
        for x in range(w):
            a=ap[x,y]
            if 8<a<247:
                strength=(1-a/255.0)*0.28
                r,g,b=sp[x,y]
                nr=max(0,min(255,round(r+(r-bg[0])*strength)))
                ng=max(0,min(255,round(g+(g-bg[1])*strength)))
                nb=max(0,min(255,round(b+(b-bg[2])*strength)))
                op[x,y]=(nr,ng,nb,a)
    return out


def extract_shadow(original: Image.Image, alpha: Image.Image) -> Image.Image:
    # Conservative shadow layer: dark low-saturation pixels immediately around the product.
    rgb=original.convert("RGB"); gray=rgb.convert("L")
    dilated=alpha.filter(ImageFilter.MaxFilter(15)); outside=ImageChops.subtract(dilated,alpha)
    dark=gray.point(lambda p: max(0, min(255, int((150-p)*2.0))))
    shadow=ImageChops.multiply(outside,dark).filter(ImageFilter.GaussianBlur(4))
    return shadow.point(lambda p: int(p*0.38))


def apply_safe_lighting_normalization(fg: Image.Image, target_luma: float | None = None, target_rgb: list[float] | None = None) -> Image.Image:
    # Explicit opt-in only. Alpha is never changed. Corrections are intentionally bounded.
    alpha=fg.getchannel("A")
    rgb=fg.convert("RGB")
    stat=ImageStat.Stat(rgb,mask=alpha)
    means=list(stat.mean) if stat.mean else [128.0,128.0,128.0]
    current_luma=sum(means)/3
    desired=(float(target_luma)*255.0) if target_luma is not None else 145.0
    brightness=max(0.88,min(1.12,desired/max(1.0,current_luma)))
    adjusted=ImageEnhance.Brightness(rgb).enhance(brightness)
    if target_rgb and len(target_rgb)==3:
        source=list(ImageStat.Stat(adjusted,mask=alpha).mean)
        gains=[max(0.92,min(1.08,(float(target_rgb[i])*255.0)/max(1.0,source[i]))) for i in range(3)]
        r,g,b=adjusted.split()
        r=r.point(lambda p:int(max(0,min(255,p*gains[0]))));g=g.point(lambda p:int(max(0,min(255,p*gains[1]))));b=b.point(lambda p:int(max(0,min(255,p*gains[2]))))
        adjusted=Image.merge("RGB",(r,g,b))
    normalized=adjusted.convert("RGBA");normalized.putalpha(alpha);return normalized


def mask_iou(a: Image.Image,b: Image.Image)->float:
    if a.size!=b.size:return 0.0
    ma=a.getchannel("A").point(lambda p:255 if p>=128 else 0).convert("1")
    mb=b.getchannel("A").point(lambda p:255 if p>=128 else 0).convert("1")
    inter=ImageChops.logical_and(ma,mb).convert("L").histogram()[255]
    union=ImageChops.logical_or(ma,mb).convert("L").histogram()[255]
    return 1.0 if union==0 else inter/union


def candidate_rank(c: dict, category: str) -> float:
    d=c["diagnostics"]
    rank=float(c["score"])
    rank-=min(0.08,float(d.get("border_leak_fraction",0))*0.12)
    rank-=min(0.05,max(0,float(d.get("component_count",1))-8)*0.004)
    if category in {"glass-transparent","hair-fur"} and d.get("soft_alpha_fraction",0)<0.001: rank-=0.04
    if category in {"thin-structures","jewelry"} and d.get("edge_complexity",0)<0.03: rank-=0.03
    return rank


def catalog_layout(fg: Image.Image,padding_percent:float,square:bool,target_occupancy:float,canvas_px:int|None,shadow:Image.Image|None=None)->tuple[Image.Image,Image.Image|None]:
    alpha=fg.getchannel("A"); bbox=alpha.getbbox()
    if not bbox:return fg,shadow
    crop=fg.crop(bbox); shadow_crop=shadow.crop(bbox) if shadow is not None and shadow.size==fg.size else None
    occupancy=max(0.45,min(0.92,target_occupancy))
    pad=max(0.0,min(30.0,padding_percent))/100.0
    occupancy=min(occupancy,1.0-2*min(pad,0.2))
    if square:
        target=max(crop.width,crop.height)
        side=max(1,int(math.ceil(target/max(0.35,occupancy))))
        if canvas_px and canvas_px>0:side=max(side,min(6000,int(canvas_px)))
        canvas=Image.new("RGBA",(side,side),(0,0,0,0)); shadow_canvas=Image.new("L",(side,side),0) if shadow_crop is not None else None
        x=(side-crop.width)//2;y=max(0,int((side-crop.height)*0.46));canvas.alpha_composite(crop,(x,y))
        if shadow_canvas is not None:shadow_canvas.paste(shadow_crop,(x,y))
        return canvas,shadow_canvas
    px=int(round(max(crop.width,crop.height)*pad));canvas=Image.new("RGBA",(crop.width+2*px,crop.height+2*px),(0,0,0,0));canvas.alpha_composite(crop,(px,px))
    shadow_canvas=Image.new("L",canvas.size,0) if shadow_crop is not None else None
    if shadow_canvas is not None:shadow_canvas.paste(shadow_crop,(px,px))
    return canvas,shadow_canvas


def composite_background(fg:Image.Image,mode:str,color:str|None,shadow:Image.Image|None=None)->Image.Image:
    if mode=="transparent":return fg
    rgba=(255,255,255,255)
    if mode=="custom" and color:
        value=color.strip().lstrip("#")
        if len(value)==6:
            try:rgba=tuple(int(value[i:i+2],16) for i in (0,2,4))+(255,)
            except ValueError:pass
    canvas=Image.new("RGBA",fg.size,rgba)
    if shadow is not None and shadow.size==fg.size:
        shadow_rgba=Image.new("RGBA",fg.size,(0,0,0,0));shadow_rgba.putalpha(shadow)
        canvas.alpha_composite(shadow_rgba)
    canvas.alpha_composite(fg);return canvas


def encode_output(image:Image.Image,fmt:str)->tuple[bytes,str]:
    out=io.BytesIO()
    if fmt=="webp":
        image.save(out,format="WEBP",lossless=True,quality=DEFAULT_WEBP_QUALITY,method=4)
        return out.getvalue(),"image/webp"
    if fmt=="jpeg":
        opaque=Image.new("RGB",image.size,(255,255,255));opaque.paste(image.convert("RGB"),mask=image.getchannel("A"))
        opaque.save(out,format="JPEG",quality=95,optimize=True)
        return out.getvalue(),"image/jpeg"
    image.save(out,format="PNG",optimize=True)
    return out.getvalue(),"image/png"


def post_export_white_audit(encoded: bytes, foreground_alpha: Image.Image, fmt: str) -> dict:
    """Second certification pass after encoding. Exact-white certification is only valid for PNG/lossless WebP."""
    if fmt == "jpeg":
        return {"pass": False, "certified": False, "reason": "jpeg-is-marketplace-white-not-exact-white", "compliance": None, "exact_rgb": [255,255,255]}
    decoded = Image.open(io.BytesIO(encoded)).convert("RGBA")
    audit = pure_white_audit(decoded, foreground_alpha)
    audit["certified"] = bool(audit.get("pass") and float(audit.get("compliance",0)) == 1.0)
    audit["format"] = fmt
    return audit


def cache_get(key:str):
    if not CACHE_SIZE:return None
    with _METRICS_LOCK:
        value=_RESULT_CACHE.get(key)
        if value is not None:
            _RESULT_CACHE.move_to_end(key);_METRICS["duplicate_cache_hits"]+=1
            return dict(value)
    return None


def cache_put(key:str,value:dict):
    if not CACHE_SIZE:return
    with _METRICS_LOCK:
        _RESULT_CACHE[key]=dict(value);_RESULT_CACHE.move_to_end(key)
        while len(_RESULT_CACHE)>CACHE_SIZE:_RESULT_CACHE.popitem(last=False)


def record_metric(category:str,status:str,elapsed:int,model:str):
    with _METRICS_LOCK:
        _METRICS["processed"]+=1;_METRICS[f"status_{status}"]+=1;_METRICS["processing_ms_total"]+=elapsed;_METRICS[f"model_{model}"]+=1
        cm=_CATEGORY_METRICS.setdefault(category,Counter());cm["processed"]+=1;cm[f"status_{status}"]+=1


@app.get("/health")
def health():
    return {"status":"ok","engine":"rembg","standard_model":STANDARD_MODEL,"detail_model":DETAIL_MODEL,"paid_api":False,"phase":"91.8","max_concurrency":MAX_CONCURRENCY,"max_pixels":MAX_PIXELS}


@app.post("/warmup")
def warmup():
    started=time.perf_counter();session_for(STANDARD_MODEL);session_for(DETAIL_MODEL)
    return {"status":"ready","models":[STANDARD_MODEL,DETAIL_MODEL],"warmup_ms":int((time.perf_counter()-started)*1000),"phase":"91.8"}




def pure_white_audit(composited: Image.Image, foreground_alpha: Image.Image) -> dict:
    """Verify that every true-background pixel is exact RGB 255,255,255."""
    rgb = composited.convert("RGB")
    alpha = foreground_alpha.convert("L")
    if rgb.size != alpha.size:
        alpha = alpha.resize(rgb.size, Image.Resampling.NEAREST)
    rp = rgb.load(); ap = alpha.load(); w,h = rgb.size
    background = 0; exact = 0; nonwhite = 0; worst_delta = 0
    for y in range(h):
        for x in range(w):
            if ap[x,y] == 0:
                background += 1
                r,g,b = rp[x,y]
                if (r,g,b) == (255,255,255):
                    exact += 1
                else:
                    nonwhite += 1
                    worst_delta = max(worst_delta, 255-r, 255-g, 255-b)
    compliance = 1.0 if background == 0 else exact / background
    return {
        "background_pixels": background,
        "exact_white_pixels": exact,
        "nonwhite_background_pixels": nonwhite,
        "compliance": round(compliance, 8),
        "worst_channel_delta": int(worst_delta),
        "exact_rgb": [255,255,255],
        "pass": nonwhite == 0,
    }


def force_pure_white_background(fg: Image.Image) -> Image.Image:
    """Composite foreground onto exact #FFFFFF without preserving a shadow."""
    base = Image.new("RGBA", fg.size, (255,255,255,255))
    base.alpha_composite(fg)
    return base.convert("RGB").convert("RGBA")


def final_output_score(fg: Image.Image, original: Image.Image, category: str) -> dict:
    """91.6 final-visible-result gate: score the composited/cropped result, not only the raw mask."""
    rgba = fg.convert("RGBA")
    alpha = rgba.getchannel("A")
    geom = bbox_geometry(alpha)
    d = alpha_diagnostics(alpha)
    score = 1.0
    reasons = []
    if d.get("border_leak_fraction", 0) > 0.08:
        score -= 0.12; reasons.append("final-border-leak")
    if d.get("component_count", 1) > 14:
        score -= 0.08; reasons.append("final-fragmentation")
    if geom.get("occupied_fraction", 0) < 0.12:
        score -= 0.35; reasons.append("final-product-too-small")
    if category in {"glass-transparent","hair-fur","thin-structures","jewelry"} and d.get("soft_alpha_fraction",0) < 0.0005:
        score -= 0.08; reasons.append("final-matting-risk")
    return {"score": round(max(0.0, min(1.0, score)),4), "reasons": reasons, "geometry": geom, "diagnostics": d}


def preserve_product_guard(original: Image.Image, cutout: Image.Image) -> dict:
    """Conservative integrity signal. Never invent merchandise pixels."""
    a=cutout.getchannel("A")
    bbox=a.getbbox()
    if not bbox:
        return {"ok":False,"reason":"empty-foreground"}
    touches = bbox[0] <= 1 or bbox[1] <= 1 or bbox[2] >= original.width-1 or bbox[3] >= original.height-1
    opaque=sum(a.histogram()[240:256]); total=max(1,original.width*original.height)
    frac=opaque/total
    return {"ok": 0.01 < frac < 0.98 and not touches, "opaque_fraction":round(frac,5),
            "border_contact":touches, "policy":"never-generate-or-replace-product-pixels"}


def specialized_matte(fg: Image.Image, category: str) -> Image.Image:
    """Dedicated 91.6 matting pass for semi-transparent/fine-edge categories."""
    if category not in {"glass-transparent","hair-fur","thin-structures","jewelry"}:
        return fg
    alpha=fg.getchannel("A")
    # Edge-aware conservative blend: retain original alpha while softening only transition pixels.
    soft=alpha.filter(ImageFilter.GaussianBlur(0.75))
    edge=alpha.filter(ImageFilter.FIND_EDGES)
    mixed=Image.composite(soft, alpha, edge.point(lambda p:255 if p>18 else 0))
    out=fg.copy(); out.putalpha(mixed); return out


def finished_candidate_rank(candidate: dict, original: Image.Image, category: str) -> float:
    """Rank finished visible candidates, including integrity and final-output diagnostics."""
    visible=final_output_score(candidate["fg"],original,category)
    integrity=preserve_product_guard(original,candidate["fg"])
    rank=candidate_rank(candidate,category)*0.72 + visible["score"]*0.28
    if not integrity["ok"]: rank-=0.18
    candidate["final_output"]=visible
    candidate["product_integrity"]=integrity
    return rank


@app.get("/readiness")
def readiness():
    """Production warm-pool/readiness signal for orchestration."""
    ready=[]
    for model in (STANDARD_MODEL, DETAIL_MODEL):
        try:
            session_for(model); ready.append({"model":model,"ready":True})
        except Exception as exc:
            ready.append({"model":model,"ready":False,"error":type(exc).__name__})
    return {"phase":"91.8","models":ready,"max_concurrency":MAX_CONCURRENCY,
            "gpu_cpu_fallback":"onnxruntime-provider-dependent","paid_api_cost_usd":0}

@app.get("/metrics")
def metrics():
    with _METRICS_LOCK:
        processed=_METRICS.get("processed",0)
        return {
            "phase":"91.8","processed":processed,"pass":_METRICS.get("status_pass",0),"review":_METRICS.get("status_review",0),
            "failed":_METRICS.get("status_failed",0),"duplicate_cache_hits":_METRICS.get("duplicate_cache_hits",0),
            "average_processing_ms":round(_METRICS.get("processing_ms_total",0)/processed,1) if processed else 0,
            "categories":{k:dict(v) for k,v in _CATEGORY_METRICS.items()},"feedback":dict(_FEEDBACK),"paid_api_cost_usd":0,
        }


@app.post("/review-feedback")
def review_feedback(req:ReviewFeedback):
    category=req.category if req.category in CATEGORY_VALUES else "general-merchandise"
    key=f"{category}:{req.failure_reason[:80]}:{'corrected' if req.corrected else 'rejected'}"
    with _METRICS_LOCK:_FEEDBACK[key]+=1
    return {"status":"recorded","stores_image":False,"paid_api_cost_usd":0}


@app.post("/analyze-photo")
def analyze_photo(req:AnalyzeRequest):
    shadow_req=RemoveRequest(image_base64=req.image_base64,mime_type=req.mime_type,category_hint=req.category_hint)
    _,image,digest=decode_image(shadow_req)
    difficulty,reasons,stats=difficulty_score(image);category=routed_category(shadow_req,reasons)
    rgb=image.convert("RGB"); st=ImageStat.Stat(rgb)
    return {"image_sha256":digest,"width":image.width,"height":image.height,"megapixels":round(image.width*image.height/1_000_000,3),"difficulty_score":round(difficulty,4),"visual_conditions":reasons,"category":category,"mean_rgb":[round(v/255.0,5) for v in st.mean],"mean_luma":round(sum(st.mean)/(3*255.0),5),"paid_api_cost_usd":0,"phase":"91.8"}


@app.post("/remove-background")
def remove_background(req:RemoveRequest):
    if req.background not in {"transparent","white","custom"}:raise HTTPException(status_code=400,detail="invalid background")
    if req.quality_mode not in {"auto","fast","quality"}:raise HTTPException(status_code=400,detail="invalid quality mode")
    if req.output_format not in {"png","webp","jpeg"}:raise HTTPException(status_code=400,detail="invalid output format")
    if req.category_hint not in CATEGORY_VALUES:raise HTTPException(status_code=400,detail="invalid category hint")
    if not 0.45<=req.catalog_target_occupancy<=0.92:raise HTTPException(status_code=400,detail="invalid catalog occupancy")
    if not 0.999 <= req.white_audit_threshold <= 1.0:raise HTTPException(status_code=400,detail="invalid white audit threshold")
    if req.strict_white and req.output_format=="jpeg":raise HTTPException(status_code=400,detail="certified exact white requires png or webp")

    started=time.perf_counter();raw,original,digest=decode_image(req)
    cache_key=hashlib.sha256((digest+repr((req.background,req.background_color,req.quality_mode,req.preset,req.padding_percent,req.square_canvas,req.preserve_shadow,req.category_hint,req.output_format,req.normalize_lighting,req.catalog_target_occupancy,req.catalog_canvas_px,req.target_luma,req.target_rgb,req.strict_white,req.white_audit_threshold))).encode()).hexdigest()
    cached=cache_get(cache_key)
    if cached:
        cached["duplicate_hit"]=True;cached["processing_ms"]=int((time.perf_counter()-started)*1000);return cached

    with _SEMAPHORE:
        difficulty,difficulty_reasons,stats=difficulty_score(original)
        category=routed_category(req,difficulty_reasons)
        strict_white_requested=bool(req.strict_white or req.preset=="pure-white-catalog")
        force_white_product_detail=strict_white_requested and "white-on-white-risk" in difficulty_reasons
        high_res=original.width*original.height>12_000_000
        candidates=[]

        def add_candidate(model:str,detail:bool,strategy:str):
            result=remove_with_retry(raw,model,detail,strategy)
            fg=Image.open(io.BytesIO(result)).convert("RGBA")
            if fg.size!=original.size:fg=fg.resize(original.size,Image.Resampling.LANCZOS)
            fg=refine_alpha(fg,category);fg=specialized_matte(fg,category);fg=decontaminate_edges(original,fg)
            score,status,reasons,diagnostics=analyze_cutout(fg,original.size)
            candidates.append({"model":model,"strategy":strategy,"score":score,"status":status,"reasons":reasons,"fg":fg,"diagnostics":diagnostics})

        if req.quality_mode == "quality":
            # Keep the 91.4 guarantee explicit: max quality always compares the standard and detail models.
            add_candidate(STANDARD_MODEL,False,"standard")
            add_candidate(DETAIL_MODEL,True,"detail-matte")
            if category in {"glass-transparent","hair-fur","thin-structures","jewelry"}:
                add_candidate(DETAIL_MODEL,True,"detail-soft-matte")
        elif req.quality_mode == "fast":
            add_candidate(STANDARD_MODEL,False,"standard")
        else:
            strategies=model_strategy(category,difficulty_reasons,req.quality_mode)
            for model,detail,strategy in strategies:
                add_candidate(model,detail,strategy)
                first=candidates[0]
                if len(candidates)==1 and force_white_product_detail:
                    continue
                if len(candidates)==1 and difficulty<AUTO_DETAIL_DIFFICULTY and first["score"]>=RETRY_SCORE and first["status"]=="pass":
                    break
            if force_white_product_detail and not any(c["model"]==DETAIL_MODEL for c in candidates):
                add_candidate(DETAIL_MODEL,True,"white-on-white-detail-matte")

        best=max(candidates,key=lambda c:finished_candidate_rank(c,original,category))
        agreements=[]
        for i in range(len(candidates)):
            for j in range(i+1,len(candidates)):
                agreements.append(mask_iou(candidates[i]["fg"],candidates[j]["fg"]))
        agreement=min(agreements) if agreements else 1.0
        review_reasons=list(best["reasons"])
        if agreement<AGREEMENT_IOU:
            review_reasons.append("model-disagreement");best={**best,"status":"review","score":min(best["score"],0.899)}
        if "partial-product-or-border-contact" in best["reasons"]:
            review_reasons.append("possible-occlusion-or-crop")

        fg=best["fg"]
        if req.normalize_lighting:fg=apply_safe_lighting_normalization(fg,req.target_luma,req.target_rgb)
        shadow=None
        if req.preserve_shadow and req.background!="transparent":shadow=extract_shadow(original,fg.getchannel("A"))
        geom_before=bbox_geometry(fg.getchannel("A"))
        if req.preset=="marketplace-product":
            fg,shadow=catalog_layout(fg,req.padding_percent,req.square_canvas,req.catalog_target_occupancy,req.catalog_canvas_px,shadow)
        output_geom=bbox_geometry(fg.getchannel("A"))
        foreground_alpha=fg.getchannel("A").copy()
        strict_white_enabled=bool(req.strict_white or req.preset=="pure-white-catalog")
        if strict_white_enabled:
            fg=force_pure_white_background(fg)
            white_audit=pure_white_audit(fg,foreground_alpha)
        else:
            fg=composite_background(fg,req.background,req.background_color,shadow)
            white_audit={"pass":None,"compliance":None,"exact_rgb":[255,255,255],"nonwhite_background_pixels":None}
        encoded,mime=encode_output(fg,req.output_format)
        post_export_audit=post_export_white_audit(encoded,foreground_alpha,req.output_format) if strict_white_enabled else {"pass":None,"certified":None,"compliance":None}
        elapsed=int((time.perf_counter()-started)*1000)
        reasons=list(dict.fromkeys(difficulty_reasons+review_reasons))
        status=best["status"]
        if strict_white_enabled and (not white_audit.get("pass") or float(white_audit.get("compliance",0)) < req.white_audit_threshold or not post_export_audit.get("certified")):
            status="review"
            reasons=list(dict.fromkeys(reasons+["pure-white-post-export-audit-failed"]))
        response={
            "image_base64":base64.b64encode(encoded).decode("ascii"),"mime_type":mime,
            "quality_score":round(float(best["score"]),4),"quality_status":status,"review_reasons":reasons,
            "difficulty_score":round(difficulty,4),"category":category,"visual_conditions":difficulty_reasons,
            "used_model":best["model"],"used_strategy":best["strategy"],"retried":len(candidates)>1,
            "candidate_count":len(candidates),"model_agreement_iou":round(agreement,4),"mask_diagnostics":best["diagnostics"],
            "final_output_score":best.get("final_output",{}),"product_integrity":best.get("product_integrity",{}),
            "foreground_geometry":geom_before,"output_foreground_geometry":output_geom,"processing_ms":elapsed,"original_width":original.width,"original_height":original.height,
            "output_width":fg.width,"output_height":fg.height,"high_resolution_mode":"full-resolution-staged" if high_res else "standard",
            "duplicate_hit":False,"paid_api_cost_usd":0,"product_pixel_policy":"original-pixels-default; lighting-normalization-explicit-opt-in",
            "shadow_policy":"disabled-for-strict-pure-white; conservative-extraction-otherwise","strict_white":strict_white_enabled,"white_background_audit":white_audit,"post_export_white_audit":post_export_audit,"white_on_white_detail_forced":force_white_product_detail,"engine_version":"91.8",
            "input_stats":{k:round(float(v),5) for k,v in stats.items()},
        }
        record_metric(category,status,elapsed,best["model"]);cache_put(cache_key,response);return response

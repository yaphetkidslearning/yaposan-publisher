import base64
import hashlib
import io
import math
import os
import json
import uuid
import secrets
import shutil
import subprocess
from contextlib import contextmanager
from collections import deque
from pathlib import Path
import threading
import time
from collections import Counter, OrderedDict
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps, ImageStat
from rembg import new_session, remove

STANDARD_MODEL = os.environ.get("YAPOSAN_BG_STANDARD_MODEL", "birefnet-general-lite")
DETAIL_MODEL = os.environ.get("YAPOSAN_BG_DETAIL_MODEL", "birefnet-general")
# Yaposan 94 uses BiRefNet-first specialist lanes. Deployments remain configurable
# so exact checkpoints/licenses can be certified and swapped without changing code.
MATTING_MODEL = os.environ.get("YAPOSAN_BG_MATTING_MODEL", "birefnet-general")
PEOPLE_MODEL = os.environ.get("YAPOSAN_BG_PEOPLE_MODEL", "birefnet-portrait")
PRODUCT_MODEL = os.environ.get("YAPOSAN_BG_PRODUCT_MODEL", "birefnet-general")
FINE_DETAIL_MODEL = os.environ.get("YAPOSAN_BG_FINE_DETAIL_MODEL", "birefnet-general")
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
PHASE2_DATA_DIR = Path(os.environ.get("YAPOSAN_BG_PHASE2_DATA_DIR", "/tmp/yaposan-bg-phase2"))
MODEL_VERSION = os.environ.get("YAPOSAN_BG_MODEL_VERSION", "phase1-baseline")
CORRECTION_RETENTION_DAYS = max(1, int(os.environ.get("YAPOSAN_BG_CORRECTION_RETENTION_DAYS", "30")))
CORRECTION_MAX_MASK_BYTES = max(1024, int(os.environ.get("YAPOSAN_BG_CORRECTION_MAX_MASK_BYTES", "25000000")))
CORRECTION_CLEANUP_INTERVAL_SECONDS = max(60, int(os.environ.get("YAPOSAN_BG_CORRECTION_CLEANUP_INTERVAL_SECONDS", "3600")))
DEPLOYMENT_ENV = os.environ.get("YAPOSAN_BG_DEPLOYMENT_ENV", "development").strip().lower()
PHASE2_SERVICE_TOKEN = os.environ.get("YAPOSAN_BG_PHASE2_SERVICE_TOKEN", "")
PHASE2_REQUIRE_SERVICE_AUTH = os.environ.get("YAPOSAN_BG_PHASE2_REQUIRE_SERVICE_AUTH", "true" if DEPLOYMENT_ENV == "production" else "false").strip().lower() in {"1","true","yes","on"}
PHASE2_STORAGE_ENCRYPTED = os.environ.get("YAPOSAN_BG_PHASE2_STORAGE_ENCRYPTED", "false").strip().lower() in {"1","true","yes","on"}
PHASE2_REQUIRE_ENCRYPTED_STORAGE = os.environ.get("YAPOSAN_BG_PHASE2_REQUIRE_ENCRYPTED_STORAGE", "true" if DEPLOYMENT_ENV == "production" else "false").strip().lower() in {"1","true","yes","on"}
CORRECTION_RATE_LIMIT_PER_MINUTE = max(1, int(os.environ.get("YAPOSAN_BG_CORRECTION_RATE_LIMIT_PER_MINUTE", "60")))
CORRECTION_MAX_STORED_EXAMPLES = max(1, int(os.environ.get("YAPOSAN_BG_CORRECTION_MAX_STORED_EXAMPLES", "100000")))
INFERENCE_QUEUE_TIMEOUT_SECONDS = max(0.05, float(os.environ.get("YAPOSAN_BG_INFERENCE_QUEUE_TIMEOUT_SECONDS", "2")))
INFRA_COST_USD_PER_HOUR = max(0.0, float(os.environ.get("YAPOSAN_BG_INFRA_COST_USD_PER_HOUR", "0")))
CANDIDATE_MODEL = os.environ.get("YAPOSAN_BG_CANDIDATE_MODEL", "").strip()
CANDIDATE_MODEL_VERSION = os.environ.get("YAPOSAN_BG_CANDIDATE_MODEL_VERSION", "").strip()
CANDIDATE_TRAFFIC_PERCENT = max(0.0, min(100.0, float(os.environ.get("YAPOSAN_BG_CANDIDATE_TRAFFIC_PERCENT", "0"))))
CANDIDATE_SHADOW_MODE = os.environ.get("YAPOSAN_BG_CANDIDATE_SHADOW_MODE", "true").strip().lower() in {"1","true","yes","on"}
CANDIDATE_PRODUCTION_APPROVED = os.environ.get("YAPOSAN_BG_CANDIDATE_PRODUCTION_APPROVED", "false").strip().lower() in {"1","true","yes","on"}

Image.MAX_IMAGE_PIXELS = max(MAX_PIXELS, 1)
app = FastAPI(title="Yaposan Product Photo Engine", version="94.0")
_SEMAPHORE = threading.BoundedSemaphore(MAX_CONCURRENCY)
_METRICS_LOCK = threading.Lock()
_METRICS = Counter()
_CATEGORY_METRICS: dict[str, Counter] = {}
_RESULT_CACHE: "OrderedDict[str, dict]" = OrderedDict()
_FEEDBACK = Counter()
_RETENTION_LOCK = threading.Lock()
_LAST_RETENTION_CLEANUP = 0.0
_CORRECTION_RATE_LOCK = threading.Lock()
_CORRECTION_REQUEST_TIMES = deque()
_INFERENCE_STATE_LOCK = threading.Lock()
_INFERENCE_WAITING = 0
_INFERENCE_ACTIVE = 0

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


class CorrectionExample(BaseModel):
    image_base64: str
    mime_type: str
    corrected_mask_base64: str
    ai_mask_base64: str | None = None
    category: str = "general-merchandise"
    failure_reason: str = Field(default="user-correction", max_length=160)
    consent_for_training: bool = False
    source_request_id: str | None = Field(default=None, max_length=160)
    consent_record_id: str | None = Field(default=None, max_length=160)
    consent_version: str | None = Field(default=None, max_length=80)


class DeleteCorrectionRequest(BaseModel):
    example_id: str = Field(min_length=36, max_length=36)
    reason: str = Field(default="consent-withdrawn", max_length=160)



def _require_phase2_service_token(token: str | None) -> None:
    if not PHASE2_REQUIRE_SERVICE_AUTH:
        return
    if not PHASE2_SERVICE_TOKEN:
        raise HTTPException(status_code=503, detail="phase2 service authentication is required but not configured")
    if not token or not secrets.compare_digest(token, PHASE2_SERVICE_TOKEN):
        raise HTTPException(status_code=401, detail="invalid phase2 service token")


def _assert_phase2_storage_policy() -> None:
    # This flag is an infrastructure attestation, not application-layer encryption.
    # Production must point PHASE2_DATA_DIR at an encrypted volume/object-store mount.
    if PHASE2_REQUIRE_ENCRYPTED_STORAGE and not PHASE2_STORAGE_ENCRYPTED:
        raise HTTPException(status_code=503, detail="phase2 encrypted storage is required but not attested")


def _check_correction_rate_limit() -> None:
    now = time.time(); cutoff = now - 60.0
    with _CORRECTION_RATE_LOCK:
        while _CORRECTION_REQUEST_TIMES and _CORRECTION_REQUEST_TIMES[0] < cutoff:
            _CORRECTION_REQUEST_TIMES.popleft()
        if len(_CORRECTION_REQUEST_TIMES) >= CORRECTION_RATE_LIMIT_PER_MINUTE:
            raise HTTPException(status_code=429, detail="correction capture rate limit exceeded")
        _CORRECTION_REQUEST_TIMES.append(now)


def _stored_correction_count() -> int:
    root = PHASE2_DATA_DIR / "corrections"
    if not root.exists():
        return 0
    return sum(1 for d in root.iterdir() if d.is_dir() and not d.name.startswith(".tmp-"))


@contextmanager
def inference_slot():
    global _INFERENCE_WAITING, _INFERENCE_ACTIVE
    with _INFERENCE_STATE_LOCK:
        _INFERENCE_WAITING += 1
    acquired = False
    try:
        acquired = _SEMAPHORE.acquire(timeout=INFERENCE_QUEUE_TIMEOUT_SECONDS)
        if not acquired:
            with _METRICS_LOCK:
                _METRICS["backpressure_rejections"] += 1
            raise HTTPException(status_code=503, detail="background-removal capacity temporarily saturated")
        with _INFERENCE_STATE_LOCK:
            _INFERENCE_ACTIVE += 1
        yield
    finally:
        with _INFERENCE_STATE_LOCK:
            _INFERENCE_WAITING = max(0, _INFERENCE_WAITING - 1)
            if acquired:
                _INFERENCE_ACTIVE = max(0, _INFERENCE_ACTIVE - 1)
        if acquired:
            _SEMAPHORE.release()


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




def subject_lane_for(image: Image.Image, category: str, conditions: list[str]) -> tuple[str, str]:
    """Classify into person/product locally; ambiguous inputs compare both lanes."""
    if category in {"hard-goods", "footwear", "furniture", "glass-transparent", "jewelry"}:
        return "product", "category-product"
    try:
        import cv2
        import numpy as np
        rgb=image.convert("RGB")
        rgb.thumbnail((960,960),Image.Resampling.LANCZOS)
        gray=cv2.cvtColor(np.asarray(rgb),cv2.COLOR_RGB2GRAY)
        detector=cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        if not detector.empty():
            faces=detector.detectMultiScale(gray,scaleFactor=1.1,minNeighbors=5,minSize=(28,28))
            if len(faces)>0:
                return "person", "local-face-classifier"
    except Exception:
        pass
    if category in {"hair-fur", "apparel"}:
        return "person", "category-person-fallback"
    if category in {"thin-structures", "general-merchandise"} or "fine-or-busy-edges" in conditions:
        return "ambiguous", "conservative-dual-lane"
    return "product", "category-product-fallback"

def specialist_model_for(category: str) -> tuple[str, str]:
    """Route known difficult categories to a certifiable specialist model lane."""
    if category == "hair-fur":
        return PEOPLE_MODEL, "people-hair-matte"
    if category == "glass-transparent":
        return MATTING_MODEL, "transparent-alpha-matte"
    if category in {"thin-structures", "jewelry"}:
        return FINE_DETAIL_MODEL, "fine-detail-matte"
    if category in {"hard-goods", "footwear", "apparel", "furniture", "general-merchandise"}:
        return PRODUCT_MODEL, "product-detail-matte"
    return DETAIL_MODEL, "detail-matte"



def model_strategy(category: str, conditions: list[str], quality_mode: str, subject_lane: str) -> list[tuple[str, bool, str]]:
    """94 BiRefNet-first routing.

    Fast mode uses the lighter general model. Auto mode chooses a person/product
    primary lane and escalates only when the image is difficult. Quality mode is
    handled in remove_background so ambiguous inputs can compare portrait/general
    candidates before an optional stronger matting retry.
    """
    lane = subject_lane
    if quality_mode == "fast":
        return [(STANDARD_MODEL, False, "fast-general-lite")]

    if lane == "person":
        strategies: list[tuple[str, bool, str]] = [(PEOPLE_MODEL, True, "person-portrait")]
    elif lane == "product":
        strategies = [(PRODUCT_MODEL, True, "product-general")]
    else:
        strategies = [(STANDARD_MODEL, False, "ambiguous-general-lite")]

    hard = category in {"thin-structures", "hair-fur", "glass-transparent", "jewelry", "apparel"}
    if hard or conditions:
        specialist_model, specialist_strategy = specialist_model_for(category)
        if all(model != specialist_model for model, _, _ in strategies):
            strategies.append((specialist_model, True, specialist_strategy))
    if category in {"glass-transparent", "hair-fur", "thin-structures", "jewelry"}:
        if all(model != MATTING_MODEL for model, _, _ in strategies):
            strategies.append((MATTING_MODEL, True, "detail-soft-matte"))
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
        if strategy in {"quality-retry-detail-matte", "ultra-detail-matte"}:
            kwargs.update(alpha_matting=True, alpha_matting_foreground_threshold=215, alpha_matting_background_threshold=30, alpha_matting_erode_size=2)
        elif strategy in {"detail-soft-matte", "transparent-alpha-matte", "people-hair-matte", "fine-detail-matte"}:
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


def _candidate_assigned(image_digest: str) -> bool:
    if not CANDIDATE_MODEL or not CANDIDATE_PRODUCTION_APPROVED or CANDIDATE_TRAFFIC_PERCENT <= 0:
        return False
    bucket = int(hashlib.sha256(("yaposan93-release:" + image_digest).encode()).hexdigest()[:8], 16) % 10000
    return bucket < int(CANDIDATE_TRAFFIC_PERCENT * 100)


def record_metric(category:str,status:str,elapsed:int,model:str):
    with _METRICS_LOCK:
        _METRICS["processed"]+=1;_METRICS[f"status_{status}"]+=1;_METRICS["processing_ms_total"]+=elapsed;_METRICS[f"model_{model}"]+=1
        _METRICS[f"model_processing_ms_{model}"] += elapsed
        _METRICS["estimated_infra_cost_microusd"] += int((elapsed / 3_600_000.0) * INFRA_COST_USD_PER_HOUR * 1_000_000)
        cm=_CATEGORY_METRICS.setdefault(category,Counter());cm["processed"]+=1;cm[f"status_{status}"]+=1;cm["processing_ms_total"]+=elapsed


@app.get("/health")
def health():
    return {"status":"ok","engine":"rembg","standard_model":STANDARD_MODEL,"detail_model":DETAIL_MODEL,"paid_api":False,"phase":"94","max_concurrency":MAX_CONCURRENCY,"max_pixels":MAX_PIXELS}


@app.post("/warmup")
def warmup():
    started=time.perf_counter();session_for(STANDARD_MODEL);session_for(DETAIL_MODEL)
    return {"status":"ready","models":[STANDARD_MODEL,DETAIL_MODEL],"warmup_ms":int((time.perf_counter()-started)*1000),"phase":"94"}




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




def alpha_diagnostics(alpha: Image.Image) -> dict:
    """Return mask diagnostics used by the final-output quality gate.

    This helper intentionally reuses the engine's existing connected-component
    logic and does not require an additional paid API or runtime dependency.
    """
    a = alpha.convert("L")
    hist = a.histogram()
    total = max(1, a.width * a.height)
    soft = sum(hist[6:250]) / total

    px = a.load()
    w, h = a.size
    border_pixels = []
    if w and h:
        for x in range(w):
            border_pixels.extend((px[x, 0], px[x, h - 1]))
        for y in range(1, max(1, h - 1)):
            border_pixels.extend((px[0, y], px[w - 1, y]))
    border_leak = sum(1 for p in border_pixels if p >= 32) / max(1, len(border_pixels))

    return {
        "border_leak_fraction": round(border_leak, 6),
        "component_count": int(connected_components(a)),
        "soft_alpha_fraction": round(soft, 6),
    }


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
    for model in dict.fromkeys((STANDARD_MODEL, DETAIL_MODEL, MATTING_MODEL, PEOPLE_MODEL, PRODUCT_MODEL, FINE_DETAIL_MODEL)):
        try:
            session_for(model); ready.append({"model":model,"ready":True})
        except Exception as exc:
            ready.append({"model":model,"ready":False,"error":type(exc).__name__})
    return {"phase":"94","models":ready,"max_concurrency":MAX_CONCURRENCY,
            "gpu_cpu_fallback":"onnxruntime-provider-dependent","paid_api_cost_usd":0}

@app.get("/metrics")
def metrics():
    with _METRICS_LOCK:
        processed=_METRICS.get("processed",0)
        return {
            "phase":"94","processed":processed,"pass":_METRICS.get("status_pass",0),"review":_METRICS.get("status_review",0),
            "failed":_METRICS.get("status_failed",0),"duplicate_cache_hits":_METRICS.get("duplicate_cache_hits",0),
            "average_processing_ms":round(_METRICS.get("processing_ms_total",0)/processed,1) if processed else 0,
            "categories":{k:dict(v) for k,v in _CATEGORY_METRICS.items()},"feedback":dict(_FEEDBACK),"training_examples_opt_in":_METRICS.get("training_examples_opt_in",0),"training_examples_deleted_by_request":_METRICS.get("training_examples_deleted_by_request",0),"training_examples_expired_deleted":_METRICS.get("training_examples_expired_deleted",0),"retention_cleanup_errors":_METRICS.get("retention_cleanup_errors",0),"backpressure_rejections":_METRICS.get("backpressure_rejections",0),"model_version":MODEL_VERSION,"estimated_infra_cost_usd":round(_METRICS.get("estimated_infra_cost_microusd",0)/1_000_000.0,6),"infra_cost_usd_per_hour":INFRA_COST_USD_PER_HOUR,"candidate_evaluations":_METRICS.get("candidate_evaluations",0),"candidate_shadow_mode":CANDIDATE_SHADOW_MODE,"candidate_traffic_percent":CANDIDATE_TRAFFIC_PERCENT,"candidate_production_approved":CANDIDATE_PRODUCTION_APPROVED,"paid_api_cost_usd":0,
        }


def _decode_png_mask(value: str) -> Image.Image:
    try:
        raw=base64.b64decode(value, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="invalid correction mask") from exc
    if len(raw) > CORRECTION_MAX_MASK_BYTES:
        raise HTTPException(status_code=413, detail="correction mask too large")
    try:
        im=Image.open(io.BytesIO(raw)); im.load()
        if im.width * im.height > MAX_PIXELS:
            raise HTTPException(status_code=413, detail="correction mask pixel count too large")
        return im.getchannel("A") if im.mode == "RGBA" else im.convert("L")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="invalid correction mask") from exc


def _cleanup_expired_corrections(force: bool = False) -> dict:
    global _LAST_RETENTION_CLEANUP
    now=time.time()
    with _RETENTION_LOCK:
        if not force and now - _LAST_RETENTION_CLEANUP < CORRECTION_CLEANUP_INTERVAL_SECONDS:
            return {"ran":False,"deleted":0}
        _LAST_RETENTION_CLEANUP=now
        root=PHASE2_DATA_DIR / "corrections"
        deleted=0; errors=0
        if not root.exists():
            return {"ran":True,"deleted":0,"errors":0}
        for d in root.iterdir():
            if not d.is_dir():
                continue
            meta_path=d / "metadata.json"
            try:
                meta=json.loads(meta_path.read_text(encoding="utf-8"))
                created=float(meta.get("created_unix",0)); days=max(1,int(meta.get("retention_days",CORRECTION_RETENTION_DAYS)))
                if created and now >= created + days*86400:
                    for child in d.iterdir():
                        if child.is_file(): child.unlink()
                    d.rmdir(); deleted += 1
            except Exception:
                errors += 1
        with _METRICS_LOCK:
            _METRICS["training_examples_expired_deleted"] += deleted
            _METRICS["retention_cleanup_errors"] += errors
        return {"ran":True,"deleted":deleted,"errors":errors}


def _save_png(im: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True); im.save(path, format="PNG")


def _atomic_write_correction(example_id: str, original: Image.Image, corrected: Image.Image, ai: Image.Image | None, meta: dict) -> Path:
    corrections_root = PHASE2_DATA_DIR / "corrections"
    corrections_root.mkdir(parents=True, exist_ok=True)
    final_root = corrections_root / example_id
    temp_root = corrections_root / (".tmp-" + example_id)
    if temp_root.exists():
        shutil.rmtree(temp_root, ignore_errors=True)
    temp_root.mkdir(parents=True, exist_ok=False)
    try:
        _save_png(original.convert("RGBA"), temp_root / "original.png")
        _save_png(corrected, temp_root / "corrected-mask.png")
        if ai is not None:
            _save_png(ai, temp_root / "ai-mask.png")
        meta_bytes = (json.dumps(meta, indent=2, sort_keys=True) + "\n").encode("utf-8")
        with (temp_root / "metadata.json").open("wb") as f:
            f.write(meta_bytes); f.flush(); os.fsync(f.fileno())
        os.replace(temp_root, final_root)
        return final_root
    except Exception:
        shutil.rmtree(temp_root, ignore_errors=True)
        raise


def _validated_example_dir(example_id: str) -> Path:
    try:
        canonical = str(uuid.UUID(example_id))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="invalid correction example id") from exc
    if canonical != example_id.lower():
        raise HTTPException(status_code=400, detail="invalid correction example id")
    return PHASE2_DATA_DIR / "corrections" / canonical


@app.post("/correction-example")
def correction_example(req: CorrectionExample, x_yaposan_phase2_token: str | None = Header(default=None)):
    """Opt-in training capture protected by service authentication and storage policy gates."""
    _require_phase2_service_token(x_yaposan_phase2_token)
    _assert_phase2_storage_policy()
    _check_correction_rate_limit()
    _cleanup_expired_corrections()
    if not req.consent_for_training:
        return {"status":"not-retained","reason":"training-consent-required","stores_image":False}
    if _stored_correction_count() >= CORRECTION_MAX_STORED_EXAMPLES:
        raise HTTPException(status_code=507, detail="correction storage quota reached")
    category=req.category if req.category in CATEGORY_VALUES else "general-merchandise"
    shadow=RemoveRequest(image_base64=req.image_base64,mime_type=req.mime_type,category_hint=category)
    _,original,digest=decode_image(shadow)
    corrected=_decode_png_mask(req.corrected_mask_base64)
    if corrected.size != original.size:
        raise HTTPException(status_code=422,detail="corrected mask dimensions must match image")
    ai=_decode_png_mask(req.ai_mask_base64) if req.ai_mask_base64 else None
    if ai is not None and ai.size != original.size:
        raise HTTPException(status_code=422,detail="AI mask dimensions must match image")
    example_id=str(uuid.uuid4())
    meta={"schema_version":2,"example_id":example_id,"image_sha256":digest,"category":category,"failure_reason":req.failure_reason[:160],"consent_for_training":True,"consent_record_id":req.consent_record_id,"consent_version":req.consent_version,"source_request_id":req.source_request_id,"model_version":MODEL_VERSION,"created_unix":int(time.time()),"retention_days":CORRECTION_RETENTION_DAYS,"storage_encryption_attested":PHASE2_STORAGE_ENCRYPTED}
    _atomic_write_correction(example_id, original, corrected, ai, meta)
    with _METRICS_LOCK:_METRICS["training_examples_opt_in"]+=1
    return {"status":"retained","example_id":example_id,"category":category,"model_version":MODEL_VERSION,"retention_days":CORRECTION_RETENTION_DAYS}


@app.post("/correction-example/delete")
def delete_correction_example(req: DeleteCorrectionRequest, x_yaposan_phase2_token: str | None = Header(default=None)):
    """Delete a retained correction when consent is withdrawn or privacy deletion is requested."""
    _require_phase2_service_token(x_yaposan_phase2_token)
    root = _validated_example_dir(req.example_id)
    if not root.exists():
        return {"status":"not-found","example_id":req.example_id}
    tombstones = PHASE2_DATA_DIR / "deletion-audit"
    tombstones.mkdir(parents=True, exist_ok=True)
    meta = {}
    try:
        meta = json.loads((root / "metadata.json").read_text(encoding="utf-8"))
    except Exception:
        pass
    shutil.rmtree(root)
    audit={"schema_version":1,"example_id":req.example_id,"image_sha256":meta.get("image_sha256"),"deleted_unix":int(time.time()),"reason":req.reason[:160]}
    (tombstones / f"{req.example_id}.json").write_text(json.dumps(audit,sort_keys=True)+"\n",encoding="utf-8")
    with _METRICS_LOCK:_METRICS["training_examples_deleted_by_request"]+=1
    return {"status":"deleted","example_id":req.example_id}


@app.get("/phase2-status")
def phase2_status(x_yaposan_phase2_token: str | None = Header(default=None)):
    _require_phase2_service_token(x_yaposan_phase2_token)
    cleanup=_cleanup_expired_corrections()
    with _INFERENCE_STATE_LOCK:
        waiting,active=_INFERENCE_WAITING,_INFERENCE_ACTIVE
    return {"phase":"Yaposan-94","model_version":MODEL_VERSION,"deployment_env":DEPLOYMENT_ENV,"correction_capture":"explicit-opt-in-only","service_auth_required":PHASE2_REQUIRE_SERVICE_AUTH,"encrypted_storage_required":PHASE2_REQUIRE_ENCRYPTED_STORAGE,"encrypted_storage_attested":PHASE2_STORAGE_ENCRYPTED,"retention_enforcement":"automatic-on-phase2-traffic","retention_days":CORRECTION_RETENTION_DAYS,"correction_max_mask_bytes":CORRECTION_MAX_MASK_BYTES,"correction_rate_limit_per_minute":CORRECTION_RATE_LIMIT_PER_MINUTE,"correction_max_stored_examples":CORRECTION_MAX_STORED_EXAMPLES,"stored_examples":_stored_correction_count(),"last_cleanup":cleanup,"inference":{"active":active,"waiting":waiting,"max_concurrency":MAX_CONCURRENCY,"queue_timeout_seconds":INFERENCE_QUEUE_TIMEOUT_SECONDS},"training_pipeline":"dataset-versioning/export ready; proprietary model requires approved training and certification","paid_api_cost_usd":0}


@app.get("/health/accelerator")
def accelerator_health():
    providers=[]
    try:
        import onnxruntime as ort
        providers=ort.get_available_providers()
    except Exception:
        providers=[]
    gpu={"available":any("CUDA" in p or "Tensorrt" in p for p in providers),"providers":providers}
    try:
        proc=subprocess.run(["nvidia-smi","--query-gpu=name,memory.total,memory.used,utilization.gpu","--format=csv,noheader,nounits"],capture_output=True,text=True,timeout=2,check=False)
        if proc.returncode == 0 and proc.stdout.strip():
            rows=[]
            for line in proc.stdout.strip().splitlines():
                parts=[x.strip() for x in line.split(",")]
                if len(parts)>=4: rows.append({"name":parts[0],"memory_total_mb":int(parts[1]),"memory_used_mb":int(parts[2]),"utilization_percent":int(parts[3])})
            gpu["nvidia_smi"]=rows
    except Exception:
        gpu["nvidia_smi"]=[]
    return {"phase":"Yaposan-94","accelerator":gpu,"cpu_fallback":True}


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
    return {"image_sha256":digest,"width":image.width,"height":image.height,"megapixels":round(image.width*image.height/1_000_000,3),"difficulty_score":round(difficulty,4),"visual_conditions":reasons,"category":category,"mean_rgb":[round(v/255.0,5) for v in st.mean],"mean_luma":round(sum(st.mean)/(3*255.0),5),"paid_api_cost_usd":0,"phase":"94"}


@app.post("/remove-background")
def remove_background(req:RemoveRequest):
    if req.background not in {"transparent","white","custom"}:raise HTTPException(status_code=400,detail="invalid background")
    if req.quality_mode not in {"auto","fast","quality","ultra"}:raise HTTPException(status_code=400,detail="invalid quality mode")
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

    with inference_slot():
        difficulty,difficulty_reasons,stats=difficulty_score(original)
        category=routed_category(req,difficulty_reasons)
        candidate_assigned=_candidate_assigned(digest)
        candidate_probe=None
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

        subject_lane,classification_method=subject_lane_for(original,category,difficulty_reasons)

        if req.quality_mode == "quality":
            # 94: classify first, then use the matching BiRefNet lane.
            # Ambiguous images compare portrait/general outputs and let the quality
            # gate choose the cleaner finished cutout.
            if subject_lane == "person":
                add_candidate(PEOPLE_MODEL,True,"person-portrait")
            elif subject_lane == "product":
                add_candidate(PRODUCT_MODEL,True,"product-general")
            else:
                add_candidate(PEOPLE_MODEL,True,"ambiguous-person-portrait")
                if PRODUCT_MODEL != PEOPLE_MODEL:
                    add_candidate(PRODUCT_MODEL,True,"ambiguous-product-general")

            # QUALITY CHECK -> RETRY with stronger matting settings only when needed.
            initial_best=max(candidates,key=lambda c:c["score"])
            needs_retry=initial_best["status"]!="pass" or initial_best["score"]<RETRY_SCORE or category in {"glass-transparent","hair-fur","thin-structures","jewelry"}
            if needs_retry and not any(c["strategy"]=="quality-retry-detail-matte" for c in candidates):
                add_candidate(MATTING_MODEL,True,"quality-retry-detail-matte")

        elif req.quality_mode == "ultra":
            # Premium lane: portrait/general classification plus a mandatory
            # full-detail matte candidate.
            if subject_lane == "person":
                add_candidate(PEOPLE_MODEL,True,"person-portrait")
            elif subject_lane == "product":
                add_candidate(PRODUCT_MODEL,True,"product-general")
            else:
                add_candidate(PEOPLE_MODEL,True,"ambiguous-person-portrait")
                if PRODUCT_MODEL != PEOPLE_MODEL:
                    add_candidate(PRODUCT_MODEL,True,"ambiguous-product-general")
            if all(c["model"]!=MATTING_MODEL for c in candidates):
                add_candidate(MATTING_MODEL,True,"ultra-detail-matte")

        elif req.quality_mode == "fast":
            add_candidate(STANDARD_MODEL,False,"fast-general-lite")
        else:
            strategies=model_strategy(category,difficulty_reasons,req.quality_mode,subject_lane)
            for model,detail,strategy in strategies:
                add_candidate(model,detail,strategy)
                first=candidates[0]
                if len(candidates)==1 and force_white_product_detail:
                    continue
                if len(candidates)==1 and difficulty<AUTO_DETAIL_DIFFICULTY and first["score"]>=RETRY_SCORE and first["status"]=="pass":
                    break
            if force_white_product_detail and not any(c["model"]==DETAIL_MODEL for c in candidates):
                add_candidate(DETAIL_MODEL,True,"white-on-white-detail-matte")

        if candidate_assigned:
            candidate_started=time.perf_counter()
            result=remove_with_retry(raw,CANDIDATE_MODEL,True,"candidate-release-lane")
            candidate_fg=Image.open(io.BytesIO(result)).convert("RGBA")
            if candidate_fg.size!=original.size:candidate_fg=candidate_fg.resize(original.size,Image.Resampling.LANCZOS)
            candidate_fg=refine_alpha(candidate_fg,category);candidate_fg=specialized_matte(candidate_fg,category);candidate_fg=decontaminate_edges(original,candidate_fg)
            candidate_score,candidate_status,candidate_reasons,candidate_diagnostics=analyze_cutout(candidate_fg,original.size)
            candidate_probe={"model":CANDIDATE_MODEL,"strategy":"candidate-release-lane","score":candidate_score,"status":candidate_status,"reasons":candidate_reasons,"fg":candidate_fg,"diagnostics":candidate_diagnostics}
            candidate_ms=int((time.perf_counter()-candidate_started)*1000)
            with _METRICS_LOCK:
                _METRICS["candidate_evaluations"] += 1
                _METRICS["candidate_processing_ms_total"] += candidate_ms
                _METRICS[f"candidate_status_{candidate_status}"] += 1
            if not CANDIDATE_SHADOW_MODE:
                candidates=[candidate_probe]

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
            "difficulty_score":round(difficulty,4),"category":category,"subject_lane":subject_lane,"classification_method":classification_method,"visual_conditions":difficulty_reasons,
            "used_model":best["model"],"used_strategy":best["strategy"],"retried":len(candidates)>1,
            "candidate_count":len(candidates),"model_agreement_iou":round(agreement,4),"mask_diagnostics":best["diagnostics"],
            "final_output_score":best.get("final_output",{}),"product_integrity":best.get("product_integrity",{}),
            "foreground_geometry":geom_before,"output_foreground_geometry":output_geom,"processing_ms":elapsed,"original_width":original.width,"original_height":original.height,
            "output_width":fg.width,"output_height":fg.height,"high_resolution_mode":"full-resolution-staged" if high_res else "standard",
            "duplicate_hit":False,"paid_api_cost_usd":0,"product_pixel_policy":"original-pixels-default; lighting-normalization-explicit-opt-in",
            "shadow_policy":"disabled-for-strict-pure-white; conservative-extraction-otherwise","strict_white":strict_white_enabled,"white_background_audit":white_audit,"post_export_white_audit":post_export_audit,"white_on_white_detail_forced":force_white_product_detail,"engine_version":"94",
            "input_stats":{k:round(float(v),5) for k,v in stats.items()},"model_version":MODEL_VERSION,"release_assignment":"candidate-shadow" if candidate_assigned and CANDIDATE_SHADOW_MODE else ("candidate-canary" if candidate_assigned else "stable"),"candidate_model_version":CANDIDATE_MODEL_VERSION if candidate_assigned else None,"candidate_shadow_score":round(float(candidate_probe["score"]),4) if candidate_probe is not None and CANDIDATE_SHADOW_MODE else None,"estimated_infra_cost_usd":round((elapsed/3_600_000.0)*INFRA_COST_USD_PER_HOUR,8),
        }
        record_metric(category,status,elapsed,best["model"]);cache_put(cache_key,response);return response

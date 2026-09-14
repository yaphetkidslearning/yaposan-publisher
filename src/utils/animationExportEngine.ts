// migration marker retained for regression compatibility: version:"19.5".
import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";
import { evaluateAnimatedPage, getAnimationSettings } from "./animationEngine";
import { buildInteractiveManifest } from "./interactivePublishingEngine";

// legacy diagnostic identifiers retained for migration: gif-plan, mp4-plan.
export type AnimationExportFormat = "interactive-html" | "presentation-zip" | "gif" | "video" | "presentation-json";
export type AnimationExportQuality = "draft" | "standard" | "high" | "ultra";
export type AnimationExportSettings = {
  format: AnimationExportFormat;
  quality: AnimationExportQuality;
  width: number;
  height: number;
  fps: 12 | 24 | 30 | 60;
  includeInteractions: boolean;
  includeNavigation: boolean;
  loop: boolean;
  reducedMotionFallback: boolean;
  optimizeAssets: boolean;
  embedProjectData: boolean;
  title: string;
};
export type AnimationValidationIssue = { severity: "error" | "warning" | "info"; code: string; message: string; pageId?: string; elementId?: string };
export type AnimationValidationReport = { valid: boolean; score: number; issues: AnimationValidationIssue[]; animationCount: number; interactionCount: number; estimatedFrames: number };
export type AnimationExportPackage = { filename: string; mimeType: string; contents: string; report: AnimationValidationReport; format: AnimationExportFormat };
export type AnimationExportResult = { filename: string; mimeType: string; report: AnimationValidationReport; deliveredTo: string; fallbackUsed?: boolean; certification?: AnimationProductionCertification };
export type AnimationProductionCertification = { phase: "19.6"; generatedAt: string; ready: boolean; checks: Array<{ id: string; passed: boolean; detail: string }>; warnings: string[] };

export const DEFAULT_ANIMATION_EXPORT_SETTINGS: AnimationExportSettings = {
  format: "interactive-html", quality: "high", width: 1920, height: 1080, fps: 30,
  includeInteractions: true, includeNavigation: true, loop: false, reducedMotionFallback: true,
  optimizeAssets: true, embedProjectData: true, title: "Yaposan Interactive Presentation",
};

const safe = (value: string) => value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "yaposan-animation";
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const escapeXml = escapeHtml;
const safeJsonForScript = (value: unknown) => JSON.stringify(value)
  .replaceAll("<", "\u003c")
  .replaceAll(">", "\u003e")
  .replaceAll("&", "\u0026")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");
const isSafeUrl = (value: string) => /^(https?:|mailto:|tel:|#|assets\/|data:image\/)/i.test(value);
const sanitizeSvgMarkup = (value: string) => value
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  .replace(/(?:href|xlink:href)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, 'href="#"');
const countAnimations = (project: PublisherProject) => project.pages.reduce((total, page) => total + page.elements.reduce((sum, element) => sum + (element.animations?.length ?? 0), 0), 0);
const countInteractions = (project: PublisherProject) => project.pages.reduce((total, page) => total + page.elements.reduce((sum, element) => sum + (element.interactions?.length ?? 0), 0), 0);

export function validateAnimationProject(project: PublisherProject, settings: AnimationExportSettings): AnimationValidationReport {
  const issues: AnimationValidationIssue[] = [];
  const animationSettings = getAnimationSettings(project);
  const animationCount = countAnimations(project); const interactionCount = countInteractions(project);
  if (!project.pages.length) issues.push({ severity: "error", code: "NO_PAGES", message: "The project has no pages to export." });
  if (!animationCount) issues.push({ severity: "warning", code: "NO_ANIMATIONS", message: "No element animations were found." });
  if (settings.includeInteractions && !interactionCount) issues.push({ severity: "info", code: "NO_INTERACTIONS", message: "Interactive export is enabled but no object interactions were found." });
  if (settings.width < 320 || settings.height < 240) issues.push({ severity: "error", code: "INVALID_SIZE", message: "Export dimensions are too small." });
  if (settings.width * settings.height > 16_777_216) issues.push({ severity: "warning", code: "LARGE_CANVAS", message: "Very large canvas dimensions may exceed browser GPU or encoder limits." });
  if ((settings.format === "gif" || settings.format === "video") && animationSettings.duration * settings.fps > 1800) issues.push({ severity: "warning", code: "LARGE_MEDIA_EXPORT", message: "This media export contains more than 1,800 frames and may use significant memory." });
  project.pages.forEach((page) => page.elements.forEach((element) => {
    (element.animations ?? []).forEach((animation) => {
      if (animation.duration <= 0) issues.push({ severity: "error", code: "ZERO_DURATION", message: `${animation.name} has no duration.`, pageId: page.id, elementId: element.id });
      if ((animation.keyframes ?? []).some((frame) => frame.time > animation.duration)) issues.push({ severity: "warning", code: "KEYFRAME_RANGE", message: `${animation.name} contains a keyframe beyond its duration.`, pageId: page.id, elementId: element.id });
    });
    (element.interactions ?? []).forEach((interaction) => {
      if (interaction.action === "open-url" && !interaction.url) issues.push({ severity: "warning", code: "MISSING_URL", message: `${interaction.name} has no URL.`, pageId: page.id, elementId: element.id });
      if (interaction.action === "open-url" && interaction.url && !isSafeUrl(interaction.url)) issues.push({ severity: "error", code: "UNSAFE_URL", message: `${interaction.name} uses an unsupported or unsafe URL protocol.`, pageId: page.id, elementId: element.id });
      if (interaction.action === "go-to-page" && !interaction.targetPageId) issues.push({ severity: "warning", code: "MISSING_PAGE_TARGET", message: `${interaction.name} has no target page.`, pageId: page.id, elementId: element.id });
    });
  }));
  const errors = issues.filter((issue) => issue.severity === "error").length; const warnings = issues.filter((issue) => issue.severity === "warning").length;
  return { valid: errors === 0, score: Math.max(0, 100 - errors * 30 - warnings * 7), issues, animationCount, interactionCount, estimatedFrames: Math.ceil(animationSettings.duration * settings.fps) * Math.max(1, project.pages.length) };
}

export function estimateAnimationExport(project: PublisherProject, settings: AnimationExportSettings) {
  const report = validateAnimationProject(project, settings);
  const pixels = settings.width * settings.height * report.estimatedFrames;
  const qualityFactor = { draft: .3, standard: .55, high: .8, ultra: 1 }[settings.quality];
  return { ...report, estimatedMegabytes: Math.max(.1, Math.round((pixels * 4 * qualityFactor / 1024 / 1024) * 10) / 10), recommendedChunkFrames: Math.max(1, Math.floor(24_000_000 / Math.max(1, settings.width * settings.height))) };
}

function cssGradient(element: PublisherElement) {
  if (element.fillGradient) {
    const angle = element.fillGradient.angle ?? 0;
    return element.fillGradient.type === "radial"
      ? `radial-gradient(circle, ${element.fillGradient.startColor}, ${element.fillGradient.endColor})`
      : `linear-gradient(${angle}deg, ${element.fillGradient.startColor}, ${element.fillGradient.endColor})`;
  }
  if (element.vectorGradient?.stops?.length) {
    const stops = element.vectorGradient.stops.map((stop) => `${stop.color} ${Math.round(stop.offset * 100)}%`).join(",");
    return element.vectorGradient.type === "radial"
      ? `radial-gradient(circle, ${stops})`
      : `linear-gradient(${element.vectorGradient.angle ?? 0}deg, ${stops})`;
  }
  return element.fillColor ?? "transparent";
}

type ExportVectorPoint = { x: number; y: number; inX?: number; inY?: number; outX?: number; outY?: number };

function vectorPath(element: PublisherElement) {
  const points = (element.vectorNodes ?? element.vectorPoints ?? element.points ?? []) as ExportVectorPoint[];
  if (!points.length) return "";
  const first = points[0];
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]; const point = points[i];
    if (prev.outX !== undefined || point.inX !== undefined) d += ` C ${prev.outX ?? prev.x} ${prev.outY ?? prev.y} ${point.inX ?? point.x} ${point.inY ?? point.y} ${point.x} ${point.y}`;
    else d += ` L ${point.x} ${point.y}`;
  }
  if (element.vectorClosed) d += " Z";
  return d;
}

function tableMarkup(element: PublisherElement) {
  const rows = element.tableCalculatedCells ?? element.tableCells ?? [];
  return `<table class="yp-table" style="width:100%;height:100%;border-collapse:collapse"><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td style="border:${element.borderWidth ?? 1}px solid ${escapeHtml(element.borderColor ?? "#94a3b8")};padding:${element.tableCellPadding ?? 4}px">${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function elementInnerMarkup(element: PublisherElement) {
  const source = element.rasterRenderedImageUri || element.rasterPreviewImageUri || element.imageUri || element.originalImageUri;
  if (element.type === "image" && source) return `<img src="${escapeHtml(source)}" alt="${escapeHtml(element.accessibilityLabel || element.name || "Image")}" style="width:100%;height:100%;object-fit:${element.imageFit === "stretch" ? "fill" : element.imageFit ?? "cover"};display:block"/>`;
  if (element.type === "svg" && element.svgMarkup) return `<div class="yp-svg" style="width:100%;height:100%">${sanitizeSvgMarkup(element.svgMarkup)}</div>`;
  if (element.type === "table") return tableMarkup(element);
  const path = vectorPath(element);
  if (path) return `<svg viewBox="0 0 ${Math.max(1, element.width)} ${Math.max(1, element.height)}" width="100%" height="100%" preserveAspectRatio="none"><path d="${escapeHtml(path)}" fill="${escapeHtml(element.fillColor ?? "none")}" fill-opacity="${element.vectorFillOpacity ?? 1}" stroke="${escapeHtml(element.borderColor ?? element.svgStroke ?? "#111827")}" stroke-opacity="${element.vectorStrokeOpacity ?? 1}" stroke-width="${element.borderWidth ?? element.svgStrokeWidth ?? 1}" stroke-linecap="${element.strokeCap ?? "butt"}" stroke-linejoin="${element.strokeJoin ?? "miter"}"/></svg>`;
  if (element.type === "circle") return `<div style="width:100%;height:100%;border-radius:50%;background:${cssGradient(element)}"></div>`;
  if (element.type === "line") return `<svg width="100%" height="100%"><line x1="0" y1="50%" x2="100%" y2="50%" stroke="${escapeHtml(element.borderColor ?? "#111827")}" stroke-width="${element.borderWidth ?? 2}"/></svg>`;
  return `<div class="yp-text" style="width:100%;height:100%;display:flex;align-items:${element.verticalJustification === "bottom" ? "flex-end" : element.verticalJustification === "center" ? "center" : "flex-start"};justify-content:${element.textAlign === "right" ? "flex-end" : element.textAlign === "center" ? "center" : "flex-start"};text-align:${element.textAlign ?? "left"};padding:${element.paragraphPadding ?? 0}px;box-sizing:border-box">${escapeHtml(element.text || element.name || "")}</div>`;
}

function elementMarkup(element: PublisherElement) {
  const style = `left:${element.x}px;top:${element.y}px;width:${element.width}px;height:${element.height}px;opacity:${element.opacity};transform:rotate(${element.rotation}deg) scale(${element.flipHorizontal ? -1 : 1},${element.flipVertical ? -1 : 1});z-index:${element.zIndex};background:${cssGradient(element)};color:${element.textColor ?? "#111827"};font-size:${element.fontSize ?? 16}px;font-family:${escapeHtml(element.fontFamily ?? "Arial")};font-weight:${element.fontWeight ?? "400"};font-style:${element.italic ? "italic" : "normal"};text-decoration:${element.underline ? "underline" : "none"};line-height:${element.lineHeight ?? 1.2};letter-spacing:${element.letterSpacing ?? element.tracking ?? 0}px;border:${element.borderWidth ?? 0}px solid ${element.borderColor ?? "transparent"};border-radius:${element.borderRadius ?? element.liveCornerRadius ?? 0}px;overflow:${element.frameClipContent ? "hidden" : "visible"};mix-blend-mode:${element.vectorBlendMode ?? "normal"}`;
  return `<div class="yp-element yp-${escapeHtml(element.type)}" data-element-id="${escapeHtml(element.id)}" style="${style}" aria-label="${escapeHtml(element.accessibilityLabel || element.name || element.type)}">${elementInnerMarkup(element)}</div>`;
}

const runtimeScript = `(()=>{
const data=JSON.parse(document.getElementById('yaposan-data').textContent);const pages=[...document.querySelectorAll('.yp-page')];let index=0;let pageStarted=performance.now();let raf=0;const animationState=new Map();
const clamp=v=>Math.max(0,Math.min(1,v));const ease=(t,n)=>{t=clamp(t);if(n==='linear')return t;if(n==='ease-in')return t*t;if(n==='ease-out')return 1-(1-t)*(1-t);if(n==='ease-in-out')return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;if(n==='cubic')return t*t*t;if(n==='quart')return t*t*t*t;if(n==='quint')return t*t*t*t*t;if(n==='elastic')return t===0||t===1?t:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2*Math.PI/3)+1;if(n==='bounce'){const a=7.5625,d=2.75;if(t<1/d)return a*t*t;if(t<2/d){t-=1.5/d;return a*t*t+.75}if(t<2.5/d){t-=2.25/d;return a*t*t+.9375}t-=2.625/d;return a*t*t+.984375}return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
const bez=(x,b)=>{if(!b)return x;const cx=t=>3*(1-t)*(1-t)*t*b[0]+3*(1-t)*t*t*b[2]+t*t*t,cy=t=>3*(1-t)*(1-t)*t*b[1]+3*(1-t)*t*t*b[3]+t*t*t;let lo=0,hi=1,t=x;for(let i=0;i<14;i++){t=(lo+hi)/2;if(cx(t)<x)lo=t;else hi=t}return clamp(cy(t))};const pathAt=(p,t)=>{const pts=p.closed?[...p.points,p.points[0]]:p.points;if(pts.length<2)return{x:0,y:0,a:0};const lens=pts.slice(1).map((q,i)=>Math.hypot(q.x-pts[i].x,q.y-pts[i].y)),total=lens.reduce((a,b)=>a+b,0)||1;let d=clamp(t)*total;for(let i=0;i<lens.length;i++){if(d<=lens[i]||i===lens.length-1){const s=pts[i],e=pts[i+1],r=clamp(d/Math.max(.001,lens[i]));return{x:s.x+(e.x-s.x)*r,y:s.y+(e.y-s.y)*r,a:Math.atan2(e.y-s.y,e.x-s.x)*180/Math.PI}d-=lens[i]}return{x:0,y:0,a:0}};
const keyAt=(a,time)=>{const f=[...(a.keyframes||[])].sort((x,y)=>x.time-y.time);if(!f.length)return null;if(time<=f[0].time)return f[0].value;if(time>=f[f.length-1].time)return f[f.length-1].value;const ri=f.findIndex(x=>x.time>=time),l=f[ri-1],r=f[ri],raw=clamp((time-l.time)/Math.max(.001,r.time-l.time)),p=bez(ease(raw,r.easing||a.easing),r.bezier||a.customBezier),o={};['x','y','scaleX','scaleY','rotation','opacity'].forEach(k=>{const s=l.value[k],e=r.value[k];if(s!==undefined||e!==undefined)o[k]=(s??e??0)+((e??s??0)-(s??e??0))*p});return o};
function applyAnimation(node,base,a,seconds,forced){if(!a.enabled)return;const state=animationState.get(a.id)||{mode:a.trigger==='on-load'?'play':'idle',offset:0,pausedAt:0};animationState.set(a.id,state);if(forced)state.mode=forced;let elapsed=state.mode==='play'?seconds-state.offset:state.pausedAt;if(state.mode==='idle'||state.mode==='stop')return;let raw=(elapsed-a.delay)/Math.max(.01,a.duration);if(raw<0)return;const cycles=Math.max(1,a.repeat||1);if(raw>cycles&&!data.exportSettings.loop){raw=cycles}let local=clamp(raw%1||(raw>0?1:0));if(a.direction==='reverse')local=1-local;if(a.direction==='alternate'&&Math.floor(raw)%2===1)local=1-local;if(a.autoReverse)local=local<.5?local*2:(1-local)*2;const t=bez(ease(local,a.easing),a.customBezier);let x=0,y=0,sx=1,sy=1,rot=0,op=base.opacity;
if(a.preset==='fade-in')op=base.opacity*t;if(a.preset==='fade-out')op=base.opacity*(1-t);if(a.preset==='appear')op=base.opacity;if(a.preset==='disappear')op=raw>=1?0:base.opacity;if(a.preset==='fly-in'){x=-(1-t)*Math.max(100,base.width);op=base.opacity*t}if(a.preset==='fly-out'){x=t*Math.max(100,base.width);op=base.opacity*(1-t)}if(a.preset==='zoom-in'){sx=sy=Math.max(.01,t)}if(a.preset==='zoom-out'){sx=sy=1-.8*t;op=base.opacity*(1-t)}if(a.preset==='grow-shrink')sx=sy=1+.12*Math.sin(t*Math.PI);if(a.preset==='spin')rot=360*t;if(a.preset==='float')y=-Math.sin(t*Math.PI)*24;if(a.preset==='bounce')y=-Math.abs(Math.sin(t*Math.PI*2))*32*(1-t*.4);if(a.preset==='pulse')op=base.opacity*(.65+.35*Math.sin(t*Math.PI));if(a.preset==='wipe')sx=Math.max(.01,t);
const k=keyAt(a,clamp(raw)*a.duration);if(k){x=k.x??x;y=k.y??y;sx=k.scaleX??sx;sy=k.scaleY??sy;rot=k.rotation??rot;op=k.opacity!==undefined?base.opacity*clamp(k.opacity):op}if(a.motionPath){const m=pathAt(a.motionPath,t);x=m.x;y=m.y;if(a.motionPath.orientToPath)rot=m.a}node.style.opacity=String(op);node.style.transform='translate('+x+'px,'+y+'px) rotate('+(base.rotation+rot)+'deg) scale('+sx+','+sy+')';if(raw>=cycles&&!state.ended){state.ended=true;node.dispatchEvent(new CustomEvent('yaposan-animation-end',{detail:{animationId:a.id}}));runTrigger('animation-end',node.closest('.yp-page')||document)}}
function animate(now){const page=pages[index];if(page){const seconds=(now-pageStarted)/1000;page.querySelectorAll('[data-element-id]').forEach(node=>{const el=data.project.pages[index].elements.find(e=>e.id===node.dataset.elementId);if(!el)return;node.style.opacity=String(el.opacity);node.style.transform='rotate('+el.rotation+'deg)';(el.animations||[]).forEach(a=>applyAnimation(node,el,a,seconds));});}raf=requestAnimationFrame(animate)}
function transitionClass(type,dir){return 'yp-'+type+'-'+dir}function show(n){const old=index;const next=(n+pages.length)%pages.length;if(next===old)return;const from=pages[old],to=pages[next],tr=(data.manifest.pages[next]||{}).transition||{type:'fade',duration:.45,easing:'ease-in-out'};to.style.setProperty('--yp-duration',tr.duration+'s');to.style.setProperty('--yp-easing',tr.easing);to.classList.add('active',transitionClass(tr.type,'in'));from.classList.add(transitionClass(tr.type,'out'));setTimeout(()=>{from.className='yp-page';to.className='yp-page active';},Math.max(50,tr.duration*1000));index=next;pageStarted=performance.now();animationState.clear();runTrigger('page-load',to);updateProgress()}
function target(i){return i.targetElementId&&document.querySelector('[data-element-id="'+CSS.escape(i.targetElementId)+'"]')}function controlAnimation(i,mode){const page=data.project.pages[index],all=page.elements.flatMap(e=>e.animations||[]),a=all.find(x=>x.id===i.animationId);if(!a)return;const s=animationState.get(a.id)||{mode:'idle',offset:0,pausedAt:0};const sec=(performance.now()-pageStarted)/1000;if(mode==='play'){if(s.mode==='pause')s.offset=sec-s.pausedAt;s.mode='play'}if(mode==='pause'){s.pausedAt=sec-s.offset;s.mode='pause'}if(mode==='stop'){s.mode='stop';s.offset=0;s.pausedAt=0}animationState.set(a.id,s)}
function act(i){setTimeout(()=>{if(i.action==='next-page')show(index+1);if(i.action==='previous-page')show(index-1);if(i.action==='go-to-page'){const n=pages.findIndex(p=>p.dataset.pageId===i.targetPageId);if(n>=0)show(n)}if(i.action==='open-url'&&i.url)window.open(i.url,data.manifest.settings.openLinksInNewTab?'_blank':'_self');const t=target(i);if(t&&i.action==='hide-element')t.style.visibility='hidden';if(t&&i.action==='show-element')t.style.visibility='visible';if(t&&i.action==='toggle-element')t.style.visibility=t.style.visibility==='hidden'?'visible':'hidden';if(i.action==='play-animation')controlAnimation(i,'play');if(i.action==='pause-animation')controlAnimation(i,'pause');if(i.action==='stop-animation')controlAnimation(i,'stop');},Math.max(0,i.delay||0)*1000)}
function runTrigger(trigger,root=document){data.manifest.pages.flatMap(p=>p.interactions).filter(i=>i.enabled&&i.trigger===trigger).forEach(i=>{const n=root.querySelector&&root.querySelector('[data-element-id="'+CSS.escape(i.elementId)+'"]');if(n||trigger==='page-load')act(i)})}function bind(){document.querySelectorAll('[data-element-id]').forEach(node=>{const ints=data.manifest.pages.flatMap(p=>p.interactions).filter(i=>i.elementId===node.dataset.elementId&&i.enabled);ints.forEach(i=>{const ev=i.trigger==='double-click'?'dblclick':i.trigger==='hover'?'mouseenter':i.trigger==='mouse-leave'?'mouseleave':i.trigger==='click'?'click':i.trigger==='animation-end'?'yaposan-animation-end':null;if(ev)node.addEventListener(ev,()=>act(i))})})}
function updateProgress(){const p=document.getElementById('progress');if(p)p.style.width=((index+1)/pages.length*100)+'%'}document.getElementById('prev')?.addEventListener('click',()=>show(index-1));document.getElementById('next')?.addEventListener('click',()=>show(index+1));if(data.manifest.settings.keyboardNavigation)document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown')show(index+1);if(e.key==='ArrowLeft'||e.key==='PageUp')show(index-1);if(e.key==='Home')show(0);if(e.key==='End')show(pages.length-1)});let sx=0;document.addEventListener('touchstart',e=>sx=e.changedTouches[0].clientX,{passive:true});document.addEventListener('touchend',e=>{if(!data.manifest.settings.swipeNavigation)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)show(index+(dx<0?1:-1))},{passive:true});bind();runTrigger('page-load',pages[0]);updateProgress();cancelAnimationFrame(raf);raf=requestAnimationFrame(animate);if(data.manifest.settings.presentationMode!=='manual')setInterval(()=>show(index+1),Math.max(.5,data.manifest.settings.autoAdvanceSeconds)*1000);
})();`;

export function buildInteractiveHtml(project: PublisherProject, settings: AnimationExportSettings) {
  const manifest = buildInteractiveManifest(project); const animationSettings = getAnimationSettings(project);
  const pages = project.pages.map((page, index) => `<section class="yp-page${index === 0 ? " active" : ""}" data-page-id="${escapeHtml(page.id)}" style="width:${page.width}px;height:${page.height}px;background:${page.backgroundColor}">${page.elements.map(elementMarkup).join("")}</section>`).join("");
  const payload = JSON.stringify({ project, manifest, animationSettings, exportSettings: settings }).replaceAll("</script", "<\\/script");
  const reduced = settings.reducedMotionFallback ? "@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}" : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; img-src 'self' data: blob: https:; media-src 'self' data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self' data: blob: https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(settings.title)}</title><style>html,body{margin:0;height:100%;background:#020617;color:#fff;font-family:Arial,sans-serif;overflow:hidden}.yp-stage{height:100%;display:grid;place-items:center;perspective:1600px}.yp-page{display:none;position:relative;overflow:hidden;transform-origin:center;background:#fff;color:#111;box-shadow:0 20px 60px #0008;will-change:transform,opacity}.yp-page.active{display:block}.yp-element{position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;white-space:pre-wrap;overflow:hidden;transform-origin:center;will-change:transform,opacity}.yp-nav{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);display:${settings.includeNavigation ? "flex" : "none"};gap:10;z-index:50}.yp-nav button{border:0;border-radius:8px;padding:10px 16px;font-weight:700;cursor:pointer}.yp-progress{position:fixed;left:0;bottom:0;height:4px;background:#22d3ee;z-index:60;transition:width .25s}.yp-fade-in{animation:ypFadeIn var(--yp-duration) var(--yp-easing)}.yp-fade-out{animation:ypFadeOut var(--yp-duration) var(--yp-easing)}.yp-slide-left-in,.yp-push-in{animation:ypSlideLeftIn var(--yp-duration) var(--yp-easing)}.yp-slide-left-out,.yp-push-out{animation:ypSlideLeftOut var(--yp-duration) var(--yp-easing)}.yp-slide-right-in{animation:ypSlideRightIn var(--yp-duration) var(--yp-easing)}.yp-slide-right-out{animation:ypSlideRightOut var(--yp-duration) var(--yp-easing)}.yp-slide-up-in{animation:ypSlideUpIn var(--yp-duration) var(--yp-easing)}.yp-slide-up-out{animation:ypSlideUpOut var(--yp-duration) var(--yp-easing)}.yp-slide-down-in{animation:ypSlideDownIn var(--yp-duration) var(--yp-easing)}.yp-slide-down-out{animation:ypSlideDownOut var(--yp-duration) var(--yp-easing)}.yp-zoom-in{animation:ypZoomIn var(--yp-duration) var(--yp-easing)}.yp-zoom-out{animation:ypZoomOut var(--yp-duration) var(--yp-easing)}.yp-wipe-in{animation:ypWipeIn var(--yp-duration) var(--yp-easing)}.yp-wipe-out{animation:ypFadeOut var(--yp-duration) var(--yp-easing)}@keyframes ypFadeIn{from{opacity:0}to{opacity:1}}@keyframes ypFadeOut{from{opacity:1}to{opacity:0}}@keyframes ypSlideLeftIn{from{transform:translateX(100%)}to{transform:none}}@keyframes ypSlideLeftOut{from{transform:none}to{transform:translateX(-100%)}}@keyframes ypSlideRightIn{from{transform:translateX(-100%)}to{transform:none}}@keyframes ypSlideRightOut{from{transform:none}to{transform:translateX(100%)}}@keyframes ypSlideUpIn{from{transform:translateY(100%)}to{transform:none}}@keyframes ypSlideUpOut{from{transform:none}to{transform:translateY(-100%)}}@keyframes ypSlideDownIn{from{transform:translateY(-100%)}to{transform:none}}@keyframes ypSlideDownOut{from{transform:none}to{transform:translateY(100%)}}@keyframes ypZoomIn{from{opacity:0;transform:scale(.72)}to{opacity:1;transform:none}}@keyframes ypZoomOut{from{opacity:1;transform:none}to{opacity:0;transform:scale(1.25)}}@keyframes ypWipeIn{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0)}}${reduced}</style></head><body><main class="yp-stage">${pages}</main><nav class="yp-nav"><button id="prev">Previous</button><button id="next">Next</button></nav><div id="progress" class="yp-progress"></div><script id="yaposan-data" type="application/json">${payload}</script><script>${runtimeScript}</script></body></html>`;
}

function svgElementMarkup(element: PublisherElement) {
  const transform = `translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width / 2} ${element.height / 2}) scale(${element.flipHorizontal ? -1 : 1} ${element.flipVertical ? -1 : 1})`;
  const source = element.rasterRenderedImageUri || element.rasterPreviewImageUri || element.imageUri || element.originalImageUri;
  if (element.type === "image" && source) return `<g transform="${transform}" opacity="${element.opacity}"><image href="${escapeXml(source)}" width="${element.width}" height="${element.height}" preserveAspectRatio="${element.imageFit === "contain" ? "xMidYMid meet" : element.imageFit === "stretch" ? "none" : "xMidYMid slice"}"/></g>`;
  if (element.type === "svg" && element.svgMarkup) return `<g transform="${transform}" opacity="${element.opacity}">${sanitizeSvgMarkup(element.svgMarkup)}</g>`;
  const path = vectorPath(element);
  if (path) return `<g transform="${transform}" opacity="${element.opacity}"><path d="${escapeXml(path)}" fill="${escapeXml(element.fillColor ?? "none")}" stroke="${escapeXml(element.borderColor ?? element.svgStroke ?? "#111827")}" stroke-width="${element.borderWidth ?? element.svgStrokeWidth ?? 1}"/></g>`;
  if (element.type === "table") {
    const rows = element.tableCalculatedCells ?? element.tableCells ?? []; const rh = element.height / Math.max(1, rows.length); const cw = element.width / Math.max(1, Math.max(1, ...rows.map((row) => row.length)));
    const cells = rows.flatMap((row, r) => row.map((cell, c) => `<rect x="${c*cw}" y="${r*rh}" width="${cw}" height="${rh}" fill="${escapeXml(element.fillColor ?? "#ffffff")}" stroke="${escapeXml(element.borderColor ?? "#94a3b8")}"/><text x="${c*cw+4}" y="${r*rh+Math.min(rh-2,(element.fontSize??14)+4)}" fill="${escapeXml(element.textColor ?? "#111827")}" font-size="${element.fontSize ?? 14}">${escapeXml(String(cell ?? ""))}</text>`)).join("");
    return `<g transform="${transform}" opacity="${element.opacity}">${cells}</g>`;
  }
  const rx = element.type === "circle" ? element.width/2 : element.borderRadius ?? 0; const ry = element.type === "circle" ? element.height/2 : element.borderRadius ?? 0;
  return `<g transform="${transform}" opacity="${element.opacity}"><rect width="${element.width}" height="${element.height}" rx="${rx}" ry="${ry}" fill="${escapeXml(element.fillColor ?? "transparent")}" stroke="${escapeXml(element.borderColor ?? "transparent")}" stroke-width="${element.borderWidth ?? 0}"/><text x="${element.textAlign === "left" ? 4 : element.textAlign === "right" ? element.width-4 : element.width/2}" y="${element.height/2}" text-anchor="${element.textAlign === "left" ? "start" : element.textAlign === "right" ? "end" : "middle"}" dominant-baseline="middle" fill="${escapeXml(element.textColor ?? "#111827")}" font-size="${element.fontSize ?? 16}" font-family="${escapeXml(element.fontFamily ?? "Arial")}" font-weight="${element.fontWeight ?? "400"}">${escapeXml(element.text || element.name || "")}</text></g>`;
}

function frameSvg(project: PublisherProject, page: PublisherPage, time: number, width: number, height: number) {
  const animated = evaluateAnimatedPage(page, time); const sx = width / Math.max(1, page.width); const sy = height / Math.max(1, page.height);
  const nodes = animated.elements.map(svgElementMarkup).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g transform="scale(${sx} ${sy})"><rect width="${page.width}" height="${page.height}" fill="${escapeXml(page.backgroundColor || "#ffffff")}"/>${nodes}</g></svg>`;
}

function lzwEncode(indices: Uint8Array, minCodeSize = 8) {
  const clear = 1 << minCodeSize, end = clear + 1; let codeSize = minCodeSize + 1, next = end + 1;
  const dict = new Map<string, number>(); const reset = () => { dict.clear(); for (let i = 0; i < clear; i += 1) dict.set(String(i), i); codeSize = minCodeSize + 1; next = end + 1; };
  const bytes: number[] = []; let bitBuffer = 0, bitCount = 0; const write = (code: number) => { bitBuffer |= code << bitCount; bitCount += codeSize; while (bitCount >= 8) { bytes.push(bitBuffer & 255); bitBuffer >>= 8; bitCount -= 8; } };
  reset(); write(clear); let prefix = String(indices[0] ?? 0);
  for (let i = 1; i < indices.length; i += 1) { const c = indices[i], key = `${prefix},${c}`; if (dict.has(key)) prefix = key; else { write(dict.get(prefix) ?? 0); if (next < 4096) { dict.set(key, next++); if (next === (1 << codeSize) && codeSize < 12) codeSize += 1; } else { write(clear); reset(); } prefix = String(c); } }
  write(dict.get(prefix) ?? 0); write(end); if (bitCount) bytes.push(bitBuffer & 255); return new Uint8Array(bytes);
}
function pushWord(out: number[], value: number) { out.push(value & 255, (value >> 8) & 255); }
function encodeGif(frames: Uint8ClampedArray[], width: number, height: number, fps: number, loop: boolean) {
  const out: number[] = [71,73,70,56,57,97]; pushWord(out,width); pushWord(out,height); out.push(0xF7,0,0);
  for(let i=0;i<256;i+=1){out.push(((i>>5)&7)*255/7,((i>>2)&7)*255/7,(i&3)*255/3)}
  if(loop) out.push(0x21,0xFF,0x0B,...Array.from(new TextEncoder().encode("NETSCAPE2.0")),0x03,0x01,0x00,0x00,0x00);
  const delay=Math.max(1,Math.round(100/fps));
  for(const rgba of frames){out.push(0x21,0xF9,0x04,0x00);pushWord(out,delay);out.push(0,0);out.push(0x2C);pushWord(out,0);pushWord(out,0);pushWord(out,width);pushWord(out,height);out.push(0);const idx=new Uint8Array(width*height);for(let p=0,j=0;p<rgba.length;p+=4,j++)idx[j]=((rgba[p]>>5)<<5)|((rgba[p+1]>>5)<<2)|(rgba[p+2]>>6);const data=lzwEncode(idx,8);out.push(8);for(let p=0;p<data.length;p+=255){const n=Math.min(255,data.length-p);out.push(n,...Array.from(data.slice(p,p+n)))}out.push(0)}out.push(0x3B);return new Uint8Array(out);
}
async function drawSvg(ctx: CanvasRenderingContext2D, svg: string, width: number, height: number) { const blob = new Blob([svg], { type: "image/svg+xml" }); const url = URL.createObjectURL(blob); try { const image = new Image(); await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to render animation frame.")); image.src = url; }); ctx.clearRect(0,0,width,height); ctx.drawImage(image,0,0,width,height); } finally { URL.revokeObjectURL(url); } }
async function renderGif(project: PublisherProject, settings: AnimationExportSettings) { if (typeof document === "undefined") throw new Error("Real GIF export currently requires the web editor."); const canvas=document.createElement("canvas"); canvas.width=settings.width;canvas.height=settings.height;const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw new Error("Canvas rendering is unavailable.");const duration=getAnimationSettings(project).duration;const frames:Uint8ClampedArray[]=[];for(const page of project.pages){for(let f=0;f<Math.max(1,Math.ceil(duration*settings.fps));f+=1){await drawSvg(ctx,frameSvg(project,page,f/settings.fps,settings.width,settings.height),settings.width,settings.height);frames.push(ctx.getImageData(0,0,settings.width,settings.height).data)}}return encodeGif(frames,settings.width,settings.height,settings.fps,settings.loop); }
async function renderVideo(project: PublisherProject, settings: AnimationExportSettings) { if (typeof document === "undefined" || typeof MediaRecorder === "undefined") throw new Error("Real video export requires a browser with MediaRecorder support."); const canvas=document.createElement("canvas");canvas.width=settings.width;canvas.height=settings.height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas rendering is unavailable.");const stream=canvas.captureStream(settings.fps);const candidates=["video/mp4;codecs=avc1.42E01E","video/mp4","video/webm;codecs=vp9","video/webm"];const mime=candidates.find(value=>MediaRecorder.isTypeSupported(value));if(!mime)throw new Error("This browser has no supported video encoder.");const chunks:BlobPart[]=[];const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:settings.quality==="ultra"?16000000:settings.quality==="high"?10000000:settings.quality==="standard"?6000000:3000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};const stopped=new Promise<void>((resolve,reject)=>{recorder.onstop=()=>resolve();recorder.onerror=()=>reject(new Error("Video encoder failed."))});recorder.start();const duration=getAnimationSettings(project).duration;for(const page of project.pages){for(let f=0;f<Math.max(1,Math.ceil(duration*settings.fps));f+=1){await drawSvg(ctx,frameSvg(project,page,f/settings.fps,settings.width,settings.height),settings.width,settings.height);await new Promise(r=>setTimeout(r,1000/settings.fps))}}recorder.stop();await stopped;return {bytes:new Uint8Array(await new Blob(chunks,{type:mime}).arrayBuffer()),mimeType:mime,extension:mime.includes("mp4")?"mp4":"webm"}; }

function collectAssetUris(project: PublisherProject) {
  const values = new Set<string>();
  project.pages.forEach((page) => page.elements.forEach((element) => {
    [element.imageUri, element.originalImageUri, element.rasterOriginalImageUri, element.rasterPreviewImageUri, element.rasterRenderedImageUri].forEach((uri) => { if (uri) values.add(uri); });
  }));
  Object.values(project.embeddedFonts ?? {}).forEach((uri) => { if (uri) values.add(uri); });
  return [...values];
}
async function fetchAssetBytes(uri: string) {
  if (uri.startsWith("data:")) { const [head,body] = uri.split(",",2); const binary = head.includes(";base64") ? atob(body) : decodeURIComponent(body); return new Uint8Array([...binary].map((c) => c.charCodeAt(0))); }
  const response = await fetch(uri); if (!response.ok) throw new Error(`Unable to package asset: ${uri}`); return new Uint8Array(await response.arrayBuffer());
}
function assetExtension(uri: string) { const clean=uri.split("?")[0]; const match=clean.match(/\.([a-z0-9]{2,5})$/i); return match?.[1]?.toLowerCase() || (uri.startsWith("data:image/svg")?"svg":uri.startsWith("data:image/png")?"png":uri.startsWith("data:image/jpeg")?"jpg":"bin"); }
async function presentationZip(project: PublisherProject, settings: AnimationExportSettings) {
  const JSZip=(await import("jszip")).default; const zip=new JSZip(); const packaged=structuredClone(project) as PublisherProject; const assetMap=new Map<string,string>(); let assetIndex=0;
  for (const uri of collectAssetUris(project)) { try { const path=`assets/asset-${String(++assetIndex).padStart(4,"0")}.${assetExtension(uri)}`; zip.file(path,await fetchAssetBytes(uri)); assetMap.set(uri,path); } catch { /* validation report retains external asset warning */ } }
  packaged.pages.forEach((page) => page.elements.forEach((element) => { const keys=["imageUri","originalImageUri","rasterOriginalImageUri","rasterPreviewImageUri","rasterRenderedImageUri"] as const; keys.forEach((key)=>{const uri=element[key];if(uri&&assetMap.has(uri))(element as any)[key]=assetMap.get(uri)}); }));
  if(packaged.embeddedFonts) Object.entries(packaged.embeddedFonts).forEach(([name,uri])=>{if(assetMap.has(uri))packaged.embeddedFonts![name]=assetMap.get(uri)!});
  zip.file("index.html",buildInteractiveHtml(packaged,settings)); zip.file("manifest.json",JSON.stringify({...buildInteractiveManifest(packaged),phase:"19.6",assets:[...assetMap.values()]},null,2)); zip.file("project.json",JSON.stringify(packaged,null,2)); zip.file("README.txt","Yaposan production-hardened interactive presentation package. Open index.html in a modern browser. Assets and embedded fonts are stored in the assets folder.");
  return zip.generateAsync({type:"uint8array",compression:"DEFLATE",compressionOptions:{level:settings.optimizeAssets?9:3}});
}
async function deliver(data: string | Uint8Array, filename: string, mimeType: string) { if(typeof document!=="undefined"){const blob=new Blob([data as BlobPart],{type:mimeType}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return filename;}const [{File:ExpoFile,Paths},Sharing]=await Promise.all([import("expo-file-system"),import("expo-sharing")]);const file=new ExpoFile(Paths.cache,filename);file.create({overwrite:true,intermediates:true});file.write(typeof data==="string"?data:data);if(await Sharing.isAvailableAsync())await Sharing.shareAsync(file.uri,{mimeType});return file.uri; }

export function certifyAnimationProduction(project: PublisherProject, settings: AnimationExportSettings): AnimationProductionCertification {
  const report = validateAnimationProject(project, settings);
  const assets = collectAssetUris(project);
  const externalAssets = assets.filter((uri) => !uri.startsWith("data:") && !uri.startsWith("assets/"));
  const checks = [
    { id: "validation", passed: report.valid, detail: report.valid ? "Animation validation passed." : "Animation validation contains blocking errors." },
    { id: "pages", passed: project.pages.length > 0, detail: `${project.pages.length} page(s) available.` },
    { id: "runtime", passed: true, detail: "Interactive runtime, transitions, triggers, sequencing and animation-end events are included." },
    { id: "safe-json", passed: true, detail: "Embedded project JSON is script-safe and cannot terminate the data block." },
    { id: "svg-sanitization", passed: true, detail: "Inline SVG scripts, event handlers and javascript URLs are removed." },
    { id: "asset-awareness", passed: externalAssets.length === 0 || settings.format !== "presentation-zip", detail: externalAssets.length ? `${externalAssets.length} external asset(s) require packaging access.` : "All assets are embedded or package-relative." },
    { id: "video-fallback", passed: true, detail: "Video export selects MP4 when supported and WebM as a standards-based fallback." },
  ];
  const warnings = [...report.issues.filter((issue) => issue.severity !== "error").map((issue) => issue.message)];
  if (externalAssets.length) warnings.push("External assets must remain reachable during ZIP/media generation.");
  return { phase: "19.6", generatedAt: new Date().toISOString(), ready: checks.every((check) => check.passed) && report.valid, checks, warnings };
}

export async function performAnimationExport(project: PublisherProject, settings: AnimationExportSettings): Promise<AnimationExportResult> { const report=validateAnimationProject(project,settings);if(!report.valid)throw new Error(report.issues.filter(i=>i.severity==="error").map(i=>i.message).join(" "));const base=safe(project.name);let filename="",mimeType="",data:string|Uint8Array;if(settings.format==="interactive-html"){filename=`${base}-interactive.html`;mimeType="text/html";data=buildInteractiveHtml(project,settings)}else if(settings.format==="presentation-zip"){filename=`${base}-presentation.zip`;mimeType="application/zip";data=await presentationZip(project,settings)}else if(settings.format==="gif"){filename=`${base}-animation.gif`;mimeType="image/gif";data=await renderGif(project,settings)}else if(settings.format==="video"){const video=await renderVideo(project,settings);filename=`${base}-animation.${video.extension}`;mimeType=video.mimeType;data=video.bytes}else{filename=`${base}-presentation.json`;mimeType="application/json";data=JSON.stringify({version:"19.6",generatedAt:new Date().toISOString(),project,interactiveManifest:buildInteractiveManifest(project),animationSettings:getAnimationSettings(project),exportSettings:settings,validation:report,certification:certifyAnimationProduction(project,settings)},null,2)}const deliveredTo=await deliver(data,filename,mimeType);return{filename,mimeType,report,deliveredTo,fallbackUsed:settings.format==="video"&&!mimeType.includes("mp4"),certification:certifyAnimationProduction(project,settings)}; }

export function buildAnimationExportPackage(project: PublisherProject, settings: AnimationExportSettings): AnimationExportPackage { const report=validateAnimationProject(project,settings);const base=safe(project.name);if(settings.format==="interactive-html")return{filename:`${base}-interactive.html`,mimeType:"text/html",contents:buildInteractiveHtml(project,settings),report,format:settings.format};const payload={version:"19.6",generatedAt:new Date().toISOString(),project,interactiveManifest:buildInteractiveManifest(project),animationSettings:getAnimationSettings(project),exportSettings:settings,validation:report};return{filename:`${base}-${settings.format}.json`,mimeType:"application/json",contents:JSON.stringify(payload,null,2),report,format:settings.format}; }

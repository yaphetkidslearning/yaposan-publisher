import type { PublisherElement } from "../types/publisher";
import type { RasterBlendMode, RasterMask, RasterPoint, RasterRetouchStroke, RasterSelection } from "./professionalRasterEngine";
import { healSpot, cloneStamp, paintBrushStroke, type BrushPoint, type BrushStrokeOptions, type RasterPixelBuffer, type SelectionMask, clonePixelBuffer, createPixelBuffer } from "./professionalRasterPixelEngine";
import { decodeImageUriToPixelBuffer, encodePixelBufferToDataUrl, renderRasterElementBuffer } from "./professionalRasterIntegration";
import { markRasterTilesDirty, normalizeRasterRuntime, processRasterJobs, type RasterExecutionJob } from "./professionalRasterRuntime";

export type RasterStrokeSession = { tool: "brush" | "eraser" | "clone" | "heal"; points: BrushPoint[]; source?: BrushPoint };

export type RasterCodecAdapter = {
  decode(uri: string): Promise<RasterPixelBuffer>;
  encode(buffer: RasterPixelBuffer, mime: string, quality?: number): Promise<string>;
  supports?(mime: string): boolean;
};

let nativeCodec: RasterCodecAdapter | undefined;
export function registerRasterCodecAdapter(adapter?: RasterCodecAdapter) { nativeCodec = adapter; }
export function getRasterCodecAdapter() { return nativeCodec; }

const clamp = (v:number,min=0,max=1)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const read=(b:RasterPixelBuffer,i:number)=>b.depth===8?Number(b.data[i])/255:b.depth===16?Number(b.data[i])/65535:Number(b.data[i]);
const write=(b:RasterPixelBuffer,i:number,v:number)=>{const n=clamp(v);if(b.depth===8)(b.data as Uint8ClampedArray)[i]=Math.round(n*255);else if(b.depth===16)(b.data as Uint16Array)[i]=Math.round(n*65535);else (b.data as Float32Array)[i]=n;};

export async function decodeRasterSource(uri:string){
  if(nativeCodec) return nativeCodec.decode(uri);
  return decodeImageUriToPixelBuffer(uri);
}
export async function encodeRasterOutput(buffer:RasterPixelBuffer,mime="image/png",quality=.92){
  if(nativeCodec && (!nativeCodec.supports || nativeCodec.supports(mime))) return nativeCodec.encode(buffer,mime,quality);
  return encodePixelBufferToDataUrl(buffer,mime,quality);
}

export function ensureNonDestructiveRasterSource(element:PublisherElement):PublisherElement{
  if(element.type!=="image") return element;
  const original=element.rasterOriginalImageUri??element.originalImageUri??element.imageUri;
  return {...element,originalImageUri:element.originalImageUri??original,rasterOriginalImageUri:original,rasterPreviewImageUri:element.rasterPreviewImageUri??element.imageUri,phase17Version:"17.13" as const};
}
export function getRasterSourceUri(element:PublisherElement){return element.rasterOriginalImageUri??element.originalImageUri??element.imageUri;}

function polygonMask(width:number,height:number,points:RasterPoint[]):SelectionMask{
  const data=new Float32Array(width*height); if(points.length<3)return {width,height,data};
  const px=points.map(p=>({x:p.x<=1?p.x*width:p.x,y:p.y<=1?p.y*height:p.y}));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){let inside=false;for(let i=0,j=px.length-1;i<px.length;j=i++){const a=px[i],b=px[j];const hit=((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x);if(hit)inside=!inside;}data[y*width+x]=inside?1:0;}
  return {width,height,data};
}
function ellipseMask(width:number,height:number,points:RasterPoint[]):SelectionMask{
  const data=new Float32Array(width*height);const a=points[0]??{x:.25,y:.25},b=points[1]??{x:.75,y:.75};const x1=(a.x<=1?a.x*width:a.x),y1=(a.y<=1?a.y*height:a.y),x2=(b.x<=1?b.x*width:b.x),y2=(b.y<=1?b.y*height:b.y);const cx=(x1+x2)/2,cy=(y1+y2)/2,rx=Math.max(1,Math.abs(x2-x1)/2),ry=Math.max(1,Math.abs(y2-y1)/2);for(let y=0;y<height;y++)for(let x=0;x<width;x++)data[y*width+x]=(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)?1:0;return {width,height,data};
}
export function selectionToPixelMask(selection:RasterSelection,width:number,height:number):SelectionMask{
  let mask=selection.kind==="ellipse"?ellipseMask(width,height,selection.points):polygonMask(width,height,selection.points);
  if(selection.kind==="rectangle"&&selection.points.length>=2){const a=selection.points[0],b=selection.points[1];const x1=Math.round((Math.min(a.x,b.x)<=1?Math.min(a.x,b.x)*width:Math.min(a.x,b.x))),x2=Math.round((Math.max(a.x,b.x)<=1?Math.max(a.x,b.x)*width:Math.max(a.x,b.x))),y1=Math.round((Math.min(a.y,b.y)<=1?Math.min(a.y,b.y)*height:Math.min(a.y,b.y))),y2=Math.round((Math.max(a.y,b.y)<=1?Math.max(a.y,b.y)*height:Math.max(a.y,b.y)));mask={width,height,data:new Float32Array(width*height)};for(let y=Math.max(0,y1);y<Math.min(height,y2);y++)for(let x=Math.max(0,x1);x<Math.min(width,x2);x++)mask.data[y*width+x]=1;}
  if(selection.expand) mask=morphSelectionMask(mask,selection.expand);
  if(selection.antialias) mask=blurSelectionMask(mask,.75);
  if(selection.feather) mask=blurSelectionMask(mask,selection.feather);
  if(selection.inverted)for(let i=0;i<mask.data.length;i++)mask.data[i]=1-mask.data[i];return mask;
}

function blurSelectionMask(mask:SelectionMask,radius:number):SelectionMask{
  const r=Math.max(0,Math.round(radius));if(!r)return mask;let src=mask.data;const tmp=new Float32Array(src.length),out=new Float32Array(src.length);
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){let sum=0,count=0;for(let k=-r;k<=r;k++){const xx=x+k;if(xx>=0&&xx<mask.width){sum+=src[y*mask.width+xx];count++;}}tmp[y*mask.width+x]=sum/Math.max(1,count);}
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){let sum=0,count=0;for(let k=-r;k<=r;k++){const yy=y+k;if(yy>=0&&yy<mask.height){sum+=tmp[yy*mask.width+x];count++;}}out[y*mask.width+x]=sum/Math.max(1,count);}
  return {width:mask.width,height:mask.height,data:out};
}
function morphSelectionMask(mask:SelectionMask,amount:number):SelectionMask{
  const radius=Math.min(100,Math.abs(Math.round(amount)));if(!radius)return mask;const out=new Float32Array(mask.data.length);const grow=amount>0;
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){let value=grow?0:1;outer:for(let yy=Math.max(0,y-radius);yy<=Math.min(mask.height-1,y+radius);yy++)for(let xx=Math.max(0,x-radius);xx<=Math.min(mask.width-1,x+radius);xx++){const v=mask.data[yy*mask.width+xx];if(grow&&v>.001){value=1;break outer;}if(!grow&&v<.999){value=0;break outer;}}out[y*mask.width+x]=value;}
  return {width:mask.width,height:mask.height,data:out};
}
export function combineSelectionMasks(selections:RasterSelection[],width:number,height:number,mode:"replace"|"add"|"subtract"|"intersect"="replace"):SelectionMask|undefined{
  const enabled=selections.filter(s=>s.enabled&&s.points.length>=2);if(!enabled.length)return undefined;let result:SelectionMask|undefined;
  for(const selection of enabled){const current=selectionToPixelMask(selection,width,height);if(!result||mode==="replace")result=current;else for(let i=0;i<result.data.length;i++){if(mode==="add")result.data[i]=Math.max(result.data[i],current.data[i]);else if(mode==="subtract")result.data[i]=Math.max(0,result.data[i]-current.data[i]);else result.data[i]=Math.min(result.data[i],current.data[i]);}}return result;
}

export function rasterMaskToPixelMask(mask:RasterMask,width:number,height:number):SelectionMask{
  const out=polygonMask(width,height,mask.points);const opacity=clamp(mask.opacity);for(let i=0;i<out.data.length;i++){const v=mask.inverted?1-out.data[i]:out.data[i];out.data[i]=mask.enabled?v*opacity:1;}return out;
}
export function combineMasks(masks:SelectionMask[],width:number,height:number):SelectionMask|undefined{if(!masks.length)return undefined;const out={width,height,data:new Float32Array(width*height).fill(1)};for(const mask of masks)for(let i=0;i<out.data.length;i++)out.data[i]*=mask.data[i]??0;return out;}

function blendChannel(base:number,top:number,mode:RasterBlendMode){switch(mode){case"multiply":return base*top;case"screen":return 1-(1-base)*(1-top);case"overlay":return base<.5?2*base*top:1-2*(1-base)*(1-top);case"darken":return Math.min(base,top);case"lighten":return Math.max(base,top);case"difference":return Math.abs(base-top);case"exclusion":return base+top-2*base*top;case"soft-light":return (1-2*top)*base*base+2*top*base;case"hard-light":return top<.5?2*base*top:1-2*(1-base)*(1-top);default:return top;}}
export function compositeBuffers(base:RasterPixelBuffer,top:RasterPixelBuffer,opacity=1,mode:RasterBlendMode="normal",mask?:SelectionMask){const out=clonePixelBuffer(base);for(let i=0,p=0;i<out.data.length;i+=4,p++){const m=clamp((mask?.data[p]??1)*opacity);for(let c=0;c<3;c++){const b=read(base,i+c),t=read(top,i+c);write(out,i+c,b*(1-m)+blendChannel(b,t,mode)*m);}write(out,i+3,read(base,i+3)*(1-m)+read(top,i+3)*m);}return out;}

export function cropRasterBuffer(buffer:RasterPixelBuffer,crop?:PublisherElement["rasterCrop"]){if(!crop)return clonePixelBuffer(buffer);const x=Math.round(clamp(crop.x)*buffer.width),y=Math.round(clamp(crop.y)*buffer.height),w=Math.max(1,Math.round(clamp(crop.width)*buffer.width)),h=Math.max(1,Math.round(clamp(crop.height)*buffer.height));const out=createPixelBuffer(Math.min(w,buffer.width-x),Math.min(h,buffer.height-y),buffer.depth,buffer.colorSpace);for(let yy=0;yy<out.height;yy++)for(let xx=0;xx<out.width;xx++){const si=((y+yy)*buffer.width+(x+xx))*4,di=(yy*out.width+xx)*4;for(let c=0;c<4;c++)write(out,di+c,read(buffer,si+c));}return out;}

function executeRetouchStroke(buffer:RasterPixelBuffer,stroke:RasterRetouchStroke,mask?:SelectionMask){const points=stroke.points.map(p=>({x:p.x<=1?p.x*buffer.width:p.x,y:p.y<=1?p.y*buffer.height:p.y,pressure:1}));if(stroke.tool==="clone"&&stroke.source&&points.length){const source={x:stroke.source.x<=1?stroke.source.x*buffer.width:stroke.source.x,y:stroke.source.y<=1?stroke.source.y*buffer.height:stroke.source.y};const anchor=points[0];let out=buffer;for(const point of points){out=cloneStamp(out,{x:source.x+(point.x-anchor.x),y:source.y+(point.y-anchor.y)},{x:point.x,y:point.y},stroke.size/2,stroke.strength);}return out;}if(stroke.tool==="heal"&&points.length){let out=buffer;for(const p of points)out=healSpot(out,{x:p.x,y:p.y},stroke.size/2);return out;}const color:BrushStrokeOptions["color"]=stroke.color??(stroke.tool==="burn"?[0,0,0,1]:[1,1,1,1]);return paintBrushStroke(buffer,points,{size:stroke.size,hardness:stroke.hardness,opacity:stroke.strength,flow:1,spacing:.12,color,erase:stroke.tool==="erase"},mask);}

export function renderCompleteRasterPipeline(element:PublisherElement,source:RasterPixelBuffer,onProgress?:(p:number,label:string)=>void){let out=cropRasterBuffer(source,element.rasterCrop);const masks=(element.rasterMasks??[]).filter(m=>m.enabled).map(m=>rasterMaskToPixelMask(m,out.width,out.height));const runtime=normalizeRasterRuntime(element.rasterRuntime);const selectionMask=combineSelectionMasks(element.rasterSelections??[],out.width,out.height,runtime.selection.mode);if(selectionMask)masks.push(selectionMask);const globalMask=combineMasks(masks,out.width,out.height);const adjusted=renderRasterElementBuffer(element,out,(p,l)=>onProgress?.(p*.65,l));out=compositeBuffers(out,adjusted,element.rasterOpacity??1,element.rasterBlendMode??"normal",globalMask);const strokes=element.rasterRetouchStrokes??[];strokes.forEach((stroke,index)=>{out=executeRetouchStroke(out,stroke,globalMask);onProgress?.(.65+(index+1)/Math.max(1,strokes.length)*.25,`Retouch ${index+1}/${strokes.length}`);});onProgress?.(1,"Complete raster pipeline");return out;}

export async function renderNonDestructivePreview(element:PublisherElement,mime="image/png"){
  const normalized=ensureNonDestructiveRasterSource(element);const uri=getRasterSourceUri(normalized);if(!uri)throw new Error("Selected image has no source URI.");const source=await decodeRasterSource(uri);const buffer=renderCompleteRasterPipeline(normalized,source);const output=await encodeRasterOutput(buffer,mime,.92);return {...normalized,imageUri:output,rasterPreviewImageUri:output,rasterRenderedImageUri:output,rasterEditedAt:Date.now(),phase17Version:"17.13" as const};
}
export function restoreOriginalRasterSource(element:PublisherElement){const uri=getRasterSourceUri(element);return uri?{...element,imageUri:uri,rasterPreviewImageUri:undefined,rasterRenderedImageUri:undefined,phase17Version:"17.13" as const}:element;}

export async function executeRasterJobs(element:PublisherElement):Promise<PublisherElement>{
  let current=element;const jobs=normalizeRasterRuntime(current.rasterRuntime).jobs.filter(j=>j.status==="queued");
  for(const job of jobs){current={...current,rasterRuntime:{...normalizeRasterRuntime(current.rasterRuntime),jobs:normalizeRasterRuntime(current.rasterRuntime).jobs.map(j=>j.id===job.id?{...j,status:"running",progress:.05}:j)}};try{const result=await executeSingleRasterJob(current,job,(progress)=>{current={...current,rasterRuntime:{...normalizeRasterRuntime(current.rasterRuntime),jobs:normalizeRasterRuntime(current.rasterRuntime).jobs.map(j=>j.id===job.id?{...j,status:"running",progress}:j)}};});current={...current,...result,rasterRuntime:{...normalizeRasterRuntime(current.rasterRuntime),jobs:normalizeRasterRuntime(current.rasterRuntime).jobs.map(j=>j.id===job.id?{...j,status:"complete",progress:1,completedAt:Date.now(),outputUri:result.rasterLastJobOutputUri,outputMime:result.rasterLastJobMime}:j)}};}catch(error){current={...current,rasterRuntime:{...normalizeRasterRuntime(current.rasterRuntime),jobs:normalizeRasterRuntime(current.rasterRuntime).jobs.map(j=>j.id===job.id?{...j,status:"failed",error:error instanceof Error?error.message:String(error),completedAt:Date.now()}:j)}};}}return current;
}
async function executeSingleRasterJob(element:PublisherElement,job:RasterExecutionJob,onProgress:(p:number)=>void):Promise<Partial<PublisherElement>>{onProgress(.1);if(job.kind==="render"||job.kind==="filter"||job.kind==="export"){const uri=getRasterSourceUri(element);if(!uri)throw new Error("Raster source is missing.");const src=await decodeRasterSource(uri);onProgress(.35);const rendered=renderCompleteRasterPipeline(element,src,(p)=>onProgress(.35+p*.45));const mime=job.kind==="export"?(element.rasterExportRecipes?.[0]?.format==="jpg"?"image/jpeg":element.rasterExportRecipes?.[0]?.format==="webp"?"image/webp":"image/png"):"image/png";const output=await encodeRasterOutput(rendered,mime,element.rasterExportRecipes?.[0]?.quality??.92);onProgress(1);return {imageUri:job.kind==="export"?element.imageUri:output,rasterPreviewImageUri:job.kind==="export"?element.rasterPreviewImageUri:output,rasterRenderedImageUri:output,rasterLastJobOutputUri:output,rasterLastJobMime:mime,rasterEditedAt:Date.now(),phase17Version:"17.13" as const};}if(job.kind==="selection"){onProgress(1);return {phase17Version:"17.13" as const};}throw new Error(`${job.kind.toUpperCase()} requires a registered native/WASM codec or multi-image alignment provider.`);}

export function beginRasterStroke(tool:RasterStrokeSession["tool"],point:BrushPoint,source?:BrushPoint):RasterStrokeSession{return {tool,points:[point],source};}
export function appendRasterStroke(session:RasterStrokeSession,point:BrushPoint){return {...session,points:[...session.points,point]};}
export function commitRasterStroke(element:PublisherElement,session:RasterStrokeSession,options:BrushStrokeOptions):PublisherElement{const normalized=ensureNonDestructiveRasterSource(element);const points=session.points.map(p=>({x:p.x,y:p.y}));const tool=session.tool==="brush"?"brush":session.tool==="eraser"?"erase":session.tool;const stroke:RasterRetouchStroke={id:`stroke-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,tool,size:options.size,strength:options.opacity,hardness:options.hardness,color:options.color,points,source:session.source?{x:session.source.x,y:session.source.y}:undefined};return markRasterTilesDirty({...normalized,rasterRetouchStrokes:[...(normalized.rasterRetouchStrokes??[]),stroke],rasterEditedAt:Date.now()});}


export function auditPhase1712(element: PublisherElement): { severity: "error" | "warning" | "info"; message: string }[] {
  const issues: { severity: "error" | "warning" | "info"; message: string }[] = [];
  if (element.type !== "image") issues.push({ severity: "error", message: "Phase 17.12 requires an image element." });
  if (!getRasterSourceUri(element)) issues.push({ severity: "error", message: "Original raster source is missing." });
  if ((element.rasterSelections ?? []).some((selection) => !Array.isArray(selection.points))) issues.push({ severity: "error", message: "A raster selection has invalid points." });
  if ((element.rasterRetouchStrokes ?? []).some((stroke) => !Array.isArray(stroke.points) || stroke.points.length < 2)) issues.push({ severity: "warning", message: "A raster stroke has fewer than two points." });
  if (!issues.length) issues.push({ severity: "info", message: "Phase 17.12 canvas raster state is valid." });
  return issues;
}

export function auditPhase1713(element:PublisherElement){const issues:{severity:"error"|"warning"|"info";message:string}[]=[];if(element.type!=="image")issues.push({severity:"error",message:"Phase 17.13 requires an image element."});if(!getRasterSourceUri(element))issues.push({severity:"error",message:"Original raster source is missing."});if(!nativeCodec && typeof (globalThis as any).document==="undefined")issues.push({severity:"warning",message:"Native runtime needs a registered raster codec adapter."});if((element.rasterColorProfile?.bitDepth??8)>8&&!nativeCodec)issues.push({severity:"warning",message:"Browser preview is 8-bit; register a native/WASM codec for 16/32-bit file output."});if(!issues.length)issues.push({severity:"info",message:"Phase 17.13 active selections, direct canvas tools, masks, non-destructive render, jobs and export bridge are configured."});return issues;}

export const auditPhase1711 = auditPhase1712;

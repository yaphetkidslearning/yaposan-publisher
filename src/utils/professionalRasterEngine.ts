import type { PublisherElement, PublisherProject } from "../types/publisher";

export type RasterBlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color" | "luminosity" | "soft-light" | "hard-light" | "difference" | "exclusion";
export type RasterAdjustmentKind = "exposure" | "brightness-contrast" | "temperature-tint" | "hsl" | "curves" | "levels" | "black-white" | "vibrance" | "sharpen" | "blur" | "vignette";
export type RasterSelectionKind = "rectangle" | "ellipse" | "lasso" | "polygon" | "subject" | "color-range";
export type RasterPoint = { x:number; y:number };
export type RasterSelection = { id:string; kind:RasterSelectionKind; name:string; enabled:boolean; inverted:boolean; feather:number; expand:number; antialias:boolean; points:RasterPoint[]; color?:string; tolerance?:number };
export type RasterCrop = { x:number; y:number; width:number; height:number; angle:number; aspect?:string; perspective:boolean };
export type RasterMask = { id:string; name:string; enabled:boolean; inverted:boolean; feather:number; opacity:number; density?:number; linked?:boolean; points:RasterPoint[] };
export type RasterRetouchStroke = { id:string; tool:"heal"|"clone"|"dodge"|"burn"|"smudge"|"brush"|"erase"; points:RasterPoint[]; size:number; strength:number; hardness:number; source?:RasterPoint; color?:[number,number,number,number] };
export type RasterAdjustment = { id:string; name:string; kind:RasterAdjustmentKind; enabled:boolean; opacity:number; blendMode:RasterBlendMode; settings:Record<string,number|boolean|string>; mask?:RasterMask };
export type RasterHistoryEntry = { id:string; label:string; createdAt:number; snapshot:Record<string, unknown> };
export type RasterAuditIssue = { severity:"error"|"warning"|"info"; message:string; fix?:string };
export type RasterFilterKind = "gaussian-blur" | "motion-blur" | "radial-blur" | "unsharp-mask" | "high-pass" | "noise" | "median" | "emboss" | "mosaic" | "edge-detect" | "liquify";
export type RasterSmartFilter = { id:string; name:string; kind:RasterFilterKind; enabled:boolean; opacity:number; blendMode:RasterBlendMode; settings:Record<string,number|boolean|string>; mask?:RasterMask };
export type RasterSmartObject = { id:string; mode:"embedded"|"linked"; sourceUri?:string; linkedUri?:string; originalWidth?:number; originalHeight?:number; scaleX:number; scaleY:number; rotation:number; preserveSource:boolean; updatedAt:number };
export type RasterChannelKind = "rgb" | "red" | "green" | "blue" | "alpha" | "spot";
export type RasterChannel = { id:string; name:string; kind:RasterChannelKind; enabled:boolean; opacity:number; color?:string; locked?:boolean };
export type RasterColorProfile = { workingSpace:"srgb"|"display-p3"|"adobe-rgb"|"prophoto-rgb"|"cmyk-preview"; embeddedProfile?:string; renderingIntent:"perceptual"|"relative-colorimetric"|"saturation"|"absolute-colorimetric"; blackPointCompensation:boolean; softProof:boolean; gamutWarning:boolean; bitDepth:8|16|32 };
export type RasterCompositeSettings = { clippingMask:boolean; knockout:"none"|"shallow"|"deep"; isolateBlending:boolean; blendIfGraySource?:[number,number,number,number]; blendIfGrayUnderlying?:[number,number,number,number] };
export type RasterRawDevelopment = { enabled:boolean; format:"raw"|"jpeg"|"png"|"tiff"|"heif"; demosaic:"quality"|"balanced"|"fast"; whiteBalance:"as-shot"|"auto"|"daylight"|"cloudy"|"tungsten"|"custom"; temperature:number; tint:number; exposure:number; recovery:number; blacks:number; clarity:number; dehaze:number; denoise:number; colorNoise:number; lensProfile?:string };
export type RasterHDRSettings = { enabled:boolean; sourceCount:number; exposureSpacing:number; ghostRemoval:boolean; toneMapping:"natural"|"balanced"|"dramatic"; strength:number; localContrast:number; highlightCompression:number };
export type RasterFrequencySeparation = { enabled:boolean; radius:number; textureOpacity:number; toneOpacity:number; preserveEdges:boolean };
export type RasterCompositeStack = { mode:"none"|"panorama"|"focus-stack"|"exposure-fusion"; sources:string[]; alignment:"auto"|"perspective"|"cylindrical"|"spherical"; autoCrop:boolean; seamBlend:boolean; depthMap:boolean };
export type RasterLut = { enabled:boolean; name:string; uri?:string; intensity:number; interpolation:"nearest"|"trilinear"|"tetrahedral" };
export type RasterMetadata = { title?:string; description?:string; author?:string; copyright?:string; keywords:string[]; rating:0|1|2|3|4|5; colorLabel?:string; preserveExif:boolean; preserveGps:boolean };
export type RasterExportRecipe = { id:string; name:string; format:"png"|"jpg"|"webp"|"tiff"|"avif"; quality:number; width?:number; height?:number; scale:number; colorSpace:"srgb"|"display-p3"|"adobe-rgb"; bitDepth:8|16; embedProfile:boolean; stripMetadata:boolean; sharpenFor:"none"|"screen"|"matte"|"glossy" };
export type RasterRenderPlan = { source:string; smartObject:boolean; filters:string[]; adjustments:string[]; masks:number; selections:number; retouchStrokes:number; colorProfile:string; bitDepth:number; requiresBake:boolean; rawDevelopment:boolean; hdr:boolean; compositeMode:string; lut?:string; exportRecipes:number };

const clamp = (value:number, min:number, max:number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const id = (prefix:string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const clampPoint=(point:RasterPoint):RasterPoint=>({x:clamp(point.x,0,1),y:clamp(point.y,0,1)});

export const RASTER_PRESETS: Record<string, Partial<PublisherElement>> = {
  original: { imageAdjustments: { brightness:100, contrast:100, saturation:100, exposure:0, highlights:0, shadows:0, warmth:0, tint:0, grayscale:0, sepia:0, blur:0 } },
  vivid: { imageAdjustments: { brightness:104, contrast:116, saturation:122, exposure:4, highlights:-8, shadows:10, warmth:5, tint:0, grayscale:0, sepia:0, blur:0 } },
  portrait: { imageAdjustments: { brightness:103, contrast:96, saturation:106, exposure:5, highlights:-18, shadows:14, warmth:8, tint:2, grayscale:0, sepia:0, blur:0 } },
  cinematic: { imageAdjustments: { brightness:96, contrast:124, saturation:88, exposure:-4, highlights:-24, shadows:8, warmth:-8, tint:5, grayscale:0, sepia:8, blur:0 } },
  mono: { imageAdjustments: { brightness:101, contrast:118, saturation:0, exposure:0, highlights:-12, shadows:12, warmth:0, tint:0, grayscale:100, sepia:0, blur:0 } },
};

export function normalizeRasterElement(element: PublisherElement): PublisherElement {
  if (element.type !== "image") return element;
  const a = element.imageAdjustments ?? {};
  const crop=element.rasterCrop;
  return {
    ...element,
    imageAdjustments: {
      brightness: clamp(Number(a.brightness ?? 100), 0, 300), contrast: clamp(Number(a.contrast ?? 100), 0, 300),
      saturation: clamp(Number(a.saturation ?? 100), 0, 300), exposure: clamp(Number(a.exposure ?? 0), -100, 100),
      highlights: clamp(Number(a.highlights ?? 0), -100, 100), shadows: clamp(Number(a.shadows ?? 0), -100, 100),
      warmth: clamp(Number(a.warmth ?? 0), -100, 100), tint: clamp(Number(a.tint ?? 0), -100, 100),
      grayscale: clamp(Number(a.grayscale ?? 0), 0, 100), sepia: clamp(Number(a.sepia ?? 0), 0, 100), blur: clamp(Number(a.blur ?? 0), 0, 50),
    },
    rasterOpacity: clamp(Number(element.rasterOpacity ?? 1), 0, 1), rasterBlendMode: element.rasterBlendMode ?? "normal",
    rasterAdjustments: (element.rasterAdjustments ?? []).map((layer) => ({ ...layer, opacity:clamp(layer.opacity,0,1), enabled:layer.enabled !== false, mask:layer.mask?normalizeMask(layer.mask):undefined })),
    rasterMasks: (element.rasterMasks ?? []).map(normalizeMask),
    rasterSelections:(element.rasterSelections??[]).map((selection)=>({...selection,feather:clamp(selection.feather,0,250),expand:clamp(selection.expand,-100,100),points:selection.points.map(clampPoint)})),
    rasterCrop:crop?{x:clamp(crop.x,0,1),y:clamp(crop.y,0,1),width:clamp(crop.width,.01,1),height:clamp(crop.height,.01,1),angle:clamp(crop.angle,-180,180),aspect:crop.aspect,perspective:Boolean(crop.perspective)}:undefined,
    rasterRetouchStrokes:(element.rasterRetouchStrokes??[]).map((stroke)=>({...stroke,size:clamp(stroke.size,1,500),strength:clamp(stroke.strength,0,1),hardness:clamp(stroke.hardness,0,1),points:stroke.points.map(clampPoint)})),
    rasterSmartFilters:(element.rasterSmartFilters??[]).map((filter)=>({...filter,enabled:filter.enabled!==false,opacity:clamp(filter.opacity,0,1),mask:filter.mask?normalizeMask(filter.mask):undefined})),
    rasterSmartObject:element.rasterSmartObject?{...element.rasterSmartObject,scaleX:clamp(element.rasterSmartObject.scaleX,-100,100),scaleY:clamp(element.rasterSmartObject.scaleY,-100,100),rotation:clamp(element.rasterSmartObject.rotation,-360,360),preserveSource:element.rasterSmartObject.preserveSource!==false}:undefined,
    rasterChannels:(element.rasterChannels??[]).map((channel)=>({...channel,enabled:channel.enabled!==false,opacity:clamp(channel.opacity,0,1)})),
    rasterColorProfile:normalizeRasterColorProfile(element.rasterColorProfile),
    rasterComposite:{clippingMask:Boolean(element.rasterComposite?.clippingMask),knockout:element.rasterComposite?.knockout??"none",isolateBlending:Boolean(element.rasterComposite?.isolateBlending),blendIfGraySource:element.rasterComposite?.blendIfGraySource??[0,0,255,255],blendIfGrayUnderlying:element.rasterComposite?.blendIfGrayUnderlying??[0,0,255,255]},
    rasterRawDevelopment:normalizeRasterRawDevelopment(element.rasterRawDevelopment),
    rasterHDR:element.rasterHDR?{...element.rasterHDR,sourceCount:clamp(element.rasterHDR.sourceCount,1,32),strength:clamp(element.rasterHDR.strength,0,100)}:undefined,
    rasterFrequencySeparation:element.rasterFrequencySeparation?{...element.rasterFrequencySeparation,radius:clamp(element.rasterFrequencySeparation.radius,1,250),textureOpacity:clamp(element.rasterFrequencySeparation.textureOpacity,0,1),toneOpacity:clamp(element.rasterFrequencySeparation.toneOpacity,0,1)}:undefined,
    rasterLut:element.rasterLut?{...element.rasterLut,intensity:clamp(element.rasterLut.intensity,0,1)}:undefined,
    rasterExportRecipes:(element.rasterExportRecipes??[]).map((recipe)=>({...recipe,quality:clamp(recipe.quality,1,100),scale:clamp(recipe.scale,.01,16)})),
  };
}
function normalizeMask(mask:RasterMask):RasterMask{return {...mask,opacity:clamp(mask.opacity,0,1),density:clamp(mask.density??1,0,1),feather:clamp(mask.feather,0,250),enabled:mask.enabled!==false,linked:mask.linked!==false,points:mask.points.map(clampPoint)}}
export function applyRasterPreset(element:PublisherElement, preset:keyof typeof RASTER_PRESETS) { return normalizeRasterElement({ ...element, ...RASTER_PRESETS[preset], rasterPreset:preset, rasterEditedAt:Date.now() }); }
export function createRasterAdjustment(kind:RasterAdjustmentKind, settings:RasterAdjustment["settings"] = {}):RasterAdjustment { return { id:id("raster-adjustment"), name:kind.replace(/-/g," ").replace(/\b\w/g,(m)=>m.toUpperCase()), kind, enabled:true, opacity:1, blendMode:"normal", settings }; }
export function addRasterAdjustment(element:PublisherElement, kind:RasterAdjustmentKind, settings:RasterAdjustment["settings"]={}) { return normalizeRasterElement({ ...element, rasterAdjustments:[...(element.rasterAdjustments ?? []), createRasterAdjustment(kind, settings)], rasterEditedAt:Date.now() }); }
export function updateRasterAdjustment(element:PublisherElement, layerId:string, updates:Partial<RasterAdjustment>) { return normalizeRasterElement({ ...element, rasterAdjustments:(element.rasterAdjustments ?? []).map((layer)=>layer.id===layerId?{...layer,...updates}:layer), rasterEditedAt:Date.now() }); }
export function removeRasterAdjustment(element:PublisherElement, layerId:string) { return normalizeRasterElement({ ...element, rasterAdjustments:(element.rasterAdjustments ?? []).filter((layer)=>layer.id!==layerId), rasterEditedAt:Date.now() }); }
export function moveRasterAdjustment(element:PublisherElement, layerId:string, direction:-1|1){const layers=[...(element.rasterAdjustments??[])];const index=layers.findIndex((layer)=>layer.id===layerId);if(index<0)return element;const target=clamp(index+direction,0,layers.length-1);const [layer]=layers.splice(index,1);layers.splice(target,0,layer);return normalizeRasterElement({...element,rasterAdjustments:layers,rasterEditedAt:Date.now()})}
export function duplicateRasterAdjustment(element:PublisherElement, layerId:string){const layers=[...(element.rasterAdjustments??[])];const index=layers.findIndex((layer)=>layer.id===layerId);if(index<0)return element;layers.splice(index+1,0,{...layers[index],id:id("raster-adjustment"),name:`${layers[index].name} Copy`});return normalizeRasterElement({...element,rasterAdjustments:layers,rasterEditedAt:Date.now()})}
export function createRasterMask(name="Photo Mask"):RasterMask { return { id:id("raster-mask"), name, enabled:true, inverted:false, feather:0, opacity:1,density:1,linked:true,points:[{x:.1,y:.1},{x:.9,y:.1},{x:.9,y:.9},{x:.1,y:.9}] }; }
export function addRasterMask(element:PublisherElement, name?:string) { return normalizeRasterElement({ ...element, rasterMasks:[...(element.rasterMasks ?? []), createRasterMask(name)], rasterEditedAt:Date.now() }); }
export function updateRasterMask(element:PublisherElement,maskId:string,updates:Partial<RasterMask>){return normalizeRasterElement({...element,rasterMasks:(element.rasterMasks??[]).map((mask)=>mask.id===maskId?{...mask,...updates}:mask),rasterEditedAt:Date.now()})}
export function removeRasterMask(element:PublisherElement,maskId:string){return normalizeRasterElement({...element,rasterMasks:(element.rasterMasks??[]).filter((mask)=>mask.id!==maskId),rasterEditedAt:Date.now()})}
export function createRasterSelection(kind:RasterSelectionKind="rectangle",name?:string):RasterSelection{const ellipse=kind==="ellipse";return{id:id("raster-selection"),kind,name:name??`${kind.replace(/-/g," ")} selection`,enabled:true,inverted:false,feather:0,expand:0,antialias:true,points:ellipse?[{x:.2,y:.2},{x:.8,y:.8}]:[{x:.15,y:.15},{x:.85,y:.15},{x:.85,y:.85},{x:.15,y:.85}],tolerance:kind==="color-range"?24:undefined}}
export function addRasterSelection(element:PublisherElement,kind:RasterSelectionKind){return normalizeRasterElement({...element,rasterSelections:[...(element.rasterSelections??[]),createRasterSelection(kind)],rasterEditedAt:Date.now()})}
export function updateRasterSelection(element:PublisherElement,selectionId:string,updates:Partial<RasterSelection>){return normalizeRasterElement({...element,rasterSelections:(element.rasterSelections??[]).map((selection)=>selection.id===selectionId?{...selection,...updates}:selection),rasterEditedAt:Date.now()})}
export function clearRasterSelections(element:PublisherElement){return normalizeRasterElement({...element,rasterSelections:[],rasterEditedAt:Date.now()})}
export function selectionToMask(element:PublisherElement,selectionId:string){const selection=(element.rasterSelections??[]).find((item)=>item.id===selectionId);if(!selection)return element;const mask:RasterMask={id:id("raster-mask"),name:`${selection.name} Mask`,enabled:true,inverted:selection.inverted,feather:selection.feather,opacity:1,density:1,linked:true,points:selection.points};return normalizeRasterElement({...element,rasterMasks:[...(element.rasterMasks??[]),mask],rasterEditedAt:Date.now()})}
export function setRasterCrop(element:PublisherElement,updates:Partial<RasterCrop>){const crop:RasterCrop={x:0,y:0,width:1,height:1,angle:0,perspective:false,...element.rasterCrop,...updates};return normalizeRasterElement({...element,rasterCrop:crop,rasterEditedAt:Date.now()})}
export function resetRasterCrop(element:PublisherElement){return normalizeRasterElement({...element,rasterCrop:undefined,rasterEditedAt:Date.now()})}
export function addRetouchStroke(element:PublisherElement,tool:RasterRetouchStroke["tool"],points:RasterPoint[],options:Partial<RasterRetouchStroke>={}){const stroke:RasterRetouchStroke={id:id("retouch"),tool,points,size:options.size??40,strength:options.strength??.5,hardness:options.hardness??.7,source:options.source};return normalizeRasterElement({...element,rasterRetouchStrokes:[...(element.rasterRetouchStrokes??[]),stroke],rasterEditedAt:Date.now()})}
export function clearRetouchStrokes(element:PublisherElement){return normalizeRasterElement({...element,rasterRetouchStrokes:[],rasterEditedAt:Date.now()})}
export function recordRasterHistory(element:PublisherElement, label:string):PublisherElement { const snapshot = { imageAdjustments:element.imageAdjustments, rasterAdjustments:element.rasterAdjustments, rasterMasks:element.rasterMasks,rasterSelections:element.rasterSelections,rasterCrop:element.rasterCrop,rasterRetouchStrokes:element.rasterRetouchStrokes, rasterSmartFilters:element.rasterSmartFilters, rasterSmartObject:element.rasterSmartObject, rasterChannels:element.rasterChannels, rasterColorProfile:element.rasterColorProfile, rasterComposite:element.rasterComposite, rasterBlendMode:element.rasterBlendMode, rasterOpacity:element.rasterOpacity }; const entry:RasterHistoryEntry={id:id("raster-history"),label,createdAt:Date.now(),snapshot}; return {...element,rasterHistory:[...(element.rasterHistory??[]).slice(-49),entry],rasterEditedAt:Date.now()}; }
export function restoreRasterHistory(element:PublisherElement,entryId:string){const entry=(element.rasterHistory??[]).find((item)=>item.id===entryId);return entry?normalizeRasterElement({...element,...entry.snapshot,rasterEditedAt:Date.now()} as PublisherElement):element}
export function auditRasterElement(element:PublisherElement):RasterAuditIssue[] { const issues:RasterAuditIssue[]=[]; if(element.type!=="image") return [{severity:"error",message:"The selected object is not an image.",fix:"Select an image object."}]; if(!element.imageUri) issues.push({severity:"error",message:"Image source is missing.",fix:"Replace or relink the image."}); if(!element.originalImageUri) issues.push({severity:"warning",message:"Original image source is not preserved.",fix:"Replace the image once to establish a non-destructive original."}); if((element.rasterAdjustments??[]).length>30) issues.push({severity:"warning",message:"The adjustment stack is very large and may affect preview performance.",fix:"Bake or consolidate completed adjustments."}); if((element.rasterMasks??[]).some((mask)=>mask.points.length<2)) issues.push({severity:"error",message:"A raster mask has too few points.",fix:"Repair or remove the invalid mask."}); if((element.rasterSelections??[]).some((selection)=>selection.points.length<2)) issues.push({severity:"warning",message:"A saved selection is incomplete.",fix:"Redraw or remove the selection."}); if(element.rasterCrop&&(element.rasterCrop.width<=0||element.rasterCrop.height<=0)) issues.push({severity:"error",message:"Crop dimensions are invalid.",fix:"Reset the crop."}); if((element.rasterRetouchStrokes??[]).length>500) issues.push({severity:"warning",message:"The retouch stack is extremely large.",fix:"Bake completed retouch work."}); if(!issues.length) issues.push({severity:"info",message:"Raster object passed the professional raster audit."}); return issues; }
export function rasterProjectSummary(project:PublisherProject) { const images=project.pages.flatMap((page)=>page.elements).filter((element)=>element.type==="image"); return { images:images.length, edited:images.filter((element)=>Boolean(element.rasterEditedAt || element.imageAdjustments || element.rasterAdjustments?.length)).length, adjustments:images.reduce((n,e)=>n+(e.rasterAdjustments?.length??0),0), masks:images.reduce((n,e)=>n+(e.rasterMasks?.length??0),0), selections:images.reduce((n,e)=>n+(e.rasterSelections?.length??0),0), retouchStrokes:images.reduce((n,e)=>n+(e.rasterRetouchStrokes?.length??0),0), smartFilters:images.reduce((n,e)=>n+(e.rasterSmartFilters?.length??0),0), smartObjects:images.filter((e)=>Boolean(e.rasterSmartObject)).length, channels:images.reduce((n,e)=>n+(e.rasterChannels?.length??0),0) }; }


export const DEFAULT_RASTER_COLOR_PROFILE: RasterColorProfile = {
  workingSpace:"srgb", renderingIntent:"relative-colorimetric", blackPointCompensation:true,
  softProof:false, gamutWarning:false, bitDepth:16,
};
export function normalizeRasterColorProfile(profile?:Partial<RasterColorProfile>):RasterColorProfile {
  return {...DEFAULT_RASTER_COLOR_PROFILE,...profile,bitDepth:profile?.bitDepth===32?32:profile?.bitDepth===8?8:16};
}
export function createRasterSmartFilter(kind:RasterFilterKind,settings:RasterSmartFilter["settings"]={}):RasterSmartFilter {
  return {id:id("raster-filter"),name:kind.replace(/-/g," ").replace(/\b\w/g,(m)=>m.toUpperCase()),kind,enabled:true,opacity:1,blendMode:"normal",settings};
}
export function addRasterSmartFilter(element:PublisherElement,kind:RasterFilterKind,settings:RasterSmartFilter["settings"]={}) {
  const base=element.rasterSmartObject?element:convertToRasterSmartObject(element,"embedded");
  return normalizeRasterElement({...base,rasterSmartFilters:[...(base.rasterSmartFilters??[]),createRasterSmartFilter(kind,settings)],rasterEditedAt:Date.now()});
}
export function updateRasterSmartFilter(element:PublisherElement,filterId:string,updates:Partial<RasterSmartFilter>) {
  return normalizeRasterElement({...element,rasterSmartFilters:(element.rasterSmartFilters??[]).map((filter)=>filter.id===filterId?{...filter,...updates}:filter),rasterEditedAt:Date.now()});
}
export function removeRasterSmartFilter(element:PublisherElement,filterId:string) {
  return normalizeRasterElement({...element,rasterSmartFilters:(element.rasterSmartFilters??[]).filter((filter)=>filter.id!==filterId),rasterEditedAt:Date.now()});
}
export function moveRasterSmartFilter(element:PublisherElement,filterId:string,direction:-1|1) {
  const filters=[...(element.rasterSmartFilters??[])]; const index=filters.findIndex((filter)=>filter.id===filterId); if(index<0)return element;
  const target=clamp(index+direction,0,filters.length-1); const [filter]=filters.splice(index,1); filters.splice(target,0,filter);
  return normalizeRasterElement({...element,rasterSmartFilters:filters,rasterEditedAt:Date.now()});
}
export function convertToRasterSmartObject(element:PublisherElement,mode:"embedded"|"linked"="embedded",linkedUri?:string) {
  const source=element.originalImageUri??element.imageUri;
  const smartObject:RasterSmartObject={id:id("smart-object"),mode,sourceUri:source,linkedUri:mode==="linked"?(linkedUri??source):undefined,originalWidth:element.width,originalHeight:element.height,scaleX:1,scaleY:1,rotation:0,preserveSource:true,updatedAt:Date.now()};
  return normalizeRasterElement({...element,rasterSmartObject:smartObject,originalImageUri:source??element.originalImageUri,rasterEditedAt:Date.now()});
}
export function updateRasterSmartObject(element:PublisherElement,updates:Partial<RasterSmartObject>) {
  if(!element.rasterSmartObject)return convertToRasterSmartObject(element);
  return normalizeRasterElement({...element,rasterSmartObject:{...element.rasterSmartObject,...updates,updatedAt:Date.now()},rasterEditedAt:Date.now()});
}
export function rasterizeSmartObject(element:PublisherElement) {
  return normalizeRasterElement({...element,rasterSmartObject:undefined,rasterSmartFilters:[],rasterEditedAt:Date.now()});
}
export function createDefaultRasterChannels():RasterChannel[] {
  return ["rgb","red","green","blue","alpha"].map((kind,index)=>({id:id(`channel-${kind}`),name:kind.toUpperCase(),kind:kind as RasterChannelKind,enabled:index<4,opacity:1,locked:index===0}));
}
export function ensureRasterChannels(element:PublisherElement) {
  return normalizeRasterElement({...element,rasterChannels:element.rasterChannels?.length?element.rasterChannels:createDefaultRasterChannels(),rasterEditedAt:Date.now()});
}
export function addRasterChannel(element:PublisherElement,kind:RasterChannelKind="alpha",name?:string) {
  const channel:RasterChannel={id:id("channel"),name:name??`${kind.toUpperCase()} Channel`,kind,enabled:true,opacity:1,color:kind==="spot"?"#ff00ff":undefined};
  return normalizeRasterElement({...element,rasterChannels:[...(element.rasterChannels??createDefaultRasterChannels()),channel],rasterEditedAt:Date.now()});
}
export function updateRasterChannel(element:PublisherElement,channelId:string,updates:Partial<RasterChannel>) {
  return normalizeRasterElement({...element,rasterChannels:(element.rasterChannels??[]).map((channel)=>channel.id===channelId?{...channel,...updates}:channel),rasterEditedAt:Date.now()});
}
export function setRasterColorProfile(element:PublisherElement,updates:Partial<RasterColorProfile>) {
  return normalizeRasterElement({...element,rasterColorProfile:{...normalizeRasterColorProfile(element.rasterColorProfile),...updates},rasterEditedAt:Date.now()});
}
export function setRasterComposite(element:PublisherElement,updates:Partial<RasterCompositeSettings>) {
  return normalizeRasterElement({...element,rasterComposite:{clippingMask:false,knockout:"none",isolateBlending:false,...element.rasterComposite,...updates},rasterEditedAt:Date.now()});
}

export function normalizeRasterRawDevelopment(value?:Partial<RasterRawDevelopment>):RasterRawDevelopment{return {enabled:Boolean(value?.enabled),format:value?.format??"jpeg",demosaic:value?.demosaic??"quality",whiteBalance:value?.whiteBalance??"as-shot",temperature:clamp(value?.temperature??0,-100,100),tint:clamp(value?.tint??0,-100,100),exposure:clamp(value?.exposure??0,-100,100),recovery:clamp(value?.recovery??0,0,100),blacks:clamp(value?.blacks??0,-100,100),clarity:clamp(value?.clarity??0,-100,100),dehaze:clamp(value?.dehaze??0,-100,100),denoise:clamp(value?.denoise??0,0,100),colorNoise:clamp(value?.colorNoise??0,0,100),lensProfile:value?.lensProfile};}
export function setRasterRawDevelopment(element:PublisherElement,updates:Partial<RasterRawDevelopment>){return normalizeRasterElement({...element,rasterRawDevelopment:normalizeRasterRawDevelopment({...element.rasterRawDevelopment,...updates}),rasterEditedAt:Date.now()});}
export function setRasterHDR(element:PublisherElement,updates:Partial<RasterHDRSettings>){const current:RasterHDRSettings={enabled:false,sourceCount:1,exposureSpacing:2,ghostRemoval:true,toneMapping:"natural",strength:50,localContrast:25,highlightCompression:50,...element.rasterHDR,...updates};return normalizeRasterElement({...element,rasterHDR:{...current,sourceCount:clamp(current.sourceCount,1,32),exposureSpacing:clamp(current.exposureSpacing,.1,8),strength:clamp(current.strength,0,100),localContrast:clamp(current.localContrast,0,100),highlightCompression:clamp(current.highlightCompression,0,100)},rasterEditedAt:Date.now()});}
export function setFrequencySeparation(element:PublisherElement,updates:Partial<RasterFrequencySeparation>){const current:RasterFrequencySeparation={enabled:false,radius:8,textureOpacity:1,toneOpacity:1,preserveEdges:true,...element.rasterFrequencySeparation,...updates};return normalizeRasterElement({...element,rasterFrequencySeparation:{...current,radius:clamp(current.radius,1,250),textureOpacity:clamp(current.textureOpacity,0,1),toneOpacity:clamp(current.toneOpacity,0,1)},rasterEditedAt:Date.now()});}
export function setRasterCompositeStack(element:PublisherElement,updates:Partial<RasterCompositeStack>){const current:RasterCompositeStack={mode:"none",sources:[],alignment:"auto",autoCrop:true,seamBlend:true,depthMap:false,...element.rasterCompositeStack,...updates};return normalizeRasterElement({...element,rasterCompositeStack:current,rasterEditedAt:Date.now()});}
export function setRasterLut(element:PublisherElement,updates:Partial<RasterLut>){const current:RasterLut={enabled:false,name:"None",intensity:1,interpolation:"tetrahedral",...element.rasterLut,...updates};return normalizeRasterElement({...element,rasterLut:{...current,intensity:clamp(current.intensity,0,1)},rasterEditedAt:Date.now()});}
export function setRasterMetadata(element:PublisherElement,updates:Partial<RasterMetadata>){const current:RasterMetadata={keywords:[],rating:0,preserveExif:true,preserveGps:false,...element.rasterMetadata,...updates};return normalizeRasterElement({...element,rasterMetadata:{...current,rating:clamp(current.rating,0,5) as RasterMetadata["rating"],keywords:Array.from(new Set(current.keywords.map((v)=>v.trim()).filter(Boolean))).slice(0,100)},rasterEditedAt:Date.now()});}
export function createRasterExportRecipe(name="Web PNG",format:RasterExportRecipe["format"]="png"):RasterExportRecipe{return {id:id("raster-export"),name,format,quality:format==="jpg"?90:100,scale:1,colorSpace:"srgb",bitDepth:format==="tiff"?16:8,embedProfile:true,stripMetadata:false,sharpenFor:"screen"};}
export function addRasterExportRecipe(element:PublisherElement,recipe:Partial<RasterExportRecipe>={}){const base=createRasterExportRecipe(recipe.name,recipe.format);return normalizeRasterElement({...element,rasterExportRecipes:[...(element.rasterExportRecipes??[]),{...base,...recipe,id:recipe.id??base.id}],rasterEditedAt:Date.now()});}
export function removeRasterExportRecipe(element:PublisherElement,recipeId:string){return normalizeRasterElement({...element,rasterExportRecipes:(element.rasterExportRecipes??[]).filter((recipe)=>recipe.id!==recipeId),rasterEditedAt:Date.now()});}
export function buildRasterDeliveryManifest(element:PublisherElement){const plan=buildRasterRenderPlan(element);return {version:"17.3",source:plan.source,generatedAt:new Date().toISOString(),colorProfile:plan.colorProfile,bitDepth:plan.bitDepth,recipes:(element.rasterExportRecipes??[]).map((recipe)=>({name:recipe.name,format:recipe.format,quality:recipe.quality,scale:recipe.scale,colorSpace:recipe.colorSpace,bitDepth:recipe.bitDepth})),metadata:element.rasterMetadata??{keywords:[],rating:0,preserveExif:true,preserveGps:false}};}

export function buildRasterRenderPlan(element:PublisherElement):RasterRenderPlan {
  const normalized=normalizeRasterElement(element); const profile=normalizeRasterColorProfile(normalized.rasterColorProfile);
  return {source:normalized.rasterSmartObject?.sourceUri??normalized.originalImageUri??normalized.imageUri??"",smartObject:Boolean(normalized.rasterSmartObject),filters:(normalized.rasterSmartFilters??[]).filter((filter)=>filter.enabled).map((filter)=>filter.kind),adjustments:(normalized.rasterAdjustments??[]).filter((layer)=>layer.enabled).map((layer)=>layer.kind),masks:(normalized.rasterMasks??[]).filter((mask)=>mask.enabled).length,selections:(normalized.rasterSelections??[]).filter((selection)=>selection.enabled).length,retouchStrokes:normalized.rasterRetouchStrokes?.length??0,colorProfile:profile.workingSpace,bitDepth:profile.bitDepth,requiresBake:Boolean((normalized.rasterSmartFilters?.length??0)||(normalized.rasterRetouchStrokes?.length??0)||(normalized.rasterAdjustments?.length??0)),rawDevelopment:Boolean(normalized.rasterRawDevelopment?.enabled),hdr:Boolean(normalized.rasterHDR?.enabled),compositeMode:normalized.rasterCompositeStack?.mode??"none",lut:normalized.rasterLut?.enabled?normalized.rasterLut.name:undefined,exportRecipes:normalized.rasterExportRecipes?.length??0};
}
export function validateRasterRenderPlan(element:PublisherElement):RasterAuditIssue[] {
  const plan=buildRasterRenderPlan(element); const issues:RasterAuditIssue[]=[];
  if(!plan.source)issues.push({severity:"error",message:"Raster source is missing.",fix:"Relink or replace the source image."});
  if(element.rasterSmartObject?.mode==="linked"&&!element.rasterSmartObject.linkedUri)issues.push({severity:"error",message:"Linked smart object has no linked URI.",fix:"Relink or embed the smart object."});
  if(plan.filters.length>12)issues.push({severity:"warning",message:"Large smart-filter stack may reduce live preview performance.",fix:"Bake a duplicate or disable unused filters."});
  if(plan.bitDepth===32&&plan.filters.some((kind)=>kind==="mosaic"||kind==="median"))issues.push({severity:"warning",message:"Some filters may require a 16-bit compatibility render."});
  if(element.rasterColorProfile?.gamutWarning&&!element.rasterColorProfile.softProof)issues.push({severity:"warning",message:"Gamut warning is enabled without soft proofing."});
  if(element.rasterHDR?.enabled&&(element.rasterHDR.sourceCount??1)<2)issues.push({severity:"warning",message:"HDR merge is enabled with fewer than two sources.",fix:"Add bracketed exposures or disable HDR."});
  if(element.rasterCompositeStack?.mode!=="none"&&(element.rasterCompositeStack?.sources.length??0)<2)issues.push({severity:"warning",message:"Composite stack requires at least two sources.",fix:"Add sources to panorama, focus stack, or exposure fusion."});
  if((element.rasterExportRecipes??[]).some((recipe)=>recipe.bitDepth===16&&recipe.format!=="tiff"&&recipe.format!=="png"))issues.push({severity:"warning",message:"Some selected export formats do not preserve 16-bit output."});
  return issues;
}

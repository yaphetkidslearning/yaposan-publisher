import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";
import { getLayoutSettings, type LayoutGuide, type LayoutSettings } from "./layoutGuideEngine";
import { DEFAULT_LAYERS, type LayoutLayer, type MasterSpread } from "./spreadLayerEngine";

export type GuidePreset = { id: string; name: string; guides: LayoutGuide[] };
export type GridPreset = { id: string; name: string; settings: Pick<LayoutSettings,"gridType"|"gridSpacing"|"gridSubdivisions"|"columns"|"rows"|"gutter"|"gridColor"|"gridOpacity"> };
export type SnapPriority = "guides"|"objects"|"margins"|"grid"|"page";
export type LayoutInteractionSettings = {
  magnetStrength: number;
  snapPriority: SnapPriority[];
  showSnapLabels: boolean;
  showDistances: boolean;
  showEqualSpacing: boolean;
  altDisablesSnap: boolean;
  pasteboardSize: number;
  pasteboardSnap: boolean;
};
export type Phase124ProjectData = {
  guidePresets: GuidePreset[];
  gridPresets: GridPreset[];
  interaction: LayoutInteractionSettings;
  masterEditingId?: string;
};

const uid=(p:string)=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
export const DEFAULT_INTERACTION_SETTINGS: LayoutInteractionSettings={magnetStrength:1,snapPriority:["guides","objects","margins","grid","page"],showSnapLabels:true,showDistances:true,showEqualSpacing:true,altDisablesSnap:true,pasteboardSize:500,pasteboardSnap:true};
export function getPhase124Data(project:PublisherProject):Phase124ProjectData{const current=project.phase124Data;return {guidePresets:current?.guidePresets??[],gridPresets:current?.gridPresets??[],masterEditingId:current?.masterEditingId,interaction:{...DEFAULT_INTERACTION_SETTINGS,...(current?.interaction??{})}};}
export function saveGuidePreset(project:PublisherProject,page:PublisherPage,name:string):PublisherProject{const d=getPhase124Data(project);const preset={id:uid("guide-preset"),name:name.trim()||"Guide Preset",guides:getLayoutSettings(page).guides.map(g=>({...g,id:uid("guide")}))};return {...project,phase124Data:{...d,guidePresets:[...d.guidePresets,preset]}};}
export function applyGuidePreset(page:PublisherPage,preset:GuidePreset):PublisherPage{const s=getLayoutSettings(page);return {...page,layoutSettings:{...s,guides:preset.guides.map(g=>({...g,id:uid("guide")}))}};}
export function saveGridPreset(project:PublisherProject,page:PublisherPage,name:string):PublisherProject{const d=getPhase124Data(project),s=getLayoutSettings(page);const settings={gridType:s.gridType,gridSpacing:s.gridSpacing,gridSubdivisions:s.gridSubdivisions,columns:s.columns,rows:s.rows,gutter:s.gutter,gridColor:s.gridColor,gridOpacity:s.gridOpacity};return {...project,phase124Data:{...d,gridPresets:[...d.gridPresets,{id:uid("grid-preset"),name:name.trim()||"Grid Preset",settings}]}};}
export function applyGridPreset(page:PublisherPage,preset:GridPreset):PublisherPage{const s=getLayoutSettings(page);return {...page,layoutSettings:{...s,...preset.settings,gridVisible:true}};}
export function duplicateGuide(page:PublisherPage,id:string,offset=12):PublisherPage{const s=getLayoutSettings(page),g=s.guides.find(x=>x.id===id);if(!g)return page;return {...page,layoutSettings:{...s,guides:[...s.guides,{...g,id:uid("guide"),name:`${g.name} Copy`,position:g.position+offset,locked:false}]}};}
export function moveGuide(page:PublisherPage,id:string,position:number):PublisherPage{const s=getLayoutSettings(page);return {...page,layoutSettings:{...s,guides:s.guides.map(g=>g.id===id&&!g.locked?{...g,position:Math.max(0,position)}:g)}};}
export function computeSpacingFeedback(elements:PublisherElement[],movingId:string,x:number,y:number){const moving=elements.find(e=>e.id===movingId);if(!moving)return null;const others=elements.filter(e=>e.id!==movingId&&!e.hidden);let nearestX: number|undefined,nearestY:number|undefined,dx=Infinity,dy=Infinity;for(const e of others){for(const t of [e.x,e.x+e.width/2,e.x+e.width]){const d=Math.abs((x+moving.width/2)-t);if(d<dx){dx=d;nearestX=t;}}for(const t of [e.y,e.y+e.height/2,e.y+e.height]){const d=Math.abs((y+moving.height/2)-t);if(d<dy){dy=d;nearestY=t;}}}return {vertical:dx<=8?nearestX:undefined,horizontal:dy<=8?nearestY:undefined,distanceX:Number.isFinite(dx)?Math.round(dx):undefined,distanceY:Number.isFinite(dy)?Math.round(dy):undefined};}
export function updateAnchoredElements(page:PublisherPage):PublisherPage{return {...page,elements:page.elements.map(e=>{if(!e.anchorMode||e.anchorMode==="none")return e;const target=e.anchorMode==="page"?{x:0,y:0}:e.anchorMode==="margins"?{x:page.margin,y:page.margin}:page.elements.find(x=>x.id===e.anchorTargetId&&x.isFrame);if(!target)return e;return {...e,x:e.anchorLockX?e.x:target.x+(e.anchorOffsetX??0),y:e.anchorLockY?e.y:target.y+(e.anchorOffsetY??0)};})};}
export function updateAdvancedLayer(project:PublisherProject,layerId:string,updates:Partial<LayoutLayer>):PublisherProject{return {...project,layers:(project.layers??DEFAULT_LAYERS).map(l=>l.id===layerId?{...l,...updates}:l)};}
export function createLayerFolder(project:PublisherProject,name="Layer Folder"):PublisherProject{const layers=project.layers??DEFAULT_LAYERS;const folder:LayoutLayer={id:uid("layer-folder"),name,visible:true,locked:false,printable:true,color:"#64748B",order:layers.length,isFolder:true,opacity:1,blendMode:"normal"};return {...project,layers:[...layers,folder]};}
export function setMasterEditing(project:PublisherProject,masterId?:string):PublisherProject{return {...project,phase124Data:{...getPhase124Data(project),masterEditingId:masterId}};}
export function overrideMasterObject(page:PublisherPage,elementId:string):PublisherPage{return {...page,elements:page.elements.map(e=>e.id===elementId&&e.masterSpreadId?{...e,masterLocked:false,masterOverride:true}:e)};}
export function resetMasterOverrides(page:PublisherPage):PublisherPage{return {...page,elements:page.elements.filter(e=>!e.masterOverride)};}
export function phase124Diagnostics(project:PublisherProject){const d=getPhase124Data(project);const all=project.pages.flatMap(p=>p.elements);return {guidePresets:d.guidePresets.length,gridPresets:d.gridPresets.length,layerFolders:(project.layers??[]).filter(l=>l.isFolder).length,masterOverrides:all.filter(e=>e.masterOverride).length,brokenAnchors:all.filter(e=>e.anchorMode==="frame"&&!all.some(t=>t.id===e.anchorTargetId&&t.isFrame)).length,invalidFrames:all.filter(e=>e.isFrame&&(e.width<=0||e.height<=0)).length};}

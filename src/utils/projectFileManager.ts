import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { PublisherElement, PublisherProject } from "../types/publisher";
import { normalizePublisherProject } from "./publisherStorage";

export const YAPOSAN_PROJECT_EXTENSION = ".yaposan";
export const YAPOSAN_PROJECT_MIME = "application/vnd.yaposan.publisher+json";
export const YAPOSAN_PROJECT_FORMAT = "yaposan-publisher";
export const YAPOSAN_PROJECT_FORMAT_VERSION = 1;

type ProjectEnvelope = {
  format: typeof YAPOSAN_PROJECT_FORMAT;
  formatVersion: number;
  project: unknown;
};

function safeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "publication";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertValidProjectShape(value: unknown): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new Error("This file does not contain a Yaposan project.");
  if (typeof value.name !== "string" || !value.name.trim()) {
    throw new Error("The project name is missing or invalid.");
  }
  if (!Array.isArray(value.pages) || value.pages.length === 0) {
    throw new Error("The project must contain at least one page.");
  }
  for (const [index, page] of value.pages.entries()) {
    if (!isRecord(page)) throw new Error(`Page ${index + 1} is invalid.`);
    if (!Array.isArray(page.elements)) throw new Error(`Page ${index + 1} has an invalid elements list.`);
    if (!Number.isFinite(Number(page.width)) || Number(page.width) <= 0) {
      throw new Error(`Page ${index + 1} has an invalid width.`);
    }
    if (!Number.isFinite(Number(page.height)) || Number(page.height) <= 0) {
      throw new Error(`Page ${index + 1} has an invalid height.`);
    }
  }
  if (typeof value.activePageId !== "string" || !value.activePageId) {
    throw new Error("The active page reference is missing.");
  }
}

export function serializePublisherProject(project: PublisherProject): string {
  return JSON.stringify(
    {
      format: YAPOSAN_PROJECT_FORMAT,
      formatVersion: YAPOSAN_PROJECT_FORMAT_VERSION,
      project,
    },
    null,
    2,
  );
}

export function parsePublisherProject(contents: string): PublisherProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed)) throw new Error("This is not a valid Yaposan project file.");
  if (parsed.format !== YAPOSAN_PROJECT_FORMAT) {
    throw new Error("Unsupported file format. Select a .yaposan project exported by Yaposan Publisher.");
  }
  if (!Number.isInteger(parsed.formatVersion)) {
    throw new Error("The project file version is missing or invalid.");
  }
  if (Number(parsed.formatVersion) > YAPOSAN_PROJECT_FORMAT_VERSION) {
    throw new Error(
      `This project uses file version ${String(parsed.formatVersion)}. Update Yaposan Publisher before opening it.`,
    );
  }
  if (Number(parsed.formatVersion) < 1) {
    throw new Error("This project file version is not supported.");
  }

  const envelope = parsed as ProjectEnvelope;
  assertValidProjectShape(envelope.project);
  const normalized = normalizePublisherProject(envelope.project);
  if (!normalized.pages.some((page) => page.id === normalized.activePageId)) {
    throw new Error("The project refers to an active page that does not exist.");
  }
  return normalized;
}

export async function exportPublisherProjectFile(project: PublisherProject): Promise<void> {
  const filename = `${safeFileName(project.name)}${YAPOSAN_PROJECT_EXTENSION}`;
  const contents = serializePublisherProject(project);
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([contents], { type: YAPOSAN_PROJECT_MIME });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new ExpoFile(Paths.cache, filename);
  file.create({ overwrite: true, intermediates: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType: YAPOSAN_PROJECT_MIME, dialogTitle: `Export ${filename}` });
}

export async function importPublisherProjectFile(): Promise<PublisherProject | null> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = `${YAPOSAN_PROJECT_EXTENSION},${YAPOSAN_PROJECT_MIME}`;
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve(parsePublisherProject(String(reader.result ?? "")));
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Unable to read the selected project file."));
        reader.readAsText(file);
      };
      input.click();
    });
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: [YAPOSAN_PROJECT_MIME, "application/octet-stream", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.name && !asset.name.toLowerCase().endsWith(YAPOSAN_PROJECT_EXTENSION)) {
    throw new Error("Select a .yaposan project file.");
  }
  const file = new ExpoFile(asset.uri);
  return parsePublisherProject(await file.text());
}
const commonFonts=new Set(["Arial","Helvetica","Times New Roman","Georgia","Courier New","Verdana","Tahoma","Trebuchet MS","Impact","Comic Sans MS","System"]);
const scanFonts=(project:PublisherProject)=>{const counts=new Map<string,number>();project.pages.forEach(p=>p.elements.forEach(e=>{if(e.type==="text"){const f=typeof e.fontFamily === "string" ? e.fontFamily.trim() || "Arial" : "Arial";counts.set(f,(counts.get(f)||0)+1);}}));return[...counts].map(([fontFamily,usageCount])=>({fontFamily,usageCount,available:commonFonts.has(fontFamily)}));};
const scanLinkedAssets=(project:PublisherProject)=>project.pages.flatMap(p=>p.elements.flatMap(e=>{const source=e.type==="image"?e.imageUri:e.type==="svg"?e.svgMarkup:undefined;if(!source)return[];const embedded=source.startsWith("data:")||source.trim().startsWith("<svg");const remote=/^https?:\/\//i.test(source);return[{id:`${p.id}:${e.id}`,pageId:p.id,elementId:e.id,elementName:e.name,missing:!embedded&&!remote&&!source.startsWith("file:")&&!source.startsWith("content:")}];}));
const replaceProjectFont=(project:PublisherProject,oldFont:string,newFont:string):PublisherProject=>({...project,updatedAt:Date.now(),pages:project.pages.map(p=>({...p,elements:p.elements.map(e=>e.type==="text"&&(e.fontFamily||"Arial")===oldFont?{...e,fontFamily:newFont}:e)}))});

export type IntegrityIssueKind = "duplicate-id"|"geometry"|"missing-asset"|"missing-font"|"oversized-asset"|"empty-page"|"unsupported-object"|"active-page"|"duplicate-asset";
export type IntegrityIssue = { id:string; kind:IntegrityIssueKind; severity:"error"|"warning"|"info"; pageId?:string; elementId?:string; fontFamily?:string; message:string; repairable:boolean; actions:("repair"|"remove"|"replace"|"relink"|"ignore")[] };
export type ProjectDiagnosticReport = { issues:IntegrityIssue[]; missingAssets:number; missingFonts:number; oversizedImages:number; emptyPages:number; duplicateAssets:number; estimatedBytes:number };
const validTypes=new Set(["text","rectangle","circle","line","triangle","arrow","star","image","svg"]);
const sourceOf=(e:PublisherElement)=>e.type==="image"?e.imageUri:e.type==="svg"?e.svgMarkup:undefined;

export function analyzeProjectIntegrity(project:PublisherProject):ProjectDiagnosticReport{
 const issues:IntegrityIssue[]=[]; const sources=new Map<string,string[]>(); let oversizedImages=0; let estimatedBytes=JSON.stringify(project).length;
 if(!project.pages.some(p=>p.id===project.activePageId)) issues.push({id:"active-page",kind:"active-page",severity:"error",message:"The active page reference is invalid.",repairable:true,actions:["repair"]});
 for(const page of project.pages){
  if(!page.elements.length)issues.push({id:`empty-${page.id}`,kind:"empty-page",severity:"info",pageId:page.id,message:`${page.name} is empty.`,repairable:true,actions:["remove","ignore"]});
  const ids=new Set<string>();
  for(const e of page.elements){
   if(!validTypes.has(e.type))issues.push({id:`unsupported-${page.id}-${e.id}`,kind:"unsupported-object",severity:"error",pageId:page.id,elementId:e.id,message:`${e.name||"Object"} has an unsupported object type.`,repairable:true,actions:["remove"]});
   if(ids.has(e.id))issues.push({id:`duplicate-id-${page.id}-${e.id}`,kind:"duplicate-id",severity:"error",pageId:page.id,elementId:e.id,message:`Duplicate object ID on ${page.name}.`,repairable:true,actions:["repair"]}); ids.add(e.id);
   if(!Number.isFinite(e.x)||!Number.isFinite(e.y)||!Number.isFinite(e.width)||!Number.isFinite(e.height)||e.width<=0||e.height<=0)issues.push({id:`geometry-${page.id}-${e.id}`,kind:"geometry",severity:"error",pageId:page.id,elementId:e.id,message:`${e.name} has invalid geometry.`,repairable:true,actions:["repair","remove"]});
   const source=sourceOf(e); if(source){estimatedBytes+=source.length;const list=sources.get(source)??[];list.push(e.id);sources.set(source,list);if(source.startsWith("data:")&&source.length>8_000_000){oversizedImages++;issues.push({id:`oversized-${e.id}`,kind:"oversized-asset",severity:"warning",pageId:page.id,elementId:e.id,message:`${e.name} is an oversized embedded asset.`,repairable:false,actions:["ignore"]});}}
  }
 }
 const missingAssetList=scanLinkedAssets(project).filter(a=>a.missing); const missingFontList=scanFonts(project).filter(f=>!f.available);
 missingAssetList.forEach(a=>issues.push({id:`asset-${a.id}`,kind:"missing-asset",severity:"error",pageId:a.pageId,elementId:a.elementId,message:`${a.elementName} references a missing asset.`,repairable:true,actions:["relink","remove","ignore"]}));
 missingFontList.forEach(f=>issues.push({id:`font-${f.fontFamily}`,kind:"missing-font",severity:"warning",fontFamily:f.fontFamily,message:`Missing font: ${f.fontFamily} (${f.usageCount} uses).`,repairable:true,actions:["replace","ignore"]}));
 const duplicateAssets=[...sources.values()].reduce((n,ids)=>n+Math.max(0,ids.length-1),0); if(duplicateAssets)issues.push({id:"duplicate-assets",kind:"duplicate-asset",severity:"info",message:`${duplicateAssets} duplicate asset references can be compacted.`,repairable:true,actions:["repair"]});
 return{issues,missingAssets:missingAssetList.length,missingFonts:missingFontList.length,oversizedImages,emptyPages:project.pages.filter(p=>!p.elements.length).length,duplicateAssets,estimatedBytes};
}

export function repairProjectIntegrity(project:PublisherProject):PublisherProject{
 const seen=new Set<string>(); const pages=project.pages.map((page,pi)=>({...page,width:Number.isFinite(page.width)&&page.width>0?page.width:816,height:Number.isFinite(page.height)&&page.height>0?page.height:1056,elements:page.elements.filter(e=>validTypes.has(e.type)).map((e,ei)=>{let id=e.id;if(!id||seen.has(id))id=`repaired-${Date.now()}-${pi}-${ei}`;seen.add(id);return{...e,id,x:Number.isFinite(e.x)?e.x:0,y:Number.isFinite(e.y)?e.y:0,width:Number.isFinite(e.width)&&e.width>0?e.width:100,height:Number.isFinite(e.height)&&e.height>0?e.height:100,opacity:Number.isFinite(e.opacity)?Math.max(0,Math.min(1,e.opacity)):1,rotation:Number.isFinite(e.rotation)?e.rotation:0} as PublisherElement;} )}));
 let next={...project,pages,updatedAt:Date.now(),activePageId:pages.some(p=>p.id===project.activePageId)?project.activePageId:pages[0]?.id??project.activePageId};
 for(const f of scanFonts(next).filter(x=>!x.available))next=replaceProjectFont(next,f.fontFamily,"Arial");
 next={...next,pages:next.pages.map(p=>({...p,elements:p.elements.filter(e=>!scanLinkedAssets(next).some(a=>a.missing&&a.pageId===p.id&&a.elementId===e.id))}))};
 return next;
}

export function repairIntegrityIssue(project:PublisherProject,issue:IntegrityIssue,action:"repair"|"remove"|"replace"):PublisherProject{
 if(action==="replace"&&issue.fontFamily)return replaceProjectFont(project,issue.fontFamily,"Arial");
 if(action==="repair"&&(issue.kind==="active-page"||issue.kind==="duplicate-id"||issue.kind==="geometry"||issue.kind==="duplicate-asset"))return issue.kind==="duplicate-asset"?deduplicateProjectAssets(project).project:repairProjectIntegrity(project);
 if(action==="remove"&&issue.pageId){if(issue.kind==="empty-page"&&project.pages.length>1){const pages=project.pages.filter(p=>p.id!==issue.pageId);return{...project,pages,activePageId:pages.some(p=>p.id===project.activePageId)?project.activePageId:pages[0].id,updatedAt:Date.now()};}return{...project,updatedAt:Date.now(),pages:project.pages.map(p=>p.id===issue.pageId?{...p,elements:p.elements.filter(e=>e.id!==issue.elementId)}:p)};}
 return project;
}

export function relinkProjectAsset(project:PublisherProject,pageId:string,elementId:string,source:string):PublisherProject{
 return{...project,updatedAt:Date.now(),pages:project.pages.map(p=>p.id===pageId?{...p,elements:p.elements.map(e=>e.id===elementId?(e.type==="svg"?{...e,svgMarkup:source,imageUri:source.trim().startsWith("<svg")?`data:image/svg+xml;utf8,${encodeURIComponent(source)}`:e.imageUri}:{...e,imageUri:source}):e)}:p)};
}

export function deduplicateProjectAssets(project:PublisherProject):{project:PublisherProject;duplicates:number;bytesSaved:number}{
 const seen=new Set<string>();let duplicates=0,bytesSaved=0;
 const pages=project.pages.map(page=>({...page,elements:page.elements.map(e=>{const source=sourceOf(e);if(!source)return e;if(!seen.has(source)){seen.add(source);return e;}duplicates++;
  if(e.type==="svg"){const redundant=e.imageUri||"";bytesSaved+=redundant.length;return{...e,imageUri:undefined,svgOriginalMarkup:e.svgOriginalMarkup===e.svgMarkup?undefined:e.svgOriginalMarkup};}
  const original=(e as PublisherElement&{originalImageUri?:string}).originalImageUri;if(original===e.imageUri){bytesSaved+=original?.length||0;const copy={...e} as PublisherElement&{originalImageUri?:string};delete copy.originalImageUri;return copy;}
  return e;
 })}));
 return{project:{...project,pages,updatedAt:Date.now()},duplicates,bytesSaved};
}

import { File as ExpoFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { PublisherProject } from "../types/publisher";
import { serializeProjectPackage } from "./projectProfessionalManager";

import { createStoredZip } from "./zipStore";

const safe=(v:string)=>v.trim().replace(/[\\/:*?"<>|]+/g,"-")||"publication";
export async function exportBatchProjectPackages(projects:PublisherProject[]){
 const files=projects.map((p,i)=>({name:`${String(i+1).padStart(2,"0")}-${safe(p.name)}.yaposan-package`,contents:serializeProjectPackage(p)}));files.push({name:"manifest.json",contents:JSON.stringify({format:"yaposan-batch-package",version:1,createdAt:Date.now(),projects:projects.map(p=>({id:p.id,name:p.name}))},null,2)});const bytes=createStoredZip(files);const filename=`Yaposan-${projects.length}-Projects.zip`;
 if(Platform.OS==="web"&&typeof document!=="undefined"){const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:"application/zip"}));const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);return;}
 const file=new ExpoFile(Paths.cache,filename);file.create({overwrite:true,intermediates:true});file.write(bytes);if(!(await Sharing.isAvailableAsync()))throw new Error("Sharing is not available on this device.");await Sharing.shareAsync(file.uri,{mimeType:"application/zip",dialogTitle:`Export ${filename}`});
}

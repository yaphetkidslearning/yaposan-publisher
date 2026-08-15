import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppProjectDraft } from "./phase9110CreationPlatform";
const KEY="yaposan.app-projects.91.12";
export type StoredAppProject=AppProjectDraft&{id:string;createdAt:string;updatedAt:string};
export async function listAppProjects():Promise<StoredAppProject[]>{try{return JSON.parse(await AsyncStorage.getItem(KEY)||"[]") as StoredAppProject[]}catch{return[]}}
export async function saveAppProject(project:AppProjectDraft):Promise<StoredAppProject>{const all=await listAppProjects();const old=all.find(x=>x.name===project.name);const now=new Date().toISOString();const next:StoredAppProject={...project,id:old?.id??`app-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,createdAt:old?.createdAt??now,updatedAt:now};await AsyncStorage.setItem(KEY,JSON.stringify([next,...all.filter(x=>x.id!==next.id)].slice(0,50)));return next}

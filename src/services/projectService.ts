const base =
  (globalThis as any).process?.env?.EXPO_PUBLIC_API_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://yaposan-api.onrender.com"
    : "http://localhost:4100");
let token=""; export const configureProjectService=(accessToken:string)=>{token=accessToken};
export type CloudProject={id:string;workspaceId:string;ownerUserId:string;name:string;revision:number;payload:unknown;deletedAt?:string;createdAt:string;updatedAt:string};
export type CloudProjectVersion={id:string;projectId:string;revision:number;payload:unknown;actorUserId:string;createdAt:string};
async function call<T>(path:string,init:RequestInit={}){const r=await fetch(`${base}${path}`,{...init,headers:{"content-type":"application/json",authorization:`Bearer ${token}`,...(init.headers??{})}});const data=await r.json();if(!r.ok){const error=new Error(data?.error?.message??"Project request failed") as Error&{code?:string;remote?:CloudProject};error.code=data?.error?.code;error.remote=data?.project;throw error}return data as T}
export const listProjects=async()=> (await call<{items:CloudProject[]}>("/api/v1/projects")).items;
export const createProject=(input:{workspaceId:string;name:string;payload:unknown})=>call<{project:CloudProject}>("/api/v1/projects",{method:"POST",body:JSON.stringify(input)}).then(x=>x.project);
export const updateProject=(project:CloudProject,changes:{name?:string;payload?:unknown})=>call<{project:CloudProject}>(`/api/v1/projects/${project.id}`,{method:"PUT",body:JSON.stringify({...changes,baseRevision:project.revision})}).then(x=>x.project);
export const deleteProject=(id:string)=>call<{project:CloudProject}>(`/api/v1/projects/${id}`,{method:"DELETE"}).then(x=>x.project);
export const listProjectVersions=(id:string)=>call<{items:CloudProjectVersion[]}>(`/api/v1/projects/${id}/versions`).then(x=>x.items);
export function resolveProjectConflict(local:CloudProject,remote:CloudProject){if(local.revision===remote.revision)return{winner:local,loser:remote,strategy:"same-revision" as const};return local.updatedAt>remote.updatedAt?{winner:local,loser:remote,strategy:"latest-write" as const}:{winner:remote,loser:local,strategy:"latest-write" as const}}
export function createOfflineOperation(projectId:string,type:"create"|"update"|"delete",payload:unknown){return{id:`offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,projectId,type,payload,createdAt:new Date().toISOString(),attempts:0}}

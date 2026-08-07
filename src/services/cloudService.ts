const API_URL =
  (globalThis as any).process?.env?.EXPO_PUBLIC_API_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://yaposan-api.onrender.com"
    : "http://localhost:4100");
let accessToken="";
let refreshToken="";
export const setCloudSession=(session:{accessToken:string;refreshToken?:string})=>{accessToken=session.accessToken;if(session.refreshToken)refreshToken=session.refreshToken};
export const clearCloudSession=()=>{accessToken="";refreshToken=""};

async function rawRequest<T>(path:string,init:RequestInit={}){const response=await fetch(`${API_URL}${path}`,{...init,headers:{"content-type":"application/json",...(accessToken?{authorization:`Bearer ${accessToken}`}:{ }),...(init.headers??{})}});const data=await response.json();return{response,data:data as any as T}}
async function renew(){if(!refreshToken)throw new Error("Session expired");const {response,data}=await rawRequest<{accessToken:string;refreshToken:string}>("/api/v1/auth/refresh",{method:"POST",body:JSON.stringify({refreshToken})});if(!response.ok)throw new Error("Session expired");setCloudSession(data);}
async function request<T>(path:string,init:RequestInit={},retry=true){let {response,data}=await rawRequest<T>(path,init);if(response.status===401&&retry&&refreshToken){await renew();return request<T>(path,init,false)}if(!response.ok)throw new Error((data as any)?.error?.message??`Request failed: ${response.status}`);return data}

export type CloudUser={id:string;email:string;emailVerified:boolean;status:string};
export type CloudSession={user:CloudUser;accessToken:string;refreshToken:string;sessionId:string};
export async function registerUser(email:string,password:string,organizationName?:string){const result=await request<CloudSession&{organization:unknown;workspace:unknown}>("/api/v1/auth/register",{method:"POST",body:JSON.stringify({email,password,organizationName})});setCloudSession(result);return result}
export async function loginUser(email:string,password:string){const result=await request<CloudSession>("/api/v1/auth/login",{method:"POST",body:JSON.stringify({email,password})});setCloudSession(result);return result}
export const getCurrentUser=()=>request<{user:CloudUser}>("/api/v1/me").then(x=>x.user);
export const getWorkspaces=()=>request<{items:Array<{id:string;organizationId:string;name:string;region:string}>}>("/api/v1/workspaces").then(x=>x.items);
export const getCloudHealth=()=>request<{status:string;version:string;time:string}>("/health");
export const getCloudReadiness=()=>request<{status:string;checks:Record<string,boolean>;issues:string[]}>("/ready");
export const createAssetUploadPlan=(input:{workspaceId:string;name:string;contentType:string;size:number})=>request<{upload:{key:string;method:"PUT";uploadUrl:string;headers:Record<string,string>;expiresAt:string}}>("/api/v1/assets/upload-plan",{method:"POST",body:JSON.stringify(input)}).then(x=>x.upload);
export const completeAssetUpload=(input:{workspaceId:string;name:string;contentType:string;size:number;key:string;checksum?:string})=>request<{asset:unknown}>("/api/v1/assets/complete",{method:"POST",body:JSON.stringify(input)}).then(x=>x.asset);
export async function uploadAsset(file:Blob,metadata:{workspaceId:string;name:string}){const plan=await createAssetUploadPlan({workspaceId:metadata.workspaceId,name:metadata.name,contentType:file.type||"application/octet-stream",size:file.size});const upload=await fetch(plan.uploadUrl,{method:plan.method,headers:plan.headers,body:file});if(!upload.ok)throw new Error(`Upload failed: ${upload.status}`);return completeAssetUpload({workspaceId:metadata.workspaceId,name:metadata.name,contentType:file.type||"application/octet-stream",size:file.size,key:plan.key})}

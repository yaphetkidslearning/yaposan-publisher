import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_URL, apiReachabilityMessage } from "../config/api";

const SESSION_KEY="yaposan.auth.session.v1";

export type AuthUser={id:string;email:string;emailVerified?:boolean;status?:string};
export type Workspace={id:string;organizationId:string;name:string;region:string};
export type AuthSession={user:AuthUser;accessToken:string;refreshToken:string;accessTokenExpiresAt?:string;refreshTokenExpiresAt?:string;workspace?:Workspace;organization?:{id:string;name:string;plan:string}};
type AuthContextValue={ready:boolean;session:AuthSession|null;isAuthenticated:boolean;signIn:(email:string,password:string)=>Promise<void>;register:(email:string,password:string)=>Promise<{message?:string;verificationRequired?:boolean;verification?:{sent?:boolean;configured?:boolean}}>;signOut:()=>Promise<void>;authorizedFetch:(path:string,init?:RequestInit)=>Promise<Response>;refresh:()=>Promise<string|null>};
const AuthContext=createContext<AuthContextValue|null>(null);

async function parseError(response:Response){try{const data=await response.json();const message=String(data?.error?.message??"Request failed");const details=Array.isArray(data?.error?.details)?data.error.details.map((item:unknown)=>String(item)).filter(Boolean):[];return details.length?`${message}: ${details.join(". ")}`:message}catch{return "Request failed"}}

function parseStoredSession(raw:string|null):AuthSession|null{
 if(!raw)return null;
 try{
  const parsed=JSON.parse(raw) as Partial<AuthSession>;
  if(!parsed?.accessToken||!parsed?.user?.id||!parsed?.user?.email)return null;
  return parsed as AuthSession;
 }catch{return null}
}

async function validateStoredSession(stored:AuthSession):Promise<AuthSession|null>{
 const check=async(accessToken:string)=>fetch(`${API_URL}/api/v1/me`,{headers:{authorization:`Bearer ${accessToken}`}});
 try{
  let response=await check(stored.accessToken);
  if(response.ok){
   const data=await response.json();
   return {...stored,user:{...stored.user,...data.user}};
  }
  if(response.status!==401&&response.status!==404)return stored;
  if(!stored.refreshToken)return null;
  const refreshResponse=await fetch(`${API_URL}/api/v1/auth/refresh`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({refreshToken:stored.refreshToken})});
  if(!refreshResponse.ok)return null;
  const refreshed=await refreshResponse.json();
  const next={...stored,...refreshed} as AuthSession;
  response=await check(next.accessToken);
  if(!response.ok)return null;
  const data=await response.json();
  return {...next,user:{...next.user,...data.user}};
 }catch{
  // Keep a locally stored session during a temporary API outage. Protected
  // requests still re-check authorization and refresh/clear on a real 401.
  return stored;
 }
}

export function AuthProvider({children}:{children:React.ReactNode}){
 const [ready,setReady]=useState(false);const [session,setSession]=useState<AuthSession|null>(null);
 useEffect(()=>{
  let active=true;
  void AsyncStorage.getItem(SESSION_KEY)
   .then(parseStoredSession)
   .then(async stored=>stored?validateStoredSession(stored):null)
   .then(async next=>{
    if(!active)return;
    setSession(next);
    if(next)await AsyncStorage.setItem(SESSION_KEY,JSON.stringify(next));
    else await AsyncStorage.removeItem(SESSION_KEY);
    if(active)setReady(true);
   })
   .catch(()=>{if(active)setReady(true)});
  return()=>{active=false};
 },[]);
 const persist=useCallback(async(next:AuthSession|null)=>{setSession(next);if(next)await AsyncStorage.setItem(SESSION_KEY,JSON.stringify(next));else await AsyncStorage.removeItem(SESSION_KEY)},[]);
 const request=useCallback(async(path:string,body:unknown)=>{let response:Response;try{response=await fetch(`${API_URL}${path}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)})}catch(error){throw new Error(apiReachabilityMessage(path,error))}if(!response.ok)throw new Error(await parseError(response));return response.json()},[]);
 const signIn=useCallback(async(email:string,password:string)=>{const normalizedEmail=email.trim().toLowerCase();const data=await request("/api/v1/auth/login",{email:normalizedEmail,password});const workspaceResponse=await fetch(`${API_URL}/api/v1/workspaces`,{headers:{authorization:`Bearer ${data.accessToken}`}});const workspaceData=workspaceResponse.ok?await workspaceResponse.json():{items:[]};await persist({...data,workspace:workspaceData.items?.[0]})},[persist,request]);
 const register=useCallback(async(email:string,password:string)=>{const normalizedEmail=email.trim().toLowerCase();const data=await request("/api/v1/auth/register",{email:normalizedEmail,password,organizationName:"My Yaposan Workspace",region:"us-east"});return {message:data?.message,verificationRequired:Boolean(data?.verificationRequired),verification:data?.verification}},[request]);
 const signOut=useCallback(async()=>{if(session?.accessToken){try{await fetch(`${API_URL}/api/v1/auth/logout`,{method:"POST",headers:{authorization:`Bearer ${session.accessToken}`}})}catch{}}await persist(null)},[persist,session]);
 const refresh=useCallback(async()=>{if(!session?.refreshToken)return null;try{const data=await request("/api/v1/auth/refresh",{refreshToken:session.refreshToken});const next={...session,...data};await persist(next);return next.accessToken}catch{await persist(null);return null}},[persist,request,session]);
 const authorizedFetch=useCallback(async(path:string,init:RequestInit={})=>{if(!session?.accessToken)throw new Error("Authentication required");let response:Response;try{response=await fetch(`${API_URL}${path}`,{...init,headers:{"content-type":"application/json",authorization:`Bearer ${session.accessToken}`,...(init.headers??{})}})}catch(error){throw new Error(apiReachabilityMessage(path,error))}if(response.status===401){const token=await refresh();if(token){try{response=await fetch(`${API_URL}${path}`,{...init,headers:{"content-type":"application/json",authorization:`Bearer ${token}`,...(init.headers??{})}})}catch(error){throw new Error(apiReachabilityMessage(path,error))}}}return response},[refresh,session]);
 const value=useMemo(()=>({ready,session,isAuthenticated:Boolean(session?.accessToken),signIn,register,signOut,authorizedFetch,refresh}),[authorizedFetch,ready,refresh,register,session,signIn,signOut]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value}

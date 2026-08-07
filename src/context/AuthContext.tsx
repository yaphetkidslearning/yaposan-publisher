import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const API_URL =
  (globalThis as any).process?.env?.EXPO_PUBLIC_API_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://yaposan-api.onrender.com"
    : "http://localhost:4100");
const SESSION_KEY="yaposan.auth.session.v1";

export type AuthUser={id:string;email:string;emailVerified?:boolean;status?:string};
export type Workspace={id:string;organizationId:string;name:string;region:string};
export type AuthSession={user:AuthUser;accessToken:string;refreshToken:string;accessTokenExpiresAt?:string;refreshTokenExpiresAt?:string;workspace?:Workspace;organization?:{id:string;name:string;plan:string}};
type AuthContextValue={ready:boolean;session:AuthSession|null;isAuthenticated:boolean;signIn:(email:string,password:string)=>Promise<void>;register:(email:string,password:string)=>Promise<void>;signOut:()=>Promise<void>;authorizedFetch:(path:string,init?:RequestInit)=>Promise<Response>;refresh:()=>Promise<string|null>};
const AuthContext=createContext<AuthContextValue|null>(null);

async function parseError(response:Response){try{const data=await response.json();return data?.error?.message??"Request failed"}catch{return "Request failed"}}

export function AuthProvider({children}:{children:React.ReactNode}){
 const [ready,setReady]=useState(false);const [session,setSession]=useState<AuthSession|null>(null);
 useEffect(()=>{void AsyncStorage.getItem(SESSION_KEY).then(raw=>{if(raw)try{setSession(JSON.parse(raw))}catch{};setReady(true)})},[]);
 const persist=useCallback(async(next:AuthSession|null)=>{setSession(next);if(next)await AsyncStorage.setItem(SESSION_KEY,JSON.stringify(next));else await AsyncStorage.removeItem(SESSION_KEY)},[]);
 const request=useCallback(async(path:string,body:unknown)=>{const response=await fetch(`${API_URL}${path}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(!response.ok)throw new Error(await parseError(response));return response.json()},[]);
 const signIn=useCallback(async(email:string,password:string)=>{const data=await request("/api/v1/auth/login",{email,password});const workspaceResponse=await fetch(`${API_URL}/api/v1/workspaces`,{headers:{authorization:`Bearer ${data.accessToken}`}});const workspaceData=workspaceResponse.ok?await workspaceResponse.json():{items:[]};await persist({...data,workspace:workspaceData.items?.[0]})},[persist,request]);
 const register=useCallback(async(email:string,password:string)=>{const data=await request("/api/v1/auth/register",{email,password,organizationName:"My Yaposan Workspace",region:"us-east"});await persist(data)},[persist,request]);
 const signOut=useCallback(async()=>persist(null),[persist]);
 const refresh=useCallback(async()=>{if(!session?.refreshToken)return null;try{const data=await request("/api/v1/auth/refresh",{refreshToken:session.refreshToken});const next={...session,...data};await persist(next);return next.accessToken}catch{await persist(null);return null}},[persist,request,session]);
 const authorizedFetch=useCallback(async(path:string,init:RequestInit={})=>{if(!session?.accessToken)throw new Error("Authentication required");let response=await fetch(`${API_URL}${path}`,{...init,headers:{"content-type":"application/json",authorization:`Bearer ${session.accessToken}`,...(init.headers??{})}});if(response.status===401){const token=await refresh();if(token)response=await fetch(`${API_URL}${path}`,{...init,headers:{"content-type":"application/json",authorization:`Bearer ${token}`,...(init.headers??{})}})}return response},[refresh,session]);
 const value=useMemo(()=>({ready,session,isAuthenticated:Boolean(session?.accessToken),signIn,register,signOut,authorizedFetch,refresh}),[authorizedFetch,ready,refresh,register,session,signIn,signOut]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value}

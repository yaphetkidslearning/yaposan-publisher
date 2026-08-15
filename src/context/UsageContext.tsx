import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export type UsageStatus = {
  plan: string;
  planName?: string;
  usage: { cloudProjects:number; monthlyExports:number; dailyAi:number; storageBytes:number };
  limits: { cloudProjects:number; monthlyExports:number; dailyAi:number; storageBytes:number; standardFormats:string[] };
  remaining: { cloudProjects:number; monthlyExports:number; dailyAi:number; storageBytes:number };
  resets: { monthlyExportsAt:string; dailyAiAt:string };
};

type UsageContextValue={status:UsageStatus|null;loading:boolean;error:string;refresh:()=>Promise<void>;percent:(key:"cloudProjects"|"monthlyExports"|"dailyAi"|"storageBytes")=>number};
const UsageContext=createContext<UsageContextValue|null>(null);

export function UsageProvider({children}:{children:React.ReactNode}){
 const auth=useAuth(); const [status,setStatus]=useState<UsageStatus|null>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
 const refresh=useCallback(async()=>{if(!auth.isAuthenticated){setStatus(null);setError("");return}setLoading(true);setError("");try{const response=await auth.authorizedFetch("/api/v1/usage/status");const data=await response.json();if(!response.ok)throw new Error(data?.error?.message??"Unable to load usage");setStatus(data)}catch(e){setError(e instanceof Error?e.message:"Unable to load usage")}finally{setLoading(false)}},[auth]);
 useEffect(()=>{const timer=setTimeout(()=>{void refresh()},0);return()=>clearTimeout(timer)},[refresh]);
 const percent=useCallback((key:"cloudProjects"|"monthlyExports"|"dailyAi"|"storageBytes")=>{if(!status)return 0;const limit=status.limits[key]||1;return Math.max(0,Math.min(100,status.usage[key]/limit*100))},[status]);
 const value=useMemo(()=>({status,loading,error,refresh,percent}),[status,loading,error,refresh,percent]);
 return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>
}
export function useUsage(){const value=useContext(UsageContext);if(!value)throw new Error("useUsage must be used inside UsageProvider");return value}

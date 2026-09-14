import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AgentWorkflow } from "./creationPlatform";
const KEY="yaposan.ai-agents.91.12";
export type PersistedAgent=AgentWorkflow&{createdAt:string;updatedAt:string;runCount:number;lastRun?:string;lastStatus?:"succeeded"|"failed"};
export async function listAgents():Promise<PersistedAgent[]>{try{return JSON.parse(await AsyncStorage.getItem(KEY)||"[]") as PersistedAgent[]}catch{return[]}}
export async function saveAgent(agent:AgentWorkflow):Promise<PersistedAgent>{const all=await listAgents();const old=all.find(x=>x.id===agent.id);const now=new Date().toISOString();const next:PersistedAgent={...agent,createdAt:old?.createdAt??now,updatedAt:now,runCount:old?.runCount??0,lastRun:old?.lastRun,lastStatus:old?.lastStatus};await AsyncStorage.setItem(KEY,JSON.stringify([next,...all.filter(x=>x.id!==agent.id)].slice(0,100)));return next}
export async function recordAgentRun(id:string,status:"succeeded"|"failed"){const all=await listAgents();await AsyncStorage.setItem(KEY,JSON.stringify(all.map(x=>x.id===id?{...x,runCount:x.runCount+1,lastRun:new Date().toISOString(),lastStatus:status,updatedAt:new Date().toISOString()}:x)))}

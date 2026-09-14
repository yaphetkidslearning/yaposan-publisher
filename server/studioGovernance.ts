import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SpaceStudioRecord, StudioNode } from './database';
import { requireSpaceAccess } from './spaces';
import { getYaposanToolCatalog } from './toolRegistry';

export type StudioExecutionPlanNode = {
  nodeId:string; name:string; kind:StudioNode['kind']; risk:'low'|'medium'|'high';
  requiresApproval:boolean; sideEffects:string[]; billing:'none'|'external'|'yaposan'|'unknown'; refId?:string;
};
export type StudioExecutionPlan = {
  traceId:string; studioId:string; studioVersion:number; nodeCount:number; nodes:StudioExecutionPlanNode[];
  requiredApprovalNodeIds:string[]; yaposanGpuNodes:number; externalBillingNodes:number;
  limits:{maxInputBytes:number;maxOutputBytes:number;nodeTimeoutMs:number;runsPerMinute:number};
};

const buckets = new Map<string,{windowStart:number;count:number}>();
const n=(name:string,fallback:number,min:number,max:number)=>{const raw=Number(process.env[name]??fallback);return Number.isFinite(raw)?Math.max(min,Math.min(max,Math.floor(raw))):fallback};
export const studioExecutionLimits=()=>({
  maxInputBytes:n('STUDIO_MAX_INPUT_BYTES',262144,1024,5_000_000),
  maxOutputBytes:n('STUDIO_MAX_OUTPUT_BYTES',524288,4096,10_000_000),
  nodeTimeoutMs:n('STUDIO_NODE_TIMEOUT_MS',30000,1000,300000),
  runsPerMinute:n('STUDIO_RUNS_PER_MINUTE',20,1,1000),
});

export function stableExecutionKey(value:string){return createHash('sha256').update(value).digest('hex').slice(0,48)}
export function serializedBytes(value:unknown){try{return Buffer.byteLength(JSON.stringify(value),'utf8')}catch{return Number.MAX_SAFE_INTEGER}}
export function assertStudioInputAllowed(input:unknown){const {maxInputBytes}=studioExecutionLimits();if(serializedBytes(input)>maxInputBytes)throw new Error('STUDIO_INPUT_TOO_LARGE')}
export function assertStudioRunRate(userId:string,spaceId:string){
  const now=Date.now(), key=`${userId}:${spaceId}`, limits=studioExecutionLimits(), current=buckets.get(key);
  if(!current||now-current.windowStart>=60_000){buckets.set(key,{windowStart:now,count:1});return}
  current.count+=1;if(current.count>limits.runsPerMinute)throw new Error('STUDIO_RUN_RATE_LIMITED');
}
export function boundedExecutionValue(value:unknown){
  const {maxOutputBytes}=studioExecutionLimits();
  if(serializedBytes(value)<=maxOutputBytes)return value;
  let preview:string;try{preview=typeof value==='string'?value:JSON.stringify(value)}catch{preview='[unserializable output]'}
  return {truncated:true,reason:'STUDIO_OUTPUT_LIMIT',preview:String(preview).slice(0,Math.min(8192,maxOutputBytes))};
}
export async function withStudioNodeTimeout<T>(promise:Promise<T>,nodeId:string){
  const timeout=studioExecutionLimits().nodeTimeoutMs;let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([promise,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(new Error(`STUDIO_NODE_TIMEOUT:${nodeId}`)),timeout)})])}finally{if(timer)clearTimeout(timer)}
}

export async function buildStudioExecutionPlan(db:DatabaseAdapter,userId:string,spaceId:string,studioId:string):Promise<StudioExecutionPlan>{
  await requireSpaceAccess(db,userId,spaceId,'viewer');const studio=await db.get('spaceStudios',studioId);if(!studio||studio.spaceId!==spaceId)throw new Error('STUDIO_NOT_FOUND');
  return buildPlanFromStudio(db,spaceId,studio);
}
async function buildPlanFromStudio(db:DatabaseAdapter,spaceId:string,studio:SpaceStudioRecord):Promise<StudioExecutionPlan>{
  const tools=getYaposanToolCatalog();const compute=await db.find('spaceComputeProfiles',x=>x.spaceId===spaceId);const ai=await db.find('spaceAIAgents',x=>x.spaceId===spaceId);
  const nodes:StudioExecutionPlanNode[]=studio.nodes.map(node=>{
    if(node.kind==='tool'){
      const tool=tools.find(t=>t.id===node.refId);const explicit=(node.config as any)?.requiresApproval===true;
      return {nodeId:node.id,name:node.name,kind:node.kind,refId:node.refId,risk:tool?.risk??'medium',requiresApproval:Boolean(tool?.requiresApproval||explicit),sideEffects:tool?.sideEffects??[],billing:tool?.access==='yaposan_credits'?'yaposan':tool?.access==='bring_your_own'?'external':'none'};
    }
    if(node.kind==='compute'){
      const profile=compute.find(x=>x.id===node.refId);const billing=profile?.billing??'unknown';
      return {nodeId:node.id,name:node.name,kind:node.kind,refId:node.refId,risk:billing==='yaposan'?'medium':'low',requiresApproval:(node.config as any)?.requiresApproval===true,sideEffects:billing==='yaposan'?['consumes_yaposan_gpu_credits']:[],billing};
    }
    if(node.kind==='ai'){
      const agent=ai.find(x=>x.id===node.refId);const billing=(agent?.provider||'').toLowerCase()==='yaposan'?'yaposan':'external';
      return {nodeId:node.id,name:node.name,kind:node.kind,refId:node.refId,risk:'low',requiresApproval:(node.config as any)?.requiresApproval===true,sideEffects:['sends_prompt_to_ai_provider'],billing};
    }
    return {nodeId:node.id,name:node.name,kind:node.kind,refId:node.refId,risk:'low',requiresApproval:false,sideEffects:[],billing:'none'};
  });
  return {traceId:randomUUID(),studioId:studio.id,studioVersion:studio.version,nodeCount:nodes.length,nodes,requiredApprovalNodeIds:nodes.filter(x=>x.requiresApproval).map(x=>x.nodeId),yaposanGpuNodes:nodes.filter(x=>x.sideEffects.includes('consumes_yaposan_gpu_credits')).length,externalBillingNodes:nodes.filter(x=>x.billing==='external').length,limits:studioExecutionLimits()};
}

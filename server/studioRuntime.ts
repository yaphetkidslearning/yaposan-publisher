import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SpaceVisibility, StudioEdge, StudioNode, StudioNodeExecutionState } from './database';
import { requireSpaceAccess } from './spaces';
import { getYaposanToolCatalog } from './toolRegistry';
import { spendGPUCredits } from './commerce';
import { assertStudioInputAllowed, assertStudioRunRate, boundedExecutionValue, buildStudioExecutionPlan, stableExecutionKey, withStudioNodeTimeout } from './studioGovernance';

const VISIBILITIES: SpaceVisibility[]=['private','team','unlisted','public','paid'];
const NODE_KINDS=new Set(['input','tool','ai','compute','output']);

function sanitizeNodes(value:unknown):StudioNode[]{
  if(!Array.isArray(value)) return [];
  return value.slice(0,80).map((raw:any,i)=>({
    id:String(raw?.id||`node-${i+1}`).slice(0,80),
    kind:(NODE_KINDS.has(raw?.kind)?raw.kind:'tool') as StudioNode['kind'],
    name:String(raw?.name||raw?.kind||'Step').slice(0,120),
    refId:raw?.refId?String(raw.refId).slice(0,160):undefined,
    config:raw?.config&&typeof raw.config==='object'?raw.config:undefined,
  }));
}
function sanitizeEdges(value:unknown):StudioEdge[]{
  if(!Array.isArray(value)) return [];
  return value.slice(0,160).map((e:any)=>({from:String(e?.from||'').slice(0,80),to:String(e?.to||'').slice(0,80)})).filter(e=>e.from&&e.to);
}
function orderedNodes(nodes:StudioNode[],edges:StudioEdge[]){
  const byId=new Map(nodes.map(n=>[n.id,n]));const indegree=new Map(nodes.map(n=>[n.id,0]));const next=new Map(nodes.map(n=>[n.id,[] as string[]]));
  for(const e of edges){if(byId.has(e.from)&&byId.has(e.to)){indegree.set(e.to,(indegree.get(e.to)||0)+1);next.get(e.from)!.push(e.to)}}
  const queue=nodes.filter(n=>(indegree.get(n.id)||0)===0).map(n=>n.id);const out:StudioNode[]=[];
  while(queue.length){const id=queue.shift()!;out.push(byId.get(id)!);for(const target of next.get(id)||[]){const d=(indegree.get(target)||0)-1;indegree.set(target,d);if(d===0)queue.push(target)}}
  if(out.length!==nodes.length) throw new Error('STUDIO_GRAPH_CYCLE');return out;
}
function nodeState(nodeId:string,status:StudioNodeExecutionState['status'],extra:Partial<StudioNodeExecutionState>={}):StudioNodeExecutionState{return {nodeId,status,...extra}}

export async function listStudios(db:DatabaseAdapter,userId:string,spaceId:string){await requireSpaceAccess(db,userId,spaceId,'viewer');return (await db.find('spaceStudios',s=>s.spaceId===spaceId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
export async function createStudio(db:DatabaseAdapter,userId:string,spaceId:string,body:any){await requireSpaceAccess(db,userId,spaceId,'editor');const nodes=sanitizeNodes(body.nodes);const edges=sanitizeEdges(body.edges);orderedNodes(nodes,edges);return db.insert('spaceStudios',{spaceId,ownerUserId:userId,name:String(body.name||'Untitled Studio').slice(0,120),description:body.description?String(body.description).slice(0,1000):undefined,visibility:VISIBILITIES.includes(body.visibility)?body.visibility:'private',status:'draft',nodes,edges,version:1});}
export async function updateStudio(db:DatabaseAdapter,userId:string,spaceId:string,studioId:string,body:any){await requireSpaceAccess(db,userId,spaceId,'editor');const studio=await db.get('spaceStudios',studioId);if(!studio||studio.spaceId!==spaceId)throw new Error('STUDIO_NOT_FOUND');const nodes=body.nodes===undefined?studio.nodes:sanitizeNodes(body.nodes);const edges=body.edges===undefined?studio.edges:sanitizeEdges(body.edges);orderedNodes(nodes,edges);return db.update('spaceStudios',studioId,{name:body.name===undefined?studio.name:String(body.name).slice(0,120),description:body.description===undefined?studio.description:String(body.description).slice(0,1000),visibility:VISIBILITIES.includes(body.visibility)?body.visibility:studio.visibility,status:['draft','published','archived'].includes(body.status)?body.status:studio.status,nodes,edges,version:studio.version+1});}
export async function getStudio(db:DatabaseAdapter,userId:string,spaceId:string,studioId:string){await requireSpaceAccess(db,userId,spaceId,'viewer');const studio=await db.get('spaceStudios',studioId);if(!studio||studio.spaceId!==spaceId)throw new Error('STUDIO_NOT_FOUND');return studio;}
export const planStudioRun=buildStudioExecutionPlan;

export async function runStudio(db:DatabaseAdapter,userId:string,spaceId:string,studioId:string,input:unknown,options:{approvedNodeIds?:string[];executionKey?:string;parentRunId?:string}={}){
  await requireSpaceAccess(db,userId,spaceId,'viewer');assertStudioInputAllowed(input);
  const studio=await getStudio(db,userId,spaceId,studioId);const executionKey=options.executionKey?stableExecutionKey(options.executionKey):undefined;
  if(executionKey){const prior=(await db.find('spaceStudioRuns',r=>r.spaceId===spaceId&&r.studioId===studioId&&r.userId===userId&&r.executionKey===executionKey))[0];if(prior)return prior;}
  assertStudioRunRate(userId,spaceId);const plan=await buildStudioExecutionPlan(db,userId,spaceId,studioId);
  const approvedNodeIds=[...new Set((options.approvedNodeIds??[]).map(String))];const missing=plan.requiredApprovalNodeIds.filter(id=>!approvedNodeIds.includes(id));
  if(missing.length)throw new Error(`STUDIO_APPROVAL_REQUIRED:${missing.join(',')}`);
  const ordered=orderedNodes(studio.nodes,studio.edges),tools=getYaposanToolCatalog(),ai=await db.find('spaceAIAgents',x=>x.spaceId===spaceId),compute=await db.find('spaceComputeProfiles',x=>x.spaceId===spaceId);
  const startedAt=new Date().toISOString(),traceId=plan.traceId;const nodeStates=ordered.map(n=>nodeState(n.id,'pending'));const steps:any[]=[];let value=input;
  let run;
  try{run=await db.insert('spaceStudioRuns',{spaceId,studioId,userId,status:'running',input,steps:[],traceId,executionKey,studioVersion:studio.version,nodeStates,approvedNodeIds,startedAt,parentRunId:options.parentRunId});}
  catch(error){if(executionKey){const prior=(await db.find('spaceStudioRuns',r=>r.spaceId===spaceId&&r.studioId===studioId&&r.userId===userId&&r.executionKey===executionKey))[0];if(prior)return prior;}throw error}
  const space=await db.get('spaces',spaceId);if(!space)throw new Error('SPACE_NOT_FOUND');
  await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'studio.run.started',target:run.id,metadata:{spaceId,studioId,traceId,studioVersion:studio.version,nodeCount:ordered.length,executionKey:Boolean(executionKey)}});
  try{
    for(let index=0;index<ordered.length;index++){
      const node=ordered[index],nodeStarted=Date.now();nodeStates[index]=nodeState(node.id,'running',{startedAt:new Date(nodeStarted).toISOString()});await db.update('spaceStudioRuns',run.id,{nodeStates:[...nodeStates]});
      const output=await withStudioNodeTimeout((async()=>{
        let next:any=value;
        if(node.kind==='input') next=value;
        if(node.kind==='tool'){const tool=tools.find(t=>t.id===node.refId);if(!tool)throw new Error(`STUDIO_TOOL_NOT_FOUND:${node.refId||''}`);next={...((value&&typeof value==='object')?value as any:{value}),tool:{id:tool.id,name:tool.name,href:tool.href,access:tool.access,risk:tool.risk,sideEffects:tool.sideEffects}};}
        if(node.kind==='ai'){const agent=ai.find(a=>a.id===node.refId);if(!agent)throw new Error(`STUDIO_AI_NOT_FOUND:${node.refId||''}`);next={...((value&&typeof value==='object')?value as any:{value}),ai:{id:agent.id,name:agent.name,provider:agent.provider,model:agent.model},prompt:(node.config as any)?.prompt};}
        if(node.kind==='compute'){const profile=compute.find(c=>c.id===node.refId);if(!profile)throw new Error(`STUDIO_COMPUTE_NOT_FOUND:${node.refId||''}`);if(profile.kind==='yaposan_gpu')await spendGPUCredits(db,space.organizationId,1,{spaceId,studioId,runId:run.id,nodeId:node.id,computeProfileId:profile.id,traceId});next={...((value&&typeof value==='object')?value as any:{value}),compute:{id:profile.id,name:profile.name,kind:profile.kind,billing:profile.billing}};}
        if(node.kind==='output') next=value;return boundedExecutionValue(next);
      })(),node.id);
      const finished=Date.now();nodeStates[index]=nodeState(node.id,'succeeded',{startedAt:new Date(nodeStarted).toISOString(),finishedAt:new Date(finished).toISOString(),durationMs:finished-nodeStarted});steps.push({nodeId:node.id,name:node.name,kind:node.kind,status:'succeeded',durationMs:finished-nodeStarted,output});value=output;
      await db.update('spaceStudioRuns',run.id,{nodeStates:[...nodeStates],steps:[...steps]});
    }
    const finishedAt=new Date().toISOString(),durationMs=Date.parse(finishedAt)-Date.parse(startedAt);const completed=await db.update('spaceStudioRuns',run.id,{status:'succeeded',steps,output:boundedExecutionValue(value),nodeStates,finishedAt,durationMs});
    await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'studio.run.succeeded',target:run.id,metadata:{spaceId,studioId,traceId,durationMs,nodeCount:ordered.length}});return completed;
  }catch(error){
    const message=error instanceof Error?error.message:'STUDIO_RUN_FAILED';const active=nodeStates.findIndex(x=>x.status==='running');if(active>=0){const at=Date.now();nodeStates[active]={...nodeStates[active],status:'failed',finishedAt:new Date(at).toISOString(),durationMs:nodeStates[active].startedAt?at-Date.parse(nodeStates[active].startedAt!):undefined,error:message};}
    const finishedAt=new Date().toISOString(),durationMs=Date.parse(finishedAt)-Date.parse(startedAt);steps.push({status:'failed',error:message});await db.update('spaceStudioRuns',run.id,{status:'failed',steps,nodeStates,error:message,finishedAt,durationMs});await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'studio.run.failed',target:run.id,metadata:{spaceId,studioId,traceId,durationMs,error:message.slice(0,240)}});throw error;
  }
}
export async function listStudioRuns(db:DatabaseAdapter,userId:string,spaceId:string,studioId:string){await requireSpaceAccess(db,userId,spaceId,'viewer');return (await db.find('spaceStudioRuns',r=>r.spaceId===spaceId&&r.studioId===studioId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,50);}
export async function getStudioRun(db:DatabaseAdapter,userId:string,spaceId:string,studioId:string,runId:string){await requireSpaceAccess(db,userId,spaceId,'viewer');const run=await db.get('spaceStudioRuns',runId);if(!run||run.spaceId!==spaceId||run.studioId!==studioId)throw new Error('STUDIO_RUN_NOT_FOUND');return run;}
export async function retryStudioRun(db:DatabaseAdapter,userId:string,spaceId:string,studioId:string,runId:string,approvedNodeIds:string[]=[]){const prior=await getStudioRun(db,userId,spaceId,studioId,runId);return runStudio(db,userId,spaceId,studioId,prior.input,{approvedNodeIds,parentRunId:prior.id,executionKey:`retry:${prior.id}:${randomUUID()}`});}

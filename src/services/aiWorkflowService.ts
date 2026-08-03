import type { AiWritingAction } from "../types/aiWriting";
import { runAiWriting } from "./aiService";

export type AiQueueStatus = "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type AiQueueJob = { id:string; action:AiWritingAction; label:string; input:string; targetLanguage?:string; status:AiQueueStatus; progress:number; result?:string; error?:string; createdAt:number; startedAt?:number; completedAt?:number };
export type AiUsageEntry = { id:string; provider:string; model:string; action:string; inputTokens:number; outputTokens:number; estimatedCost:number; durationMs:number; createdAt:number };
export type AiWorkflowStep = { id:string; action:AiWritingAction; label:string; targetLanguage?:string };
export type AiWorkflow = { id:string; name:string; steps:AiWorkflowStep[]; favorite?:boolean; createdAt:number };
export type AiGenerationPreset = { id:string; name:string; documentType:string; topic:string; style:string; createdAt:number };

export const DEFAULT_WORKFLOWS:AiWorkflow[]=[
 {id:"wf-rewrite-proof",name:"Rewrite → Proofread",createdAt:1,steps:[{id:"s1",action:"rewrite",label:"Rewrite"},{id:"s2",action:"grammar",label:"Proofread"}]},
 {id:"wf-translate-proof",name:"Translate → Proofread",createdAt:2,steps:[{id:"s1",action:"translate",label:"Translate",targetLanguage:"Spanish"},{id:"s2",action:"grammar",label:"Proofread"}]},
 {id:"wf-expand-market",name:"Expand → Marketing",createdAt:3,steps:[{id:"s1",action:"expand",label:"Expand"},{id:"s2",action:"marketing",label:"Marketing copy"}]},
 {id:"wf-summary-social",name:"Summarize → Social",createdAt:4,steps:[{id:"s1",action:"summarize",label:"Summarize"},{id:"s2",action:"social",label:"Social post"}]},
];

export const AI_COMMANDS:{id:string;label:string;action:AiWritingAction;keywords:string[]}[]=[
 {id:"rewrite",label:"Rewrite selection",action:"rewrite",keywords:["improve","rephrase"]},{id:"grammar",label:"Improve grammar",action:"grammar",keywords:["proofread","correct"]},
 {id:"expand",label:"Expand text",action:"expand",keywords:["longer","detail"]},{id:"shorten",label:"Shorten text",action:"shorten",keywords:["concise","trim"]},
 {id:"summarize",label:"Summarize document",action:"summarize",keywords:["summary","brief"]},{id:"translate",label:"Translate to Spanish",action:"translate",keywords:["language","spanish"]},
 {id:"headline",label:"Generate headline",action:"headline",keywords:["title","heading"]},{id:"marketing",label:"Generate marketing copy",action:"marketing",keywords:["campaign","promotion"]},
 {id:"social",label:"Generate social post",action:"social",keywords:["caption","hashtag"]},{id:"cta",label:"Generate call to action",action:"cta",keywords:["button","action"]},
];

export function estimateTokens(text:string){return Math.max(1,Math.ceil(text.trim().length/4));}
export function estimateCost(inputTokens:number,outputTokens:number,inputPerMillion=.4,outputPerMillion=1.6){return Number(((inputTokens/1_000_000)*inputPerMillion+(outputTokens/1_000_000)*outputPerMillion).toFixed(6));}
export function createQueueJob(action:AiWritingAction,input:string,label?:string,targetLanguage?:string):AiQueueJob{return{id:`job-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,action,label:label??action,input,targetLanguage,status:"queued",progress:0,createdAt:Date.now()};}
export async function executeQueueJob(job:AiQueueJob):Promise<{job:AiQueueJob;usage:AiUsageEntry}>{const started=Date.now();try{const result=await runAiWriting({action:job.action,text:job.input,prompt:job.input,targetLanguage:job.targetLanguage});const completed=Date.now();const inputTokens=estimateTokens(job.input),outputTokens=estimateTokens(result);return{job:{...job,status:"completed",progress:100,result,startedAt:started,completedAt:completed},usage:{id:`usage-${completed}-${Math.random().toString(36).slice(2,6)}`,provider:"Yaposan Local",model:"Local Writing Engine",action:job.action,inputTokens,outputTokens,estimatedCost:0,durationMs:completed-started,createdAt:completed}};}catch(error){const completed=Date.now();return{job:{...job,status:"failed",progress:100,error:error instanceof Error?error.message:"AI task failed",startedAt:started,completedAt:completed},usage:{id:`usage-${completed}`,provider:"Yaposan Local",model:"Local Writing Engine",action:job.action,inputTokens:estimateTokens(job.input),outputTokens:0,estimatedCost:0,durationMs:completed-started,createdAt:completed}};}}
export async function runWorkflow(workflow:AiWorkflow,input:string):Promise<{result:string;usage:AiUsageEntry[]}>{let current=input;const usage:AiUsageEntry[]=[];for(const step of workflow.steps){const job=createQueueJob(step.action,current,step.label,step.targetLanguage);const executed=await executeQueueJob(job);if(executed.job.status!=="completed")throw new Error(executed.job.error||"Workflow failed");current=executed.job.result??current;usage.push(executed.usage);}return{result:current,usage};}
export function streamChunks(text:string,size=4){const words=text.split(/\s+/).filter(Boolean),out:string[]=[];for(let i=0;i<words.length;i+=size)out.push(words.slice(i,i+size).join(" "));return out;}
export function usageSummary(entries:AiUsageEntry[]){return entries.reduce((a,e)=>({requests:a.requests+1,inputTokens:a.inputTokens+e.inputTokens,outputTokens:a.outputTokens+e.outputTokens,cost:Number((a.cost+e.estimatedCost).toFixed(6)),durationMs:a.durationMs+e.durationMs}),{requests:0,inputTokens:0,outputTokens:0,cost:0,durationMs:0});}

import { createHash } from "node:crypto";
import type { DatabaseAdapter } from "./database.ts";
import type { PlanId } from "./billingPlatform.ts";
import { estimateProviderCostMicros, reserveCommunityBudget, settleCommunityBudget, type AIAccessMode } from "./aiCostControls.ts";
import { reserveCredits, settleCreditReservation } from "./aiCredits.ts";
import { fetchJsonLimited } from "./aiNetworkSecurity.ts";
import { createAiJobWithConcurrencyGuard, normalizeAiRequest } from "./aiRequestPolicy.ts";

export type AiTask="write"|"translate"|"ocr"|"image"|"background-remove"|"upscale"|"design-suggest";
export type ProviderConfig={name:string;endpoint:string;apiKey:string;models?:Partial<Record<AiTask,string>>};
export type AiGatewayRequest={organizationId:string;userId:string;plan:PlanId;task:AiTask;prompt?:string;inputUrl?:string;language?:string;maxTokens?:number;accessMode?:AIAccessMode};
export type AiGatewayResult={id:string;provider:string;model:string;output:unknown;usage:{credits:number;inputTokens:number;outputTokens:number;costMicros:number;accessMode:AIAccessMode};checksum:string};
const blocked=[/sexual content involving minors/i,/credit card number/i,/malware payload/i];
export function moderateAiInput(value:string){const hit=blocked.find(x=>x.test(value));return{allowed:!hit,reason:hit?"POLICY_BLOCKED":undefined}}
export function estimateCredits(task:AiTask,inputTokens:number,outputTokens=0){const base:{[K in AiTask]:number}={write:1,translate:1,ocr:2,image:20,"background-remove":5,upscale:8,"design-suggest":3};return base[task]+Math.ceil((inputTokens+outputTokens)/1000)}
export function loadAiProviders():ProviderConfig[]{const providers:ProviderConfig[]=[];for(const prefix of ["OPENAI","AI_FALLBACK"]){const endpoint=process.env[`${prefix}_BASE_URL`]??(prefix==="OPENAI"?"https://api.openai.com/v1/chat/completions":"");const apiKey=process.env[`${prefix}_API_KEY`]??"";if(endpoint&&apiKey)providers.push({name:prefix.toLowerCase(),endpoint,apiKey})}return providers}

async function invoke(provider:ProviderConfig,request:AiGatewayRequest,signal?:AbortSignal){
 const model=provider.models?.[request.task]??process.env.AI_DEFAULT_MODEL??"gpt-4.1-mini";const prompt=request.prompt??request.inputUrl??"";const name=provider.name.toLowerCase();
 if(name.includes("gemini")){
  const base=provider.endpoint.replace(/\/$/,"");const endpoint=base.includes(":generateContent")?base:`${base}/${encodeURIComponent(model)}:generateContent`;
  const {response,data}=await fetchJsonLimited(endpoint,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":provider.apiKey},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:request.maxTokens??1024}}),signal},{provider:name});
  if(!response.ok)throw new Error(`AI_PROVIDER_${response.status}`);return{provider:provider.name,model,output:data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text??"").join("")??data,usage:{prompt_tokens:data?.usageMetadata?.promptTokenCount,completion_tokens:data?.usageMetadata?.candidatesTokenCount}};
 }
 if(name.includes("claude")||name.includes("anthropic")){
  const {response,data}=await fetchJsonLimited(provider.endpoint,{method:"POST",headers:{"content-type":"application/json","x-api-key":provider.apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model,max_tokens:request.maxTokens??1024,messages:[{role:"user",content:prompt}]}),signal},{provider:name});
  if(!response.ok)throw new Error(`AI_PROVIDER_${response.status}`);return{provider:provider.name,model:data?.model??model,output:data?.content?.map((p:any)=>p.text??"").join("")??data,usage:{prompt_tokens:data?.usage?.input_tokens,completion_tokens:data?.usage?.output_tokens}};
 }
 const headers:Record<string,string>={"content-type":"application/json"};if(provider.apiKey)headers.authorization=`Bearer ${provider.apiKey}`;
 const {response,data}=await fetchJsonLimited(provider.endpoint,{method:"POST",headers,body:JSON.stringify({model,messages:[{role:"user",content:prompt}],max_tokens:request.maxTokens??1024}),signal},{provider:name});
 if(!response.ok)throw new Error(`AI_PROVIDER_${response.status}`);return{provider:provider.name,model:data?.model??model,output:data?.choices?.[0]?.message?.content??data?.output??data,usage:data?.usage??{}};
}

export function isRetryableAiProviderError(error:unknown){
 const message=error instanceof Error?error.message:String(error);
 if(/AI_PROVIDER_(429|5\d\d)/.test(message))return true;
 return /AI_PROVIDER_TIMEOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|fetch failed/i.test(message);
}
function sleep(ms:number){return new Promise(resolve=>setTimeout(resolve,ms))}
async function invokeWithRetry(provider:ProviderConfig,request:AiGatewayRequest){
 const maxRetries=Math.max(0,Math.min(4,Number(process.env.AI_PROVIDER_MAX_RETRIES??2)));const base=Math.max(50,Math.min(5000,Number(process.env.AI_PROVIDER_RETRY_BASE_MS??250)));let last:unknown;
 for(let attempt=0;attempt<=maxRetries;attempt++){try{return await invoke(provider,request)}catch(error){last=error;if(!isRetryableAiProviderError(error)||attempt>=maxRetries)throw error;await sleep(base*(2**attempt))}}
 throw last;
}

export async function runAiGateway(db:DatabaseAdapter,request:AiGatewayRequest,providers=loadAiProviders()):Promise<AiGatewayResult>{
 request=normalizeAiRequest(request);
 const text=request.prompt??request.inputUrl??"";const moderation=moderateAiInput(text);if(!moderation.allowed)throw new Error(moderation.reason);if(!providers.length)throw new Error("AI_PROVIDER_UNAVAILABLE");
 const inputTokens=Math.max(1,Math.ceil(text.length/4));const maxOutputTokens=request.maxTokens??1024;const accessMode:AIAccessMode=request.accessMode==="credits"?"credits":request.accessMode==="provider"?"provider":"community";
 const job=await createAiJobWithConcurrencyGuard(db,request,accessMode);const reservationId=`ai:${job.id}`;
 const estimatedCredits=estimateCredits(request.task,inputTokens,maxOutputTokens);
 const estimatedCostMicros=Math.max(...providers.map(p=>estimateProviderCostMicros(inputTokens,maxOutputTokens,p.name,p.models?.[request.task]??process.env.AI_DEFAULT_MODEL??"gpt-4.1-mini")));
 try{
  if(accessMode==="credits")await reserveCredits(db,request.organizationId,estimatedCredits,reservationId,{task:request.task,jobId:job.id,userId:request.userId});
  else if(accessMode==="community")await reserveCommunityBudget(db,{requestId:reservationId,organizationId:request.organizationId,userId:request.userId,estimatedMicros:estimatedCostMicros,metadata:{task:request.task,jobId:job.id}});
 }catch(error){await db.update("jobs",job.id,{status:"failed",progress:100,error:error instanceof Error?error.message:String(error)});throw error}
 let last:unknown;
 for(let i=0;i<providers.length;i++){
  try{
   const raw=await invokeWithRetry(providers[i],request);const outputText=typeof raw.output==="string"?raw.output:JSON.stringify(raw.output);const outputTokens=Number(raw.usage.completion_tokens??raw.usage.output_tokens??Math.ceil(outputText.length/4));const actualInput=Number(raw.usage.prompt_tokens??raw.usage.input_tokens??inputTokens);const actualCredits=estimateCredits(request.task,actualInput,outputTokens);const actualCostMicros=estimateProviderCostMicros(actualInput,outputTokens,raw.provider,raw.model);
   if(accessMode==="credits")await settleCreditReservation(db,request.organizationId,reservationId,actualCredits);else if(accessMode==="community")await settleCommunityBudget(db,reservationId,actualCostMicros);
   const result:AiGatewayResult={id:job.id,provider:raw.provider,model:raw.model,output:raw.output,usage:{credits:actualCredits,inputTokens:actualInput,outputTokens,costMicros:actualCostMicros,accessMode},checksum:createHash("sha256").update(outputText).digest("hex")};await db.update("jobs",job.id,{status:"succeeded",progress:100,attempts:i+1,result});return result;
  }catch(error){last=error;await db.update("jobs",job.id,{attempts:i+1,error:error instanceof Error?error.message:String(error)})}
 }
 if(accessMode==="credits")await settleCreditReservation(db,request.organizationId,reservationId,0);else if(accessMode==="community")await settleCommunityBudget(db,reservationId,0);
 await db.update("jobs",job.id,{status:"failed",progress:100,error:last instanceof Error?last.message:String(last)});throw last??new Error("AI_PROVIDER_UNAVAILABLE");
}

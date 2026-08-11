import type { DatabaseAdapter } from "./database.ts";
import type { AiGatewayRequest } from "./aiPlatform.ts";

const n=(name:string,fallback:number)=>{const value=Number(process.env[name]??fallback);return Number.isFinite(value)?Math.max(1,Math.floor(value)):fallback};
export function normalizeAiRequest(request:AiGatewayRequest):AiGatewayRequest{
  const prompt=request.prompt??request.inputUrl??"";const bytes=Buffer.byteLength(prompt,"utf8");const maxBytes=n("AI_MAX_PROMPT_BYTES",65536);if(bytes>maxBytes)throw new Error("AI_INPUT_TOO_LARGE");
  const maxAllowed=n("AI_MAX_OUTPUT_TOKENS",8192);const requested=request.maxTokens??1024;if(!Number.isFinite(requested)||requested<1)throw new Error("AI_MAX_TOKENS_INVALID");
  return {...request,maxTokens:Math.min(maxAllowed,Math.floor(requested))};
}
export async function createAiJobWithConcurrencyGuard(db:DatabaseAdapter,request:AiGatewayRequest,accessMode:string){
  return db.transaction(async tx=>{
    await tx.lock?.(`ai-concurrency:org:${request.organizationId}`);await tx.lock?.(`ai-concurrency:user:${request.userId}`);
    const running=await tx.find("jobs",j=>j.kind==="ai"&&j.status==="running");
    const userLimit=n("AI_MAX_CONCURRENT_REQUESTS_PER_USER",3),orgLimit=n("AI_MAX_CONCURRENT_REQUESTS_PER_ORG",10);
    const userCount=running.filter(j=>(j.payload as any)?.userId===request.userId).length;const orgCount=running.filter(j=>(j.payload as any)?.organizationId===request.organizationId).length;
    if(userCount>=userLimit)throw new Error("AI_USER_CONCURRENCY_LIMIT");if(orgCount>=orgLimit)throw new Error("AI_ORG_CONCURRENCY_LIMIT");
    return tx.insert("jobs",{kind:"ai",status:"running",progress:10,attempts:0,payload:{...request,accessMode,month:new Date().toISOString().slice(0,7)}});
  });
}

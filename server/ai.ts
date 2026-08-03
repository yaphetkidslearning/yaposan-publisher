import { createHash, randomUUID } from "node:crypto";
export type AiRequest={model?:string;prompt:string;system?:string;maxTokens?:number;temperature?:number;userId?:string};
export type AiResponse={id:string;text:string;model:string;usage:{inputTokens:number;outputTokens:number};providerRequestId?:string};
const estimate=(text:string)=>Math.max(1,Math.ceil(text.length/4));
export async function runAiProxy(request:AiRequest,signal?:AbortSignal):Promise<AiResponse>{
 const endpoint=process.env.AI_PROVIDER_URL;const apiKey=process.env.AI_PROVIDER_API_KEY;
 if(!endpoint||!apiKey) throw new Error("AI_PROVIDER_NOT_CONFIGURED");
 const body={model:request.model??process.env.AI_DEFAULT_MODEL??"default",messages:[...(request.system?[{role:"system",content:request.system}]:[]),{role:"user",content:request.prompt}],max_tokens:request.maxTokens??1024,temperature:request.temperature??0.7};
 const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${apiKey}`,"x-request-id":randomUUID()},body:JSON.stringify(body),signal});
 if(!response.ok)throw new Error(`AI_PROVIDER_${response.status}`);const data=await response.json() as any;const text=data.choices?.[0]?.message?.content??data.output_text??data.text;if(typeof text!=="string")throw new Error("AI_PROVIDER_INVALID_RESPONSE");
 return{id:data.id??createHash("sha256").update(text).digest("hex").slice(0,24),text,model:data.model??body.model,usage:{inputTokens:data.usage?.prompt_tokens??estimate(request.prompt),outputTokens:data.usage?.completion_tokens??estimate(text)},providerRequestId:response.headers.get("x-request-id")??undefined};
}

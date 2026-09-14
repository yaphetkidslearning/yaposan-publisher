import { createHash, randomUUID } from "node:crypto";
import JSZip from "jszip";
import type { DatabaseAdapter, JobRecord } from "./database";
import type { ObjectStorage } from "./storage";
import { loadBackgroundRemovalConfig, runSelfHostedBackgroundRemoval } from "./backgroundRemoval";

export type ProductPhotoBatchItemStatus = "awaiting-upload"|"queued"|"processing"|"pass"|"review"|"failed";
export type ProductPhotoBatchItem = {
  id:string; originalName:string; safeName:string; mimeType:string; size:number; checksum?:string;
  inputStorageKey?:string; outputStorageKey?:string; status:ProductPhotoBatchItemStatus;
  qualityScore?:number; whiteCompliance?:number; error?:string; attempts:number; processingMs?:number;
};
export type ProductPhotoBatchPayload = {
  type:"product-photo-batch-v91.8"; userId:string; organizationId?:string; idempotencyKey:string;
  phase:"uploading"|"ready"|"processing"|"completed"|"expired";
  strictWhite:boolean; outputFormat:"png"|"webp"|"jpeg"; createdBy:string;
  items:ProductPhotoBatchItem[]; totalBytes:number; zipStorageKey?:string; retentionExpiresAt:string;
  lastProgressAt:string;
};

const MAX_IMAGES=Math.max(1,Math.min(500,Number(process.env.PRODUCT_PHOTO_BATCH_MAX_IMAGES??500)));
const MAX_TOTAL_BYTES=Math.max(1_000_000,Math.min(20_000_000_000,Number(process.env.PRODUCT_PHOTO_BATCH_MAX_TOTAL_BYTES??5_000_000_000)));
const MAX_ACTIVE_PER_USER=Math.max(1,Math.min(20,Number(process.env.PRODUCT_PHOTO_MAX_ACTIVE_BATCHES_PER_USER??3)));
const MAX_ACTIVE_PER_ORG=Math.max(1,Math.min(100,Number(process.env.PRODUCT_PHOTO_MAX_ACTIVE_BATCHES_PER_ORG??20)));
const ITEM_CONCURRENCY=Math.max(1,Math.min(12,Number(process.env.PRODUCT_PHOTO_BATCH_ITEM_CONCURRENCY??4)));
const RETENTION_HOURS=Math.max(1,Math.min(720,Number(process.env.PRODUCT_PHOTO_BATCH_RETENTION_HOURS??72)));
const ALLOWED_MIME=new Set(["image/png","image/jpeg","image/webp"]);

const payloadOf=(job:JobRecord):ProductPhotoBatchPayload|undefined=>{
  const p=job.payload as Partial<ProductPhotoBatchPayload>|undefined;
  return p?.type==="product-photo-batch-v91.8" ? p as ProductPhotoBatchPayload : undefined;
};
const clean=(s:string)=>s.replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,140)||"product";
const extFor=(mime:string)=>mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
const sha256=(b:Uint8Array)=>createHash("sha256").update(b).digest("hex");

function uniqueNames(items:{name:string;mimeType:string}[]){
  const used=new Map<string,number>();
  return items.map(x=>{const raw=clean(x.name||`product.${extFor(x.mimeType)}`);const dot=raw.lastIndexOf(".");const base=dot>0?raw.slice(0,dot):raw;const ext=dot>0?raw.slice(dot):`.${extFor(x.mimeType)}`;const key=raw.toLowerCase();const n=(used.get(key)??0)+1;used.set(key,n);return n===1?raw:`${base}-${n}${ext}`;});
}

export async function createProductPhotoBatch(db:DatabaseAdapter,input:{userId:string;organizationId?:string;idempotencyKey?:string;strictWhite?:boolean;outputFormat?:"png"|"webp"|"jpeg";items:{name:string;mimeType:string;size:number;checksum?:string}[]}){
  if(!Array.isArray(input.items)||input.items.length<1||input.items.length>MAX_IMAGES)throw new Error("PRODUCT_PHOTO_BATCH_SIZE_INVALID");
  const totalBytes=input.items.reduce((n,x)=>n+Number(x.size||0),0);if(totalBytes>MAX_TOTAL_BYTES)throw new Error("PRODUCT_PHOTO_BATCH_BYTES_EXCEEDED");
  for(const x of input.items){if(!ALLOWED_MIME.has(x.mimeType))throw new Error("UNSUPPORTED_IMAGE_TYPE");if(!Number.isFinite(x.size)||x.size<=0||x.size>50_000_000)throw new Error("IMAGE_SIZE_INVALID");}
  const idempotencyKey=(input.idempotencyKey||randomUUID()).slice(0,160);
  const duplicate=(await db.find("jobs",j=>{const p=payloadOf(j);return !!p&&p.userId===input.userId&&p.idempotencyKey===idempotencyKey;}))[0];if(duplicate)return duplicate;
  const active=await db.find("jobs",j=>{const p=payloadOf(j);return !!p&&!['succeeded','failed','cancelled'].includes(j.status)&&p.phase!=="expired";});
  if(active.filter(j=>payloadOf(j)?.userId===input.userId).length>=MAX_ACTIVE_PER_USER)throw new Error("USER_BATCH_CONCURRENCY_LIMIT");
  if(input.organizationId&&active.filter(j=>payloadOf(j)?.organizationId===input.organizationId).length>=MAX_ACTIVE_PER_ORG)throw new Error("ORGANIZATION_BATCH_CONCURRENCY_LIMIT");
  const names=uniqueNames(input.items);
  const now=new Date();
  const payload:ProductPhotoBatchPayload={type:"product-photo-batch-v91.8",userId:input.userId,organizationId:input.organizationId,idempotencyKey,phase:"uploading",strictWhite:input.strictWhite!==false,outputFormat:input.strictWhite!==false&&input.outputFormat==="jpeg"?"png":input.outputFormat??"png",createdBy:input.userId,totalBytes,retentionExpiresAt:new Date(now.getTime()+RETENTION_HOURS*3600_000).toISOString(),lastProgressAt:now.toISOString(),items:input.items.map((x,i)=>({id:randomUUID(),originalName:x.name,safeName:names[i],mimeType:x.mimeType,size:x.size,checksum:x.checksum,status:"awaiting-upload",attempts:0}))};
  return db.insert("jobs",{kind:"image",status:"queued",progress:0,attempts:0,payload});
}

export async function uploadProductPhotoBatchItem(db:DatabaseAdapter,storage:ObjectStorage,input:{jobId:string;itemId:string;userId:string;bytes:Uint8Array;mimeType:string}){
  const job=await db.get("jobs",input.jobId);const p=job&&payloadOf(job);if(!job||!p||p.userId!==input.userId)throw new Error("BATCH_NOT_FOUND");
  const i=p.items.findIndex(x=>x.id===input.itemId);if(i<0)throw new Error("BATCH_ITEM_NOT_FOUND");const item=p.items[i];if(input.mimeType!==item.mimeType)throw new Error("MIME_TYPE_MISMATCH");if(input.bytes.byteLength!==item.size)throw new Error("IMAGE_SIZE_MISMATCH");
  const digest=sha256(input.bytes);if(item.checksum&&item.checksum!==digest)throw new Error("CHECKSUM_MISMATCH");
  if(item.inputStorageKey&&item.checksum===digest)return job;
  const stored=await storage.put({workspaceId:`product-photo/${p.organizationId??p.userId}/${job.id}/input`,name:item.safeName,contentType:item.mimeType,body:input.bytes});
  p.items[i]={...item,inputStorageKey:stored.key,checksum:digest,status:"queued"};p.lastProgressAt=new Date().toISOString();
  const uploaded=p.items.filter(x=>!!x.inputStorageKey).length;const progress=Math.floor((uploaded/p.items.length)*10);
  return db.update("jobs",job.id,{payload:p,progress});
}

export async function startProductPhotoBatch(db:DatabaseAdapter,jobId:string,userId:string){
  const job=await db.get("jobs",jobId);const p=job&&payloadOf(job);if(!job||!p||p.userId!==userId)throw new Error("BATCH_NOT_FOUND");if(p.items.some(x=>!x.inputStorageKey))throw new Error("BATCH_UPLOAD_INCOMPLETE");
  p.phase="ready";p.items=p.items.map(x=>({...x,status:x.status==="awaiting-upload"?"queued":x.status}));p.lastProgressAt=new Date().toISOString();return db.update("jobs",job.id,{status:"queued",progress:10,payload:p,error:undefined});
}

export async function listProductPhotoBatches(db:DatabaseAdapter,userId:string,organizationId?:string){return (await db.find("jobs",j=>{const p=payloadOf(j);return Boolean(p&&(p.userId===userId||(organizationId&&p.organizationId===organizationId)));})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,50).map(publicBatch);}
export async function getProductPhotoBatch(db:DatabaseAdapter,jobId:string,userId:string,organizationId?:string){const j=await db.get("jobs",jobId);const p=j&&payloadOf(j);if(!j||!p||(p.userId!==userId&&p.organizationId!==organizationId))throw new Error("BATCH_NOT_FOUND");return publicBatch(j);}
function publicBatch(j:JobRecord){const p=payloadOf(j)!;const done=p.items.filter(x=>['pass','review','failed'].includes(x.status)).length;const elapsed=Math.max(1,(Date.now()-Date.parse(j.createdAt))/1000);return {id:j.id,status:j.status,stage:p.phase,progress:j.progress,total:p.items.length,completed:done,pass:p.items.filter(x=>x.status==='pass').length,review:p.items.filter(x=>x.status==='review').length,failed:p.items.filter(x=>x.status==='failed').length,queueDepth:p.items.filter(x=>x.status==='queued').length,estimatedRemainingSeconds:done?Math.ceil((elapsed/done)*(p.items.length-done)):null,retentionExpiresAt:p.retentionExpiresAt,zipReady:!!p.zipStorageKey,strictWhite:p.strictWhite,outputFormat:p.outputFormat,items:p.items.map(({inputStorageKey,outputStorageKey,...x})=>x)};}

export async function retryProductPhotoBatch(db:DatabaseAdapter,jobId:string,userId:string){const j=await db.get("jobs",jobId);const p=j&&payloadOf(j);if(!j||!p||p.userId!==userId)throw new Error("BATCH_NOT_FOUND");p.items=p.items.map(x=>x.status==='failed'||x.status==='review'?{...x,status:'queued' as const,error:undefined}:x);p.phase='ready';p.zipStorageKey=undefined;p.lastProgressAt=new Date().toISOString();return db.update("jobs",j.id,{status:'queued',payload:p,error:undefined,progress:Math.floor(p.items.filter(x=>x.status==='pass').length/p.items.length*100)});}

export async function claimNextProductPhotoBatch(db:DatabaseAdapter,workerId:string,leaseSeconds=120){return db.transaction(async tx=>{const jobs=(await tx.find("jobs",j=>{const p=payloadOf(j);return j.kind==='image'&&j.status==='queued'&&p?.phase==='ready';})).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));const j=jobs[0];if(!j)return undefined;const p=payloadOf(j)!;p.phase='processing';return tx.update("jobs",j.id,{status:'running',attempts:j.attempts+1,workerId,heartbeatAt:new Date().toISOString(),leaseExpiresAt:new Date(Date.now()+leaseSeconds*1000).toISOString(),payload:p});});}

async function processOne(job:JobRecord,p:ProductPhotoBatchPayload,item:ProductPhotoBatchItem,storage:ObjectStorage){
  if(!item.inputStorageKey)throw new Error("INPUT_NOT_UPLOADED");
  const bytes=await storage.get(item.inputStorageKey);const result=await runSelfHostedBackgroundRemoval({imageBase64:Buffer.from(bytes).toString('base64'),mimeType:item.mimeType,background:'white',qualityMode:'auto',preset:p.strictWhite?'pure-white-catalog':'marketplace-product',paddingPercent:10,squareCanvas:true,preserveShadow:false,categoryHint:'auto',outputFormat:p.outputFormat,strictWhite:p.strictWhite,whiteAuditThreshold:1},loadBackgroundRemovalConfig());
  const outBytes=Buffer.from(result.imageBase64,'base64');const ext=p.outputFormat==='jpeg'?'jpg':p.outputFormat;const output=await storage.put({workspaceId:`product-photo/${p.organizationId??p.userId}/${job.id}/output`,name:item.safeName.replace(/\.[^.]+$/,`-white.${ext}`),contentType:result.mimeType,body:outBytes});
  const compliance=Number(result.postExportWhiteAudit?.compliance??result.whiteBackgroundAudit?.compliance??0);const certified=!p.strictWhite||((p.outputFormat==='png'||p.outputFormat==='webp')&&result.postExportWhiteAudit?.certified===true&&compliance===1);
  const status:ProductPhotoBatchItemStatus=result.qualityStatus==='pass'&&certified?'pass':'review';
  return {...item,status,outputStorageKey:output.key,qualityScore:result.qualityScore,whiteCompliance:compliance,attempts:item.attempts+1,processingMs:result.processingMs,error:certified?undefined:'PURE_WHITE_POST_EXPORT_CERTIFICATION_FAILED'};
}

export async function processProductPhotoBatch(db:DatabaseAdapter,storage:ObjectStorage,job:JobRecord){
  let current=await db.get('jobs',job.id);let p=current&&payloadOf(current);if(!current||!p)throw new Error('BATCH_NOT_FOUND');
  const queue=p.items.filter(x=>x.status==='queued');
  for(let start=0;start<queue.length;start+=ITEM_CONCURRENCY){
    const group=queue.slice(start,start+ITEM_CONCURRENCY);p.items=p.items.map(x=>group.some(g=>g.id===x.id)?{...x,status:'processing'}:x);await db.update('jobs',job.id,{payload:p,heartbeatAt:new Date().toISOString(),leaseExpiresAt:new Date(Date.now()+120_000).toISOString()});
    const results=await Promise.all(group.map(async item=>{try{return await processOne(job,p!,item,storage)}catch(e){return {...item,status:'failed' as const,attempts:item.attempts+1,error:e instanceof Error?e.message:String(e)}}}));
    const byId=new Map(results.map(x=>[x.id,x]));p.items=p.items.map(x=>byId.get(x.id)??x);p.lastProgressAt=new Date().toISOString();const done=p.items.filter(x=>['pass','review','failed'].includes(x.status)).length;await db.update('jobs',job.id,{payload:p,progress:10+Math.floor(done/p.items.length*85),heartbeatAt:new Date().toISOString(),leaseExpiresAt:new Date(Date.now()+120_000).toISOString()});
  }
  const zip=new JSZip();for(const item of p.items.filter(x=>x.outputStorageKey)){const bytes=await storage.get(item.outputStorageKey!);zip.file(item.safeName.replace(/\.[^.]+$/,`-white.${p.outputFormat==='jpeg'?'jpg':p.outputFormat}`),bytes);}
  zip.file('YAPOSAN-BATCH-MANIFEST.json',JSON.stringify({formatVersion:'1.0',jobId:job.id,strictWhite:p.strictWhite,items:p.items.map(x=>({name:x.safeName,status:x.status,whiteCompliance:x.whiteCompliance,error:x.error}))},null,2));
  const zipBytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});const storedZip=await storage.put({workspaceId:`product-photo/${p.organizationId??p.userId}/${job.id}`,name:`yaposan-batch-${job.id}.zip`,contentType:'application/zip',body:zipBytes});p.zipStorageKey=storedZip.key;p.phase='completed';p.lastProgressAt=new Date().toISOString();
  const failed=p.items.filter(x=>x.status==='failed').length;const finalStatus=failed===p.items.length?'failed':'succeeded';await db.insert('auditEvents',{organizationId:p.organizationId,actorUserId:p.userId,action:'product_photo_batch.completed',target:job.id,metadata:{total:p.items.length,pass:p.items.filter(x=>x.status==='pass').length,review:p.items.filter(x=>x.status==='review').length,failed,strictWhite:p.strictWhite,paidApiSpendUsd:0}});
  return db.update('jobs',job.id,{status:finalStatus,progress:100,payload:p,leaseExpiresAt:undefined,heartbeatAt:new Date().toISOString(),error:failed?`${failed} item(s) failed`:undefined});
}

export async function recoverStaleProductPhotoBatches(db:DatabaseAdapter,now=new Date()){let n=0;for(const j of await db.find('jobs',j=>{const p=payloadOf(j);return !!p&&j.status==='running'&&!!j.leaseExpiresAt&&Date.parse(j.leaseExpiresAt)<=now.getTime();})){const p=payloadOf(j)!;p.phase='ready';p.items=p.items.map(x=>x.status==='processing'?{...x,status:'queued' as const,error:'Recovered after worker interruption'}:x);await db.update('jobs',j.id,{status:'queued',payload:p,workerId:undefined,leaseExpiresAt:undefined,heartbeatAt:undefined,error:'Recovered after worker lease expired'});n++;}return n;}

export async function getProductPhotoBatchZip(db:DatabaseAdapter,storage:ObjectStorage,jobId:string,userId:string,organizationId?:string){const j=await db.get('jobs',jobId);const p=j&&payloadOf(j);if(!j||!p||(p.userId!==userId&&p.organizationId!==organizationId)||!p.zipStorageKey)throw new Error('BATCH_ZIP_NOT_READY');return storage.get(p.zipStorageKey);}

export async function cleanupExpiredProductPhotoBatches(db:DatabaseAdapter,storage:ObjectStorage,now=new Date()){let removed=0;for(const j of await db.find('jobs',j=>{const p=payloadOf(j);return !!p&&p.phase!=='expired'&&Date.parse(p.retentionExpiresAt)<=now.getTime();})){const p=payloadOf(j)!;for(const key of p.items.flatMap(x=>[x.inputStorageKey,x.outputStorageKey]).filter(Boolean) as string[])await storage.delete(key).catch(()=>{});if(p.zipStorageKey)await storage.delete(p.zipStorageKey).catch(()=>{});p.phase='expired';p.items=p.items.map(x=>({...x,inputStorageKey:undefined,outputStorageKey:undefined}));p.zipStorageKey=undefined;await db.update('jobs',j.id,{payload:p});removed++;}return removed;}

export async function productPhotoBatchMetrics(db:DatabaseAdapter){const jobs=(await db.find('jobs',j=>!!payloadOf(j))).map(j=>({j,p:payloadOf(j)!}));const ms=jobs.flatMap(x=>x.p.items.map(i=>i.processingMs).filter((v):v is number=>typeof v==='number')).sort((a,b)=>a-b);const q=(p:number)=>ms.length?ms[Math.min(ms.length-1,Math.floor((ms.length-1)*p))]:0;const items=jobs.flatMap(x=>x.p.items);return {phase:'91.8',batches:jobs.length,queueDepth:items.filter(x=>x.status==='queued').length,processing:items.filter(x=>x.status==='processing').length,pass:items.filter(x=>x.status==='pass').length,review:items.filter(x=>x.status==='review').length,failed:items.filter(x=>x.status==='failed').length,p50ProcessingMs:q(.5),p95ProcessingMs:q(.95),itemConcurrency:ITEM_CONCURRENCY,maxImagesPerBatch:MAX_IMAGES,paidApiSpendUsd:0};}

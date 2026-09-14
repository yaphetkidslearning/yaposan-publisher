import type { AdminPrincipalRecord, DatabaseAdapter } from './database';

const CARD_KEYS=/(card.?number|cardnumber|\bpan\b|cvc|cvv|security.?code|expir|exp.?month|exp.?year|account.?number|routing.?number)/i;
function walk(value:unknown,path='root'):string|undefined{
  if(!value||typeof value!=='object')return undefined;
  if(Array.isArray(value)){for(let i=0;i<value.length;i++){const hit=walk(value[i],`${path}[${i}]`);if(hit)return hit;}return undefined;}
  for(const [key,val] of Object.entries(value as Record<string,unknown>)){
    if(CARD_KEYS.test(key))return `${path}.${key}`;
    const hit=walk(val,`${path}.${key}`);if(hit)return hit;
  }
  return undefined;
}
export async function rejectRawPaymentData(db:DatabaseAdapter,userId:string|undefined,body:unknown){
  const field=walk(body);if(!field)return;
  await db.insert('paymentSecurityEvents',{userId,kind:'raw_card_rejected',severity:'high',provider:'stripe',metadata:{field}});
  throw new Error('RAW_PAYMENT_DATA_NOT_ACCEPTED');
}
export async function claimStripeWebhook(db:DatabaseAdapter,event:{id?:unknown;type?:unknown}){
  const id=String(event.id??'').trim();const type=String(event.type??'').trim();if(!id||!type)throw new Error('INVALID_STRIPE_EVENT');
  const existing=(await db.find('paymentWebhookEvents',x=>x.provider==='stripe'&&x.providerEventId===id))[0];
  if(existing){if(existing.status==='failed'){const row=await db.update('paymentWebhookEvents',existing.id,{status:'processing',error:undefined,processedAt:undefined});return {duplicate:false,row:row??existing};}await db.insert('paymentSecurityEvents',{kind:'webhook_duplicate',severity:'info',provider:'stripe',resourceType:'stripe_event',resourceId:id,metadata:{type,status:existing.status}});return {duplicate:true,row:existing};}
  try{const row=await db.insert('paymentWebhookEvents',{provider:'stripe',providerEventId:id,eventType:type,status:'processing'});return {duplicate:false,row};}catch{const raced=(await db.find('paymentWebhookEvents',x=>x.provider==='stripe'&&x.providerEventId===id))[0];if(raced)return {duplicate:true,row:raced};throw new Error('PAYMENT_WEBHOOK_CLAIM_FAILED')}
}
export async function finishStripeWebhook(db:DatabaseAdapter,id:string,ok:boolean,error?:unknown){
  const row=(await db.find('paymentWebhookEvents',x=>x.provider==='stripe'&&x.providerEventId===id))[0];if(!row)return;
  await db.update('paymentWebhookEvents',row.id,{status:ok?'processed':'failed',processedAt:new Date().toISOString(),error:ok?undefined:String(error instanceof Error?error.message:error??'unknown').slice(0,500)});
  if(!ok)await db.insert('paymentSecurityEvents',{kind:'webhook_failed',severity:'high',provider:'stripe',resourceType:'stripe_event',resourceId:id,metadata:{error:String(error instanceof Error?error.message:error??'unknown').slice(0,500)}});
}
export async function adminSpacePreview(db:DatabaseAdapter,principal:AdminPrincipalRecord,spaceId:string,requestId?:string){
  const space=await db.get('spaces',spaceId);if(!space)throw new Error('SPACE_NOT_FOUND');
  const owner=await db.get('users',space.ownerUserId);const privacy=(await db.find('spacePrivacySettings',x=>x.spaceId===space.id))[0];
  const [studios,ai,posts,followers,projects,products,ads,reports]=await Promise.all([
    db.find('spaceStudios',x=>x.spaceId===space.id&&x.status==='published'),db.find('spaceAIAgents',x=>x.spaceId===space.id&&x.enabled),db.find('spacePosts',x=>x.spaceId===space.id),db.find('spaceFollows',x=>x.spaceId===space.id),db.find('projects',x=>x.spaceId===space.id&&!x.deletedAt),db.find('spaceStoreProducts',x=>x.spaceId===space.id&&x.status==='active'),db.find('creatorAdSettings',x=>x.spaceId===space.id),db.find('socialReports',x=>x.spaceId===space.id&&['open','reviewing'].includes(x.status))
  ]);
  await db.insert('adminAuditEvents',{principalId:principal.id,action:'admin.space.preview',target:space.id,requestId,metadata:{ownerUserId:space.ownerUserId,visibility:space.visibility}});
  return {mode:'read_only_support_preview',space:{id:space.id,name:space.name,slug:space.slug,kind:space.kind,visibility:space.visibility,status:space.status,ownerEmail:owner?.email},privacy:privacy??null,followersCount:followers.length,studios:studios.map(x=>({id:x.id,name:x.name,description:x.description,status:x.status,visibility:x.visibility})),ai:ai.map(x=>({id:x.id,name:x.name,provider:x.provider,model:x.model,visibility:x.visibility})),posts:posts.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,30).map(x=>({id:x.id,body:x.body,visibility:x.visibility,createdAt:x.createdAt})),creations:projects.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,24).map(x=>({id:x.id,name:x.name,updatedAt:x.updatedAt})),store:products.map(x=>({id:x.id,name:x.name,description:x.description,kind:x.kind,priceCents:x.priceCents,currency:x.currency,visibility:x.visibility})),ads:{enabled:Boolean(ads[0]?.enabled),cpcCents:ads[0]?.cpcCents??0},diagnostics:{publicPageEnabled:Boolean(privacy?.publicPageEnabled),discoverable:Boolean(privacy?.discoverable),openReports:reports.length,apiReadOnly:true,noCustomerImpersonation:true}};
}

export async function adminPageTemplatePreview(db:DatabaseAdapter,principal:AdminPrincipalRecord,requestId?:string){
  await db.insert('adminAuditEvents',{principalId:principal.id,action:'admin.page.template_preview',target:'ai-page-shell',requestId,metadata:{readOnly:true,noCustomerAccount:true}});
  return {mode:'read_only_platform_template_preview',space:{id:'platform-preview',name:'Yaposan AI Page Preview',slug:'platform-preview',kind:'personal',visibility:'private',status:'preview',ownerEmail:'Platform Owner Preview'},privacy:null,followersCount:128,studios:[{id:'preview-studio',name:'Product Studio',description:'Example Studio card shown only in the admin preview.',status:'published',visibility:'public'}],ai:[{id:'preview-ai',name:'Yaposan Assistant',provider:'Yaposan AI',model:'preview',visibility:'public'}],posts:[{id:'preview-post',body:'This is a read-only Platform Owner preview. No customer account is required to inspect the AI Page layout.',visibility:'public',createdAt:new Date().toISOString()}],creations:[{id:'preview-project',name:'Example creation',updatedAt:new Date().toISOString()}],store:[{id:'preview-product',name:'Example creator product',description:'Preview store item',kind:'digital',priceCents:999,currency:'USD',visibility:'public'}],ads:{enabled:true,cpcCents:50},diagnostics:{publicPageEnabled:true,discoverable:true,openReports:0,apiReadOnly:true,noCustomerImpersonation:true,platformTemplate:true}};
}

export async function adminPaymentHealth(db:DatabaseAdapter){
  const [webhooks,security,orders,tips,paid,ads,memberships]=await Promise.all([db.find('paymentWebhookEvents',()=>true),db.find('paymentSecurityEvents',()=>true),db.find('spaceStoreOrders',()=>true),db.find('creatorTips',()=>true),db.find('paidContentAccess',()=>true),db.find('creatorAdCampaigns',()=>true),db.find('creatorMembershipSubscriptions',()=>true)]);
  const pending=[...orders.filter(x=>x.status==='pending'),...tips.filter(x=>x.status==='pending'),...paid.filter(x=>x.status==='pending'),...ads.filter(x=>x.status==='pending_funding'),...memberships.filter(x=>x.status==='pending')];
  return {provider:'stripe',cardHandling:{hostedCheckoutOnly:true,rawCardDataAccepted:false,cardNumbersStoredByYaposan:false,cvcStoredByYaposan:false,providerTokensOnly:true},webhooks:{total:webhooks.length,processed:webhooks.filter(x=>x.status==='processed').length,failed:webhooks.filter(x=>x.status==='failed').length,processing:webhooks.filter(x=>x.status==='processing').length},payments:{pending:pending.length},security:{events:security.length,rawCardRejected:security.filter(x=>x.kind==='raw_card_rejected').length,duplicateWebhooks:security.filter(x=>x.kind==='webhook_duplicate').length,webhookFailures:security.filter(x=>x.kind==='webhook_failed').length},controls:{signedWebhooks:true,idempotentWebhookProcessing:true,allowlistedReturnUrls:true,serverOwnedCustomerIds:true,serverOwnedPrices:true,creatorFundsLedgered:true,operatingCostsHiddenFromCreators:true}};
}
export function phase115SafetyMatrix(){return {accountSecurity:['recovery','MFA/passkey foundation','device/session management'],socialSafety:['block','mute/restrict foundation','reports','admin moderation','AI moderation suggestions'],payments:['hosted Stripe checkout','no raw card storage','signed webhooks','idempotency','auditable creator ledger'],platform:['rate limiting','malware scanning foundation','audit logs','health/readiness','backup/export foundations'],remainingScaleWork:['external CDN tuning','production load test at target traffic','disaster-recovery drill','third-party penetration test']};}

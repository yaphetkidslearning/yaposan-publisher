import type { AdminPrincipalRecord, DatabaseAdapter, UserSafetyProfileRecord } from "./database";

const clean=(v:unknown,n=500)=>String(v??"").trim().slice(0,n);
const now=()=>new Date().toISOString();

export async function notificationCenter(db:DatabaseAdapter,userId:string,limit=50){
  const rows=(await db.find("socialNotifications",x=>x.userId===userId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,Math.max(1,Math.min(100,limit)));
  return {items:rows,unread:rows.filter(x=>!x.readAt).length,total:rows.length};
}
export async function markAllNotificationsRead(db:DatabaseAdapter,userId:string){
  const rows=await db.find("socialNotifications",x=>x.userId===userId&&!x.readAt);const at=now();
  for(const row of rows)await db.update("socialNotifications",row.id,{readAt:at});
  return {updated:rows.length,readAt:at};
}

export async function reconcileCreatorPayment(db:DatabaseAdapter,principal:AdminPrincipalRecord,input:{kind:"refund"|"dispute"|"chargeback";resourceType:"tip"|"paid_post"|"membership"|"ad_campaign"|"marketplace_order";resourceId:string;providerEventId:string;reason?:string},requestId?:string){
  const resourceId=clean(input.resourceId,120),eventId=clean(input.providerEventId,160);if(!resourceId||!eventId)throw new Error("INVALID_RECONCILIATION");
  const existing=(await db.find("paymentReconciliations",x=>x.providerEventId===eventId))[0];if(existing)return existing;
  return db.transaction(async tx=>{
    let creatorUserId="",grossCents=0,platformFeeCents=0,creatorNetCents=0,currency="USD",requiresClawback=false;
    let revenue=await tx.find("creatorRevenueEvents",x=>x.sourceId===resourceId);
    if(input.resourceType==="tip"){
      const row=await tx.get("creatorTips",resourceId);if(!row)throw new Error("PAYMENT_RESOURCE_NOT_FOUND");creatorUserId=row.creatorUserId;grossCents=row.amountCents;currency=row.currency;await tx.update("creatorTips",row.id,{status:"refunded"});
    }else if(input.resourceType==="paid_post"){
      const row=await tx.get("paidContentAccess",resourceId);if(!row)throw new Error("PAYMENT_RESOURCE_NOT_FOUND");creatorUserId=row.creatorUserId;grossCents=row.priceCents;currency=row.currency;await tx.update("paidContentAccess",row.id,{status:"refunded"});
    }else if(input.resourceType==="membership"){
      const row=await tx.get("creatorMembershipSubscriptions",resourceId);if(!row)throw new Error("PAYMENT_RESOURCE_NOT_FOUND");creatorUserId=row.creatorUserId;await tx.update("creatorMembershipSubscriptions",row.id,{status:"canceled"});
    }else if(input.resourceType==="ad_campaign"){
      const row=await tx.get("creatorAdCampaigns",resourceId);if(!row)throw new Error("PAYMENT_RESOURCE_NOT_FOUND");creatorUserId=row.creatorUserId;grossCents=Math.max(0,row.fundedCents-row.spentCents);currency=row.currency;await tx.update("creatorAdCampaigns",row.id,{status:"refunded"});
      const clickEvents=await tx.find("creatorAdEvents",x=>x.campaignId===row.id&&x.eventType==="click"&&x.fraudStatus==="accepted");const ids=new Set(clickEvents.map(x=>x.id));revenue=await tx.find("creatorRevenueEvents",x=>x.sourceType==="ad_click"&&ids.has(x.sourceId));
    }else{
      const order=await tx.get("spaceStoreOrders",resourceId);if(!order)throw new Error("PAYMENT_RESOURCE_NOT_FOUND");creatorUserId=order.sellerUserId;grossCents=order.grossCents;platformFeeCents=order.platformFeeCents;creatorNetCents=order.creatorNetCents;currency=order.currency;await tx.update("spaceStoreOrders",order.id,{status:"refunded"});
      const earnings=await tx.find("creatorEarnings",x=>x.orderId===order.id);for(const e of earnings){if(e.status==="paid")requiresClawback=true;await tx.update("creatorEarnings",e.id,{status:"refunded"});}
    }
    for(const r of revenue){grossCents+=input.resourceType==="ad_campaign"?r.grossCents:0;platformFeeCents+=r.platformFeeCents;creatorNetCents+=r.creatorNetCents;if(r.status==="paid")requiresClawback=true;await tx.update("creatorRevenueEvents",r.id,{status:"refunded"});}
    const rec=await tx.insert("paymentReconciliations",{creatorUserId,provider:"stripe",providerEventId:eventId,kind:input.kind,resourceType:input.resourceType,resourceId,grossCents,platformFeeCents,creatorNetCents,currency,status:requiresClawback?"requires_clawback":"applied",reason:clean(input.reason,500)||undefined});
    await tx.insert("paymentSecurityEvents",{userId:creatorUserId||undefined,kind:input.kind==="refund"?"refund":"payment_dispute",severity:requiresClawback?"critical":"high",provider:"stripe",resourceType:input.resourceType,resourceId,metadata:{providerEventId:eventId,reconciliationId:rec.id,requiresClawback}});
    await tx.insert("adminAuditEvents",{principalId:principal.id,action:"admin.payment.reconciled",target:rec.id,requestId,metadata:{kind:input.kind,resourceType:input.resourceType,resourceId,requiresClawback}});
    return rec;
  });
}

export async function creatorPayoutSafety(db:DatabaseAdapter,creatorUserId:string,currency="USD"){
  const [market,social,recons,payouts]=await Promise.all([db.find("creatorEarnings",x=>x.sellerUserId===creatorUserId&&x.currency===currency),db.find("creatorRevenueEvents",x=>x.creatorUserId===creatorUserId&&x.currency===currency),db.find("paymentReconciliations",x=>x.creatorUserId===creatorUserId&&x.currency===currency),db.find("creatorPayouts",x=>x.sellerUserId===creatorUserId&&x.currency===currency)]);
  const available=market.filter(x=>x.status==="available").reduce((n,x)=>n+x.creatorNetCents,0)+social.filter(x=>x.status==="available").reduce((n,x)=>n+x.creatorNetCents,0);
  const clawback=recons.filter(x=>x.status==="requires_clawback").reduce((n,x)=>n+x.creatorNetCents,0);const pendingPayouts=payouts.filter(x=>x.status==="pending").reduce((n,x)=>n+x.amountCents,0);
  return {currency,availableCents:available,pendingPayoutsCents:pendingPayouts,clawbackCents:clawback,payoutableCents:Math.max(0,available-pendingPayouts-clawback),hold:clawback>0,holdReason:clawback>0?"UNRESOLVED_REFUND_OR_CHARGEBACK":undefined};
}

export async function adFraudReview(db:DatabaseAdapter,campaignId:string){
  const campaign=await db.get("creatorAdCampaigns",campaignId);if(!campaign)throw new Error("CAMPAIGN_NOT_FOUND");const events=await db.find("creatorAdEvents",x=>x.campaignId===campaignId);const impressions=events.filter(x=>x.eventType==="impression").length,clicks=events.filter(x=>x.eventType==="click"&&x.fraudStatus==="accepted").length,duplicates=events.filter(x=>x.fraudStatus==="duplicate").length,blocked=events.filter(x=>x.fraudStatus==="blocked").length;const ctr=impressions?clicks/impressions:clicks?1:0;const risk=ctr>0.75&&clicks>=5?"high":ctr>0.4&&clicks>=5?"medium":"low";return {campaignId,impressions,clicks,duplicates,blocked,ctr,risk,recommendation:risk==="high"?"pause_and_review":risk==="medium"?"review":"allow"};
}
export async function enforceAdFraudHold(db:DatabaseAdapter,principal:AdminPrincipalRecord,campaignId:string,requestId?:string){const review=await adFraudReview(db,campaignId);if(review.risk!=="high")return {review,paused:false};const c=await db.get("creatorAdCampaigns",campaignId);if(c&&c.status==="active")await db.update("creatorAdCampaigns",c.id,{status:"paused"});await db.insert("adminAuditEvents",{principalId:principal.id,action:"admin.ad.fraud_hold",target:campaignId,requestId,metadata:review as unknown as Record<string,unknown>});return {review,paused:true};}

export async function createModerationAppeal(db:DatabaseAdapter,userId:string,input:{resourceType:"post"|"comment"|"message"|"space"|"user";resourceId:string;reason:string}){const reason=clean(input.reason,2000);if(reason.length<10)throw new Error("APPEAL_REASON_REQUIRED");const prior=(await db.find("moderationAppeals",x=>x.userId===userId&&x.resourceType===input.resourceType&&x.resourceId===input.resourceId&&["open","reviewing"].includes(x.status)))[0];if(prior)return prior;return db.insert("moderationAppeals",{userId,resourceType:input.resourceType,resourceId:clean(input.resourceId,120),reason,status:"open"});}
export async function resolveModerationAppeal(db:DatabaseAdapter,principal:AdminPrincipalRecord,appealId:string,decision:"upheld"|"reversed",note?:string,requestId?:string){const row=await db.get("moderationAppeals",appealId);if(!row)throw new Error("APPEAL_NOT_FOUND");const updated=await db.update("moderationAppeals",row.id,{status:decision,reviewedByPrincipalId:principal.id,decisionNote:clean(note,1000)||undefined,resolvedAt:now()});await db.insert("adminAuditEvents",{principalId:principal.id,action:"admin.moderation.appeal_resolved",target:row.id,requestId,metadata:{decision,resourceType:row.resourceType,resourceId:row.resourceId}});return updated;}

export async function setAgeSafetyProfile(db:DatabaseAdapter,userId:string,ageBand:"under_13"|"teen"|"adult",guardianConsent=false){if(ageBand==="under_13"&&!guardianConsent)throw new Error("GUARDIAN_CONSENT_REQUIRED");const policy={personalizedAds:ageBand==="adult",unknownDm:ageBand==="adult",liveHost:ageBand==="adult",creatorMonetization:ageBand==="adult",sensitiveMediaDefault:"blur" as const};const current=(await db.find("userSafetyProfiles",x=>x.userId===userId))[0];const values:Pick<UserSafetyProfileRecord,"ageBand"|"guardianConsentStatus"|"personalizedAds"|"unknownDm"|"liveHost"|"creatorMonetization"|"sensitiveMediaDefault">={ageBand,guardianConsentStatus:ageBand==="under_13"?(guardianConsent?"verified":"required"):"not_required",personalizedAds:policy.personalizedAds,unknownDm:policy.unknownDm,liveHost:policy.liveHost,creatorMonetization:policy.creatorMonetization,sensitiveMediaDefault:policy.sensitiveMediaDefault};return current?db.update("userSafetyProfiles",current.id,values):db.insert("userSafetyProfiles",{userId,...values});}

export async function productionReadiness116(db:DatabaseAdapter){const [failedWebhooks,recons,appeals,failedJobs,pendingPayouts]=await Promise.all([db.find("paymentWebhookEvents",x=>x.status==="failed"),db.find("paymentReconciliations",x=>x.status==="requires_clawback"),db.find("moderationAppeals",x=>["open","reviewing"].includes(x.status)),db.find("jobs",x=>x.status==="failed"),db.find("creatorPayouts",x=>x.status==="pending")]);return {phase:"116.0",paymentIntegrity:{failedWebhooks:failedWebhooks.length,unresolvedClawbacks:recons.length,pendingPayouts:pendingPayouts.length},trustSafety:{openAppeals:appeals.length},operations:{failedJobs:failedJobs.length},requiredExternalCertification:["Stripe live-mode refund/dispute drill","database backup restore drill","object-storage restore drill","OWASP DAST/penetration test","target-load test for feed, media, chat and checkout","CDN/video delivery test"],status:failedWebhooks.length||recons.length?"attention_required":"code_ready_external_drills_required"};}

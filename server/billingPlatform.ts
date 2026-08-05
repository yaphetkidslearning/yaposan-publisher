import type { DatabaseAdapter, OrganizationRecord, SubscriptionRecord } from './database.ts';

export type PlanId='free'|'creator'|'pro'|'business';
export type PlanDefinition={id:PlanId;name:string;monthlyCents:number;storageBytes:number;aiCredits:number;seats:number;features:string[];stripePriceEnv?:string};
export const PLAN_CATALOG:Record<PlanId,PlanDefinition>={
 free:{id:'free',name:'Free',monthlyCents:0,storageBytes:1_000_000_000,aiCredits:50,seats:1,features:['editor','standard-templates','local-export']},
 creator:{id:'creator',name:'Professional',monthlyCents:999,storageBytes:20_000_000_000,aiCredits:1_000,seats:1,features:['editor','premium-templates','cloud-sync','ai-basic','premium-export','priority-support'],stripePriceEnv:'STRIPE_PRICE_CREATOR'},
 pro:{id:'pro',name:'Professional Plus',monthlyCents:1999,storageBytes:100_000_000_000,aiCredits:5_000,seats:5,features:['editor','premium-templates','cloud-sync','ai-pro','brand-kit','custom-fonts','background-removal','upscale','advanced-export'],stripePriceEnv:'STRIPE_PRICE_PRO'},
 business:{id:'business',name:'Enterprise',monthlyCents:3999,storageBytes:1_000_000_000_000,aiCredits:25_000,seats:25,features:['editor','unlimited-templates','cloud-sync','ai-full','team-workspaces','collaboration','approvals','sso','advanced-security','audit-log','dedicated-support'],stripePriceEnv:'STRIPE_PRICE_BUSINESS'}
};
export type EntitlementSnapshot={plan:PlanId;status:string;features:string[];limits:{storageBytes:number;aiCredits:number;seats:number}};
export function resolveEntitlements(org:OrganizationRecord,sub?:SubscriptionRecord):EntitlementSnapshot{const requested=(sub?.plan??org.plan) as PlanId;const plan=PLAN_CATALOG[requested]??PLAN_CATALOG.free;const active=!sub||['active','trialing'].includes(sub.status);const effective=active?plan:PLAN_CATALOG.free;return{plan:effective.id,status:sub?.status??'active',features:[...effective.features],limits:{storageBytes:effective.storageBytes,aiCredits:effective.aiCredits,seats:effective.seats}}}
export function requireFeature(snapshot:EntitlementSnapshot,feature:string){if(!snapshot.features.includes(feature))throw new Error('FEATURE_NOT_INCLUDED')}
export async function syncStripeSubscription(db:DatabaseAdapter,event:any){
 const object=event?.data?.object??{};const eventType=String(event?.type??"");
 const customer=String(object.customer??"");
 const organizationId=String(object.metadata?.organizationId??object.client_reference_id??"");
 const providerSubscriptionId=String(eventType==="checkout.session.completed"?(object.subscription??""):object.id??"");
 let existing=(await db.find("subscriptions",s=>Boolean(customer&&s.providerCustomerId===customer)||Boolean(providerSubscriptionId&&s.providerSubscriptionId===providerSubscriptionId)||Boolean(organizationId&&s.organizationId===organizationId)))[0];
 if(!existing&&organizationId)existing=await db.insert("subscriptions",{organizationId,providerCustomerId:customer||undefined,providerSubscriptionId:providerSubscriptionId||undefined,plan:"free",status:"incomplete",seats:1});
 if(!existing)return undefined;
 const priceId=object.items?.data?.[0]?.price?.id;
 const metadataPlan=String(object.metadata?.plan??"") as PlanId;
 const plan=(PLAN_CATALOG[metadataPlan]?.id??Object.values(PLAN_CATALOG).find(p=>p.stripePriceEnv&&process.env[p.stripePriceEnv]===priceId)?.id??existing.plan) as PlanId;
 const status=eventType==="customer.subscription.deleted"?"canceled":String(object.status??(eventType==="checkout.session.completed"?"active":existing.status));
 const updated=await db.update("subscriptions",existing.id,{providerCustomerId:customer||existing.providerCustomerId,providerSubscriptionId:providerSubscriptionId||existing.providerSubscriptionId,plan,status,seats:Number(object.quantity??object.items?.data?.[0]?.quantity??existing.seats??1)});
 const org=await db.get("organizations",existing.organizationId);if(org)await db.update("organizations",org.id,{plan:['active','trialing'].includes(status)?plan:'free'});
 return updated;
}

export const PLAN_USAGE_LIMITS:Record<PlanId,{cloudProjects:number;monthlyExports:number;dailyAi:number;standardFormats:string[]}>={
 free:{cloudProjects:10,monthlyExports:20,dailyAi:5,standardFormats:["png","jpg","pdf"]},
 creator:{cloudProjects:100,monthlyExports:500,dailyAi:100,standardFormats:["png","jpg","pdf","svg","webp"]},
 pro:{cloudProjects:1000,monthlyExports:5000,dailyAi:500,standardFormats:["png","jpg","pdf","svg","webp","pptx","docx"]},
 business:{cloudProjects:100000,monthlyExports:100000,dailyAi:5000,standardFormats:["png","jpg","pdf","svg","webp","pptx","docx","mp4","webm","gif"]}
};
export function usageLimitsFor(plan:PlanId){return PLAN_USAGE_LIMITS[plan]??PLAN_USAGE_LIMITS.free}

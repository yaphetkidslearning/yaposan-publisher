import test from "node:test";
import assert from "node:assert/strict";
import { PLAN_CATALOG, syncStripeSubscription } from "../server/billingPlatform.ts";
import { InMemoryDatabase } from "../server/database.ts";
import { provisionAccount } from "../server/identity.ts";
import { validateCheckoutSelection } from "../server/commercialReadiness.ts";

test("Phase 80 maps all paid plans to configured Stripe prices",()=>{
 const env={STRIPE_PRICE_CREATOR:"price_creator",STRIPE_PRICE_PRO:"price_pro",STRIPE_PRICE_BUSINESS:"price_business"} as NodeJS.ProcessEnv;
 assert.equal(validateCheckoutSelection({plan:"creator",successUrl:"https://yaposan.com/account",cancelUrl:"https://yaposan.com/account"},env).priceId,"price_creator");
 assert.equal(validateCheckoutSelection({plan:"pro",successUrl:"https://yaposan.com/account",cancelUrl:"https://yaposan.com/account"},env).priceId,"price_pro");
 assert.equal(validateCheckoutSelection({plan:"business",successUrl:"https://yaposan.com/account",cancelUrl:"https://yaposan.com/account"},env).priceId,"price_business");
 assert.equal(PLAN_CATALOG.creator.monthlyCents,999);
});

test("Phase 80 checkout completion activates the selected plan",async()=>{
 const db=new InMemoryDatabase();await db.connect();await db.migrate();const account=await provisionAccount(db,{email:"phase80@example.com",password:"StrongPassword!80"});
 await db.insert("subscriptions",{organizationId:account.organization.id,providerCustomerId:"cus_phase80",plan:"free",status:"active",seats:1});
 const previous=process.env.STRIPE_PRICE_PRO;process.env.STRIPE_PRICE_PRO="price_phase80_pro";
 const updated=await syncStripeSubscription(db,{type:"checkout.session.completed",data:{object:{id:"cs_phase80",customer:"cus_phase80",subscription:"sub_phase80",client_reference_id:account.organization.id,metadata:{organizationId:account.organization.id,plan:"pro"}}}});
 assert.equal(updated?.plan,"pro");assert.equal(updated?.providerSubscriptionId,"sub_phase80");assert.equal((await db.get("organizations",account.organization.id))?.plan,"pro");
 if(previous===undefined)delete process.env.STRIPE_PRICE_PRO;else process.env.STRIPE_PRICE_PRO=previous;
});

test("Phase 80 canceled subscriptions return the organization to Free",async()=>{
 const db=new InMemoryDatabase();await db.connect();await db.migrate();const account=await provisionAccount(db,{email:"cancel80@example.com",password:"StrongPassword!80"});
 await db.update("organizations",account.organization.id,{plan:"creator"});
 await db.insert("subscriptions",{organizationId:account.organization.id,providerCustomerId:"cus_cancel",providerSubscriptionId:"sub_cancel",plan:"creator",status:"active",seats:1});
 await syncStripeSubscription(db,{type:"customer.subscription.deleted",data:{object:{id:"sub_cancel",customer:"cus_cancel",status:"canceled",metadata:{organizationId:account.organization.id,plan:"creator"}}}});
 assert.equal((await db.get("organizations",account.organization.id))?.plan,"free");
});

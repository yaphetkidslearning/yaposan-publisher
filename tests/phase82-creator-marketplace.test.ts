import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryDatabase } from "../server/database";
import { provisionAccount } from "../server/identity";
import { createReferralCode, creatorDashboard, listCreatorProducts, moderateCreatorProduct, purchaseCreatorProduct, redeemReferralCode, submitCreatorProduct } from "../server/creatorMarketplace";

test("Phase 82 supports creator products, moderation, purchases, payouts and referrals", async()=>{
 const db=new InMemoryDatabase();await db.connect();await db.migrate();
 const creator=await provisionAccount(db,{email:"creator@example.com",password:"StrongPass!123",organizationName:"Creator",region:"us-east"});
 const buyer=await provisionAccount(db,{email:"buyer@example.com",password:"StrongPass!123",organizationName:"Buyer",region:"us-east"});
 const submitted=await submitCreatorProduct(db,creator.user.id,{kind:"template",name:"Premium Flyer",priceCents:1200,license:"commercial",payload:"template-data"});
 assert.equal(submitted.status,"review");
 const approved=await moderateCreatorProduct(db,creator.user.id,submitted.id,true,[]);
 assert.equal(approved.status,"approved");
 assert.equal((await listCreatorProducts(db,{approvedOnly:true})).length,1);
 const purchase=await purchaseCreatorProduct(db,buyer.user.id,submitted.id);
 assert.equal(purchase.payoutCents,840);
 const dashboard=await creatorDashboard(db,creator.user.id);
 assert.equal(dashboard.metrics.sales,1);assert.equal(dashboard.metrics.payoutCents,840);
 const {code}=await createReferralCode(db,creator.user.id);assert.equal(code.length,10);
 const redeemed=await redeemReferralCode(db,buyer.user.id,code);assert.equal(redeemed.rewardAiCredits,10);
});

import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryDatabase } from "../server/database.ts";
import { communityBudgetStatus, reserveCommunityBudget, settleCommunityBudget } from "../server/aiCostControls.ts";
import { creditBalance, grantPurchasedCredits, reserveCredits, settleCreditReservation } from "../server/aiCredits.ts";
import { deleteProviderCredential, listProviderCredentials, loadProviderCredential, saveProviderCredential } from "../server/providerVault.ts";

async function fixture(){const db=new InMemoryDatabase();await db.connect();const u=await db.insert("users",{email:"phase907@example.com",passwordHash:"x",emailVerified:true,status:"active"});const org=await db.insert("organizations",{name:"Phase 90.7",ownerUserId:u.id,plan:"free"});return{db,org};}

test("community AI enforces one shared monthly ceiling and settles reservations",async()=>{process.env.AI_COMMUNITY_MONTHLY_BUDGET_USD="0.0001";const{db,org}=await fixture();await reserveCommunityBudget(db,{requestId:"r1",organizationId:org.id,estimatedMicros:60});await assert.rejects(()=>reserveCommunityBudget(db,{requestId:"r2",organizationId:org.id,estimatedMicros:50}),/COMMUNITY_AI_BUDGET_EXHAUSTED/);await settleCommunityBudget(db,"r1",20);const status=await communityBudgetStatus(db);assert.equal(status.usedMicros,20);assert.equal(status.remainingMicros,80);});

test("hosted AI credits reserve before provider spend and refund unused reservation",async()=>{const{db,org}=await fixture();await grantPurchasedCredits(db,{id:"evt_907",type:"checkout.session.completed",data:{object:{id:"cs_907",payment_status:"paid",currency:"usd",client_reference_id:org.id,metadata:{purpose:"ai_credits",organizationId:org.id,pack:"small"}}}});await reserveCredits(db,org.id,20,"job-1");assert.equal(await creditBalance(db,org.id),180);await settleCreditReservation(db,org.id,"job-1",7);assert.equal(await creditBalance(db,org.id),193);await settleCreditReservation(db,org.id,"job-1",7);assert.equal(await creditBalance(db,org.id),193);});

test("BYO provider keys are encrypted at rest and never returned by list",async()=>{process.env.AI_CREDENTIAL_ENCRYPTION_KEY=Buffer.alloc(32,7).toString("base64");const{db,org}=await fixture();const saved=await saveProviderCredential(db,{organizationId:org.id,provider:"openai",apiKey:"sk-test-phase907-secret",model:"gpt-4.1-mini"});assert.notEqual(saved.encryptedApiKey,"sk-test-phase907-secret");const listed=await listProviderCredentials(db,org.id);assert.equal("encryptedApiKey" in listed[0],false);assert.equal(listed[0].keyLast4,"cret");const loaded=await loadProviderCredential(db,org.id,"openai");assert.equal(loaded?.apiKey,"sk-test-phase907-secret");assert.equal(await deleteProviderCredential(db,org.id,"openai"),true);});

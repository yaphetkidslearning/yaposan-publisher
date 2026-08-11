import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDatabase } from '../server/database.ts';
import { reserveCommunityBudget, communityBudgetStatus, settleCommunityBudget } from '../server/aiCostControls.ts';
import { reserveCredits, settleCreditReservation, creditBalance, applyStripeCreditReversal } from '../server/aiCredits.ts';
import { assertSafeProviderEndpoint } from '../server/aiNetworkSecurity.ts';
import { providerCostMicros } from '../server/aiPricing.ts';

async function setup(){const db=new InMemoryDatabase();await db.connect();await db.migrate();const user=await db.insert('users',{email:'phase908@example.com',passwordHash:'x',emailVerified:true,status:'active'});const org=await db.insert('organizations',{name:'P908',ownerUserId:user.id,plan:'free'});return{db,user,org}}

test('community budget reservations are serialized and cannot exceed ceiling',async()=>{process.env.AI_COMMUNITY_MONTHLY_BUDGET_USD='0.000001';const {db,org,user}=await setup();const results=await Promise.allSettled([reserveCommunityBudget(db,{requestId:'r1',organizationId:org.id,userId:user.id,estimatedMicros:1}),reserveCommunityBudget(db,{requestId:'r2',organizationId:org.id,userId:user.id,estimatedMicros:1})]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);const status=await communityBudgetStatus(db);assert.equal(status.usedMicros,1)});

test('credit reservations are serialized and overage is absorbed instead of post-spend debit',async()=>{const {db,org}=await setup();await db.insert('aiCreditTransactions',{organizationId:org.id,credits:5,kind:'adjustment'});const results=await Promise.allSettled([reserveCredits(db,org.id,4,'a'),reserveCredits(db,org.id,4,'b')]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);const winner=results[0].status==='fulfilled'?'a':'b';await settleCreditReservation(db,org.id,winner,10);assert.equal(await creditBalance(db,org.id),1);const tx=(await db.find('aiCreditTransactions',x=>String(x.metadata?.reservationId??'')===winner&&x.metadata?.settlement===true))[0];assert.equal(tx.metadata.overageCredits,6)});

test('SSRF policy blocks private custom endpoints and permits loopback only for local providers',async()=>{await assert.rejects(()=>assertSafeProviderEndpoint('custom','http://127.0.0.1:8080/v1'),/HTTPS_REQUIRED|PRIVATE_NETWORK/);await assertSafeProviderEndpoint('ollama','http://127.0.0.1:11434/v1/chat/completions');await assert.rejects(()=>assertSafeProviderEndpoint('ollama','http://192.168.1.8:11434/v1/chat/completions'),/LOOPBACK/)});

test('model-specific pricing overrides deployment defaults',()=>{process.env.AI_MODEL_PRICING_JSON=JSON.stringify({'openai:gpt-test':{inputUsdPerMillion:2,outputUsdPerMillion:8}});assert.equal(providerCostMicros(1000,500,'openai','gpt-test'),6000)});

test('Stripe refund revokes purchased credits idempotently',async()=>{const {db,org}=await setup();await db.insert('aiCreditTransactions',{organizationId:org.id,credits:200,kind:'purchase',amountCents:200,currency:'usd',metadata:{paymentIntentId:'pi_1'}});const event={id:'evt_refund',type:'charge.refunded',data:{object:{payment_intent:'pi_1',amount:200,amount_refunded:200,currency:'usd'}}};const one=await applyStripeCreditReversal(db,event);assert.equal(one.credits,-200);await applyStripeCreditReversal(db,event);assert.equal(await creditBalance(db,org.id),0)});

test('community settlement never pushes global accounting above reservation',async()=>{process.env.AI_COMMUNITY_MONTHLY_BUDGET_USD='1';const {db,org,user}=await setup();await reserveCommunityBudget(db,{requestId:'r3',organizationId:org.id,userId:user.id,estimatedMicros:100});await settleCommunityBudget(db,'r3',1000);const status=await communityBudgetStatus(db);assert.equal(status.usedMicros,100)});

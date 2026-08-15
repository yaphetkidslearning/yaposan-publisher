import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {InMemoryDatabase} from '../server/database.ts';
import {PLAN_CATALOG,resolveEntitlements,requireFeature} from '../server/billingPlatform.ts';
import {estimateCredits,moderateAiInput,runAiGateway} from '../server/aiPlatform.ts';

test('plan catalog exposes commercial tiers and limits',()=>{assert.equal(PLAN_CATALOG.creator.monthlyCents,999);assert.equal(PLAN_CATALOG.business.seats,25);assert.ok(PLAN_CATALOG.pro.features.includes('advanced-export'))});
test('inactive subscription falls back to free entitlements',()=>{const org:any={plan:'business'};const sub:any={plan:'business',status:'past_due'};const e=resolveEntitlements(org,sub);assert.equal(e.plan,'free');assert.throws(()=>requireFeature(e,'team-workspaces'))});
test('AI moderation and credit estimates are deterministic',()=>{assert.equal(moderateAiInput('write a product description').allowed,true);assert.equal(moderateAiInput('malware payload').allowed,false);assert.equal(estimateCredits('image',100,50),21)});
test('AI gateway records usage and succeeds with provider fallback',async()=>{
  const db=new InMemoryDatabase();await db.connect();await db.migrate();
  const server=http.createServer((req,res)=>{
    if(req.url==='/broken'){res.writeHead(500,{'content-type':'application/json'});res.end('{}');return}
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify({model:'test',choices:[{message:{content:'done'}}],usage:{prompt_tokens:2,completion_tokens:1}}));
  });
  await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve())});
  const address=server.address();assert.ok(address&&typeof address==='object');
  const base=`http://127.0.0.1:${address.port}`;
  const providers=[{name:'ollama',endpoint:`${base}/broken`,apiKey:'x'},{name:'lmstudio',endpoint:`${base}/working`,apiKey:'x'}];
  const previousRetries=process.env.AI_PROVIDER_MAX_RETRIES;process.env.AI_PROVIDER_MAX_RETRIES='0';
  try{
    const result=await runAiGateway(db,{organizationId:'o1',userId:'u1',plan:'creator',task:'write',prompt:'hello'},providers);
    assert.equal(result.provider,'lmstudio');assert.equal(result.output,'done');
    const jobs=await db.find('jobs',j=>j.kind==='ai');assert.equal(jobs[0].status,'succeeded');assert.equal(jobs[0].attempts,2);
  }finally{
    if(previousRetries===undefined)delete process.env.AI_PROVIDER_MAX_RETRIES;else process.env.AI_PROVIDER_MAX_RETRIES=previousRetries;
    await new Promise<void>(resolve=>server.close(()=>resolve()));
  }
});

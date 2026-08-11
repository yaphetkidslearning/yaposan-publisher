import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { InMemoryDatabase } from '../server/database.ts';
import { __providerVaultTest, saveProviderCredential, deleteProviderCredential } from '../server/providerVault.ts';
import { assertSafeProviderEndpoint, fetchJsonLimited, isForbiddenProviderIp } from '../server/aiNetworkSecurity.ts';
import { normalizeAiRequest, createAiJobWithConcurrencyGuard } from '../server/aiRequestPolicy.ts';
import { isRetryableAiProviderError } from '../server/aiPlatform.ts';

const keyA=Buffer.alloc(32,17).toString('base64');
const keyB=Buffer.alloc(32,23).toString('base64');
function env(){process.env.AI_CREDENTIAL_ENCRYPTION_KEY=keyA;process.env.AI_CREDENTIAL_ENCRYPTION_KEY_VERSION='7';process.env.AI_CREDENTIAL_ENCRYPTION_KEYS_PREVIOUS_JSON='{}'}
async function setup(){const db=new InMemoryDatabase();await db.connect();await db.migrate();const user=await db.insert('users',{email:'phase909@example.com',passwordHash:'x',emailVerified:true,status:'active'});const org=await db.insert('organizations',{name:'P909',ownerUserId:user.id,plan:'free'});await db.insert('memberships',{organizationId:org.id,userId:user.id,role:'owner'});return{db,user,org}}

test('provider ciphertext is AAD-bound and versioned',()=>{env();const sealed=__providerVaultTest.seal('secret','org-a','openai');assert.equal(sealed.keyVersion,'7');assert.equal(__providerVaultTest.open(sealed.ciphertext,'org-a','openai','7'),'secret');assert.throws(()=>__providerVaultTest.open(sealed.ciphertext,'org-b','openai','7'),/DECRYPT_FAILED/);assert.throws(()=>__providerVaultTest.open(sealed.ciphertext,'org-a','anthropic','7'),/DECRYPT_FAILED/);assert.throws(()=>__providerVaultTest.open(sealed.ciphertext,'org-a','openai','8'),/KEY_VERSION_MISMATCH/)});

test('wrong key and malformed ciphertext fail closed',()=>{env();const sealed=__providerVaultTest.seal('secret','org-a','openai');process.env.AI_CREDENTIAL_ENCRYPTION_KEY=keyB;assert.throws(()=>__providerVaultTest.open(sealed.ciphertext,'org-a','openai','7'),/DECRYPT_FAILED/);process.env.AI_CREDENTIAL_ENCRYPTION_KEY=keyA;assert.throws(()=>__providerVaultTest.open('v3:7:not-base64','org-a','openai','7'),/DECRYPT_FAILED/)});

test('provider credential changes emit metadata-only audit events',async()=>{env();const {db,user,org}=await setup();await saveProviderCredential(db,{organizationId:org.id,actorUserId:user.id,provider:'openai',apiKey:'sk-test-value',endpoint:'https://api.openai.com/v1/chat/completions'});await deleteProviderCredential(db,org.id,'openai',user.id);const events=await db.find('auditEvents',x=>x.organizationId===org.id);assert.deepEqual(events.map(x=>x.action),['ai.provider.connected','ai.provider.deleted']);const text=JSON.stringify(events);assert.equal(text.includes('sk-test-value'),false)});

test('SSRF special-use ranges are rejected',async()=>{for(const ip of ['127.0.0.1','10.0.0.1','100.64.0.1','169.254.169.254','192.168.1.1','224.0.0.1','203.0.113.10'])assert.equal(isForbiddenProviderIp(ip),true);await assert.rejects(()=>assertSafeProviderEndpoint('custom','https://100.64.0.1/v1'),/PRIVATE_NETWORK/)});

test('provider transport enforces timeout, response size and cross-origin redirect policy',async()=>{
 const server=http.createServer((req,res)=>{if(req.url==='/slow'){setTimeout(()=>{res.setHeader('content-type','application/json');res.end('{}')},1500);return}if(req.url==='/large'){res.setHeader('content-type','application/json');res.end(JSON.stringify({data:'x'.repeat(5000)}));return}if(req.url==='/redirect'){res.statusCode=302;res.setHeader('location',`http://localhost:${server.address().port}/ok`);res.end();return}res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true}))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
 try{await assert.rejects(()=>fetchJsonLimited(`http://127.0.0.1:${port}/slow`,{}, {provider:'ollama',timeoutMs:1000,maxBytes:1024}),/TIMEOUT/);await assert.rejects(()=>fetchJsonLimited(`http://127.0.0.1:${port}/large`,{}, {provider:'ollama',timeoutMs:2000,maxBytes:1024}),/TOO_LARGE/);await assert.rejects(()=>fetchJsonLimited(`http://127.0.0.1:${port}/redirect`,{}, {provider:'ollama'}),/CROSS_ORIGIN_REDIRECT/)}finally{server.close()}
});

test('AI request normalization caps tokens and rejects oversized input',()=>{process.env.AI_MAX_OUTPUT_TOKENS='2048';process.env.AI_MAX_PROMPT_BYTES='16';const base={organizationId:'o',userId:'u',plan:'free',task:'write'};assert.equal(normalizeAiRequest({...base,prompt:'hello',maxTokens:99999}).maxTokens,2048);assert.throws(()=>normalizeAiRequest({...base,prompt:'x'.repeat(17)}),/INPUT_TOO_LARGE/)});

test('AI concurrency guard prevents duplicate simultaneous spend paths',async()=>{process.env.AI_MAX_CONCURRENT_REQUESTS_PER_USER='1';process.env.AI_MAX_CONCURRENT_REQUESTS_PER_ORG='1';const {db,user,org}=await setup();const req={organizationId:org.id,userId:user.id,plan:'free',task:'write',prompt:'hello'};const results=await Promise.allSettled([createAiJobWithConcurrencyGuard(db,req,'community'),createAiJobWithConcurrencyGuard(db,req,'community')]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1)});

test('retry classification is bounded to transient errors',()=>{for(const code of [429,500,503])assert.equal(isRetryableAiProviderError(new Error(`AI_PROVIDER_${code}`)),true);for(const code of [400,401,403,404])assert.equal(isRetryableAiProviderError(new Error(`AI_PROVIDER_${code}`)),false);assert.equal(isRetryableAiProviderError(new Error('AI_PROVIDER_TIMEOUT')),true)});

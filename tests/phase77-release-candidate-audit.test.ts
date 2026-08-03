import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=(file:string)=>fs.readFileSync(path.join(root,file),'utf8');

test('production services are consolidated at project root',()=>{
  for(const file of ['server/postgresDatabase.ts','server/identity.ts','server/billingPlatform.ts','server/aiPlatform.ts','server/collaboration.ts','server/productionExport.ts','server/securityPlatform.ts','server/storage.ts','src/utils/phase76EnterpriseAutomation.ts']){
    assert.equal(fs.existsSync(path.join(root,file)),true,file);
  }
  assert.equal(fs.existsSync(path.join(root,'Yaposan-Phase76-Enterprise-Automation-and-Intelligent-Workflow-Platform')),false);
});

test('database uses PostgreSQL when DATABASE_URL is configured',()=>{
  const source=read('server/database.ts');
  assert.match(source,/process\.env\.DATABASE_URL/);
  assert.match(source,/createPostgresDatabase/);
});

test('four-tier Phase 77 pricing is unified',()=>{
  const account=read('src/app/account.tsx');
  const home=read('src/app/index.tsx');
  const commercial=read('src/utils/phase34CommercialReleaseEngine.ts');
  for(const text of [account,home,commercial]){
    assert.match(text,/Professional/);
    assert.match(text,/Professional Plus/);
    assert.match(text,/Enterprise/);
    assert.match(text,/9\.99/);
    assert.match(text,/19\.99/);
    assert.match(text,/39\.99/);
  }
});

test('production configuration and regression commands are retained',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.version,'77.0.2');
  assert.ok(pkg.dependencies.pg);
  for(const script of ['server','test:phase69','test:phase71','test:phase73','test:phase75','test:phase76','test:phase77','verify:phase77']) assert.ok(pkg.scripts[script],script);
  const env=read('.env.example');
  for(const key of ['DATABASE_URL','SESSION_SECRET','STRIPE_SECRET_KEY','OPENAI_API_KEY','REDIS_URL']) assert.match(env,new RegExp(`^${key}=`,`m`));
});


test('home keeps only three workspace cards and one sidebar upgrade panel',()=>{
  const home=read('src/app/index.tsx');
  assert.match(home,/>Upgrade Pro<\/Text>/);
  assert.doesNotMatch(home,/Upgrade to Pro/);
  assert.doesNotMatch(home,/Upgrade Now/);
  assert.doesNotMatch(home,/Unlock More Power/);
  assert.match(home,/tUpgradeButton: \{[^}]*marginTop: 18/);
  assert.match(home,/router\.push\("\/account"\)/);
});

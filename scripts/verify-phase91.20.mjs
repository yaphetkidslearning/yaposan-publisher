import fs from 'node:fs';
const required=[
  'src/utils/supportContext.ts','src/utils/supportTransport.ts','src/app/contact.tsx','src/app/help.tsx','src/app/faq.tsx','src/app/troubleshoot.tsx','tests/phase9120-guidance-support-completion.test.mjs'
];
const missing=required.filter(p=>!fs.existsSync(p));
if(missing.length){console.error('Phase 91.20 missing files:',missing);process.exit(1)}
const faq=fs.readFileSync('src/utils/helpCenterContent.ts','utf8');
const count=(faq.match(/question:/g)||[]).length;
if(count<55){console.error(`Phase 91.20 requires at least 55 FAQ entries; found ${count}`);process.exit(1)}
const server=fs.readFileSync('server/index.ts','utf8');
if((server.match(/req\.method === \"POST\" &&\s*url\.pathname === \"\/api\/v1\/support\/tickets\"/g)||[]).length!==1){console.error('Expected exactly one support ticket creation route');process.exit(1)}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
for(const name of ['test:phase91.20','check:phase91.20','verify:phase91.20']) if(typeof pkg.scripts?.[name]!=='string'){console.error(`Missing script ${name}`);process.exit(1)}
console.log(`Phase 91.20 static completion gate passed (${count} FAQ entries).`);

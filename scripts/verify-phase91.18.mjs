import fs from 'node:fs';
const required=['src/app/help.tsx','src/app/faq.tsx','src/app/troubleshoot.tsx','src/app/contact.tsx','src/utils/helpCenterContent.ts','src/components/workspace/Phase241IShell.tsx','tests/phase9118-guidance-help-center.test.mjs','PHASE91.18-GUIDANCE-HELP-FAQ-SUPPORT.md'];
let failed=false;for(const p of required){if(!fs.existsSync(p)){console.error(`MISSING ${p}`);failed=true}else console.log(`OK ${p}`)}
const content=fs.readFileSync('src/utils/helpCenterContent.ts','utf8');const faqCount=(content.match(/question:/g)||[]).length;if(faqCount<40){console.error(`FAIL only ${faqCount} FAQ items`);failed=true}else console.log(`OK ${faqCount} FAQ items`);
const sitemap=fs.readFileSync('public/sitemap.xml','utf8');for(const path of ['/help','/faq','/troubleshoot','/contact'])if(!sitemap.includes(path)){console.error(`FAIL sitemap missing ${path}`);failed=true}
if(failed)process.exit(1);console.log('Phase 91.18 guidance/help static gate passed.');

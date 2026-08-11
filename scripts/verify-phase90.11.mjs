import fs from 'node:fs';
import path from 'node:path';
const required=[
 'PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md',
 'docs/release/phase90.11/AI-PRIVACY-AND-CONTENT-BOUNDARIES.md',
 'docs/release/phase90.11/OPEN-SOURCE-CLEAN-CLONE-CHECKLIST.md',
 'docs/release/phase90.11/LAUNCH-DAY-RUNBOOK.md',
 'docs/release/phase90.11/FEATURE-INVENTORY-CERTIFICATION.md',
 'docs/release/phase90.11/THIRD-PARTY-ASSET-LICENSE-AUDIT.md',
 'docs/release/phase90.11/PRODUCTION-CERTIFICATION-MATRIX.md',
 'scripts/generate-phase90.11-certification.mjs','scripts/phase90.11-full-check.mjs','scripts/verify-production.mjs','scripts/generate-sbom.mjs','scripts/phase90.11-local-certification.ps1',
 '.github/workflows/codeql.yml','.github/CODEOWNERS'
];
for(const f of required)if(!fs.existsSync(f))throw new Error(`Missing Phase 90.11 file: ${f}`);
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
for(const s of ['check:phase90.11','test:phase90.11','verify:phase90.11','verify:production','certify:phase90.11:evidence','certify:phase90.11:local','sbom:phase90.11','check:phase90.11:full','certify:phase90.11:full'])if(!pkg.scripts?.[s])throw new Error(`Missing package script ${s}`);
const g=fs.readFileSync('.gitleaks.toml','utf8');if(!g.includes('yaposan\\.[A-Za-z0-9._-]+')||g.includes('A-Za-z0-9.*-'))throw new Error('Phase 90.4/90.9 Gitleaks narrowing regressed');
const ignore=fs.readFileSync('.gitignore','utf8');for(const f of ['gitleaks-report.json','gitleaks-full-report.json'])if(!ignore.includes(f))throw new Error(`${f} must remain ignored`);
const security=fs.readFileSync('scripts/verify-phase90.9.mjs','utf8');if(!security.includes('Frontend provider secret reference found'))throw new Error('Phase 90.9 frontend-secret gate missing');
const aiPrivacy=fs.readFileSync('docs/release/phase90.11/AI-PRIVACY-AND-CONTENT-BOUNDARIES.md','utf8');for(const t of ['free/open source','server-side secrets','Local AI'])if(!aiPrivacy.toLowerCase().includes(t.toLowerCase()))throw new Error(`AI privacy documentation missing ${t}`);
for(const base of ['src','public'])if(fs.existsSync(base)){for(const entry of fs.readdirSync(base,{recursive:true})){const f=path.join(base,String(entry));if(fs.existsSync(f)&&fs.statSync(f).isFile()){const text=fs.readFileSync(f,'utf8');if(/EXPO_PUBLIC_(?:OPENAI|ANTHROPIC|GEMINI|REMOVE_BG|AI)_API_KEY/.test(text))throw new Error(`Frontend provider key reference found: ${f}`)}}}
const full=JSON.parse(fs.readFileSync('release/phase90.11/full-certification.json','utf8'));if(full.gateCount!==35||full.gates?.length!==35)throw new Error('Phase 90.11 full certification must contain all 35 gates');
console.log('Phase 90.11 static release-readiness certification passed (35-gate full check present).');

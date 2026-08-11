import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('release/phase90.11',{recursive:true});
const run=spawnSync(process.execPath,['scripts/phase90.11-full-check.mjs'],{stdio:'inherit'});
if(run.status!==0)process.exit(run.status??1);
const full=JSON.parse(fs.readFileSync('release/phase90.11/full-certification.json','utf8'));
const groups={
  'security-certification.json':['02','04','06','07','12','13','22','23','24','27','28'],
  'production-certification.json':['01','08','14','15','16','20','21','30','31','35'],
  'integration-certification.json':['05','11','17','18','24'],
  'performance-certification.json':['11','17','22','25'],
  'accessibility-certification.json':['09','10'],
  'open-source-certification.json':['03','26','27','28','29','30','32','33','34'],
  'backup-restore-evidence.json':['05','19','20'],
};
for(const [name,prefixes] of Object.entries(groups)){
  const gates=full.gates.filter(g=>prefixes.some(p=>g.id.startsWith(p+'-')));
  fs.writeFileSync(`release/phase90.11/${name}`,JSON.stringify({phase:'90.11',generatedAt:full.generatedAt,source:'full-certification.json',gates},null,2)+'\n');
}
// Reproducibility manifest with facts that can be obtained safely from this checkout.
const { execFileSync }=await import('node:child_process');
const crypto=(await import('node:crypto')).default;
const safe=(fn)=>{try{return fn()}catch{return null}};
const sha=(p)=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
const manifest={phase:'90.11',generatedAt:full.generatedAt,gitSha:safe(()=>execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()),gitDirty:safe(()=>execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0),node:process.version,npm:safe(()=>execFileSync(process.platform==='win32'?'npm.cmd':'npm',['--version'],{encoding:'utf8'}).trim()),lockfileSha256:sha('package-lock.json'),gitleaksConfigSha256:sha('.gitleaks.toml'),deploymentId:process.env.RENDER_DEPLOY_ID||process.env.RENDER_SERVICE_ID||null,deploymentCommit:process.env.RENDER_GIT_COMMIT||null,migrationVersion:process.env.YAPOSAN_MIGRATION_VERSION||null,buildTimestamp:full.generatedAt};
fs.writeFileSync('release/phase90.11/release-manifest.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync('release/phase90.11/known-limitations.md',`# Phase 90.11 Known Limitations\n\nThis package performs a **full 35-gate source/readiness check**, but it does not fabricate external evidence. The following classes remain BLOCKED until verified against the real environment: full Git history, GitHub repository settings, Render/production environment variables, DNS/TLS, email DNS/delivery, cross-tenant authenticated route tests, adversarial upload tests, browser/accessibility matrix, failure injection, export-worker recovery, migration drills, backup/restore, deployment rollback/restart tests, real Stripe flows, third-party redistribution rights, and Search Console recrawl.\n\nUse \`npm run certify:phase90.11:full\` to require zero critical BLOCKED gates before declaring release-ready.\n`);
console.log('Phase 90.11 full evidence files refreshed.');

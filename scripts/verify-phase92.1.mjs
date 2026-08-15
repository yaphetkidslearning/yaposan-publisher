import fs from 'node:fs';
const must=['src/app/support-requests.tsx','src/app/support-inbox.tsx','tests/phase921-support-lifecycle-hardening.test.mjs','PHASE92.1-SUPPORT-LIFECYCLE-AND-HELP-HARDENING.md'];
const missing=must.filter(p=>!fs.existsSync(p));if(missing.length){console.error('92.1 missing:',missing.join(', '));process.exit(1)}
const server=fs.readFileSync('server/index.ts','utf8');const checks=['/api/v1/support/tickets/my','/api/v1/admin/support/tickets','supportAttachmentMatchesMime','/api/v1/help/feedback'];for(const c of checks)if(!server.includes(c)){console.error('92.1 gate missing',c);process.exit(1)}
console.log('Phase 92.1 support lifecycle/help hardening gate: PASS');

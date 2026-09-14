import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const envPath=process.argv[2] || '.env.production';
const parse=(text)=>Object.fromEntries(text.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#')&&x.includes('=')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i).trim(),line.slice(i+1).trim()]}));
if(!fs.existsSync(envPath)){console.error(`Production preflight failed: ${envPath} not found. Copy .env.production.example and fill real values.`);process.exit(1)}
const env={...process.env,...parse(fs.readFileSync(envPath,'utf8'))};
const failures=[];const warnings=[];
const req=(name)=>{const v=(env[name]||'').trim();if(!v||/REPLACE_ME|REPLACE_WITH/i.test(v))failures.push(`${name} is missing or still uses a placeholder`);return v};
const https=(name)=>{const v=req(name);if(v&&!/^https:\/\//i.test(v))failures.push(`${name} must use HTTPS in production`);if(/localhost|127\.0\.0\.1/i.test(v))failures.push(`${name} must not reference localhost in production`);return v};
const min=(name,n)=>{const v=req(name);if(v.length<n)failures.push(`${name} must be at least ${n} characters`);return v};

if(env.NODE_ENV!=='production')failures.push('NODE_ENV must be production');
https('PUBLIC_WEB_URL'); https('PUBLIC_API_URL'); https('EXPO_PUBLIC_API_URL');
const origins=req('PUBLIC_ORIGINS').split(',').map(x=>x.trim()).filter(Boolean);if(!origins.length||origins.some(x=>!/^https:\/\//i.test(x)||/localhost|127\.0\.0\.1/i.test(x)))failures.push('PUBLIC_ORIGINS must contain only explicit HTTPS production origins');
req('DATABASE_URL'); min('SESSION_SECRET',32); if(env.TRUST_PROXY!=='true')failures.push('TRUST_PROXY=true is required behind the production proxy/load balancer');
if(env.COLLABORATION_DRIVER!=='redis')failures.push('COLLABORATION_DRIVER=redis is required'); req('REDIS_URL');
if(env.STORAGE_DRIVER!=='r2')failures.push('STORAGE_DRIVER=r2 is required for durable production storage'); ['STORAGE_BUCKET','STORAGE_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'].forEach(req);
req('RESEND_API_KEY');req('EMAIL_FROM');if(env.REQUIRE_EMAIL_VERIFICATION!=='true')failures.push('REQUIRE_EMAIL_VERIFICATION=true is required for local-account recovery compatibility');
min('ADMIN_SESSION_SECRET',32);const admin=req('ADMIN_BOOTSTRAP_EMAIL');if(/@localhost$|\.(local|localhost)$/i.test(admin))failures.push('ADMIN_BOOTSTRAP_EMAIL must be deliverable');min('ADMIN_BOOTSTRAP_PASSWORD',14);
if(env.IDENTITY_PROVIDER!=='oidc')failures.push('IDENTITY_PROVIDER=oidc is required by the 117.4 production gate');if(env.REQUIRE_EXTERNAL_IDENTITY!=='true')failures.push('REQUIRE_EXTERNAL_IDENTITY=true is required by the 117.4 production gate');['OIDC_ISSUER','OIDC_CLIENT_ID'].forEach(req);
const stripe=req('STRIPE_SECRET_KEY');if(stripe.startsWith('sk_test_'))failures.push('STRIPE_SECRET_KEY must be a live-mode key for production');req('STRIPE_WEBHOOK_SECRET');req('OPENAI_API_KEY');min('LICENSE_SIGNING_SECRET',32);
if(env.EXPORT_WORKER_ENABLED!=='true')failures.push('EXPORT_WORKER_ENABLED=true is required');req('EXPORT_WORKER_TOKEN');req('PRODUCT_PHOTO_WORKER_TOKEN');req('MALWARE_SCANNER_URL');min('METRICS_TOKEN',24);
if(env.READINESS_STORAGE_PROBE!=='true')failures.push('READINESS_STORAGE_PROBE=true is required');if(env.SECURITY_EVENT_SINK==='off')failures.push('SECURITY_EVENT_SINK must not be off in production');
for(const file of ['docker-compose.production.yml','Dockerfile.api','Dockerfile.web','server/postgresDatabase.ts','scripts/verify-production.mjs'])if(!fs.existsSync(path.join(root,file)))failures.push(`Missing production artifact: ${file}`);
const migration=fs.readFileSync(path.join(root,'server/postgresDatabase.ts'),'utf8');if(!/CREATE TABLE IF NOT EXISTS auth_tokens/.test(migration))failures.push('auth_tokens production migration is missing');if(/\);\n`\n`CREATE TABLE IF NOT EXISTS auth_tokens/.test(migration))failures.push('postgresDatabase.ts still contains the malformed auth_tokens template separator');
for(const [name,label] of [['BACKUP_DATABASE_ENABLED','database backups'],['BACKUP_OBJECT_STORAGE_ENABLED','object-storage backups'],['BACKUP_RESTORE_DRILL_AT','backup restore drill'],['ALERTING_CONFIGURED','production alerting'],['TLS_CERTIFICATE_VERIFIED','TLS certificate verification'],['STRIPE_WEBHOOK_LIVE_TESTED','Stripe live webhook test'],['RESEND_DELIVERY_TESTED','Resend delivery test']])if(!env[name]||env[name]==='false')warnings.push(`External launch evidence still required: ${label}`);
const report={release:'117.4',environmentFile:envPath,ok:failures.length===0,failures,warnings};console.log(JSON.stringify(report,null,2));process.exit(failures.length?1:0);

import fs from 'node:fs';
import crypto from 'node:crypto';

const envFile = process.argv[2] || '.env.production';
if (!fs.existsSync(envFile)) {
  console.error(`Missing ${envFile}. Copy .env.production.example and fill real values.`);
  process.exit(1);
}
const env = Object.fromEntries(fs.readFileSync(envFile,'utf8').split(/\r?\n/).filter(Boolean).filter(x=>!x.trim().startsWith('#')).map(line=>{const i=line.indexOf('=');return i<0?[line.trim(),'']:[line.slice(0,i).trim(),line.slice(i+1).trim()]}));
const required = ['PUBLIC_ORIGINS','DATABASE_URL','POSTGRES_PASSWORD','REDIS_URL','REDIS_PASSWORD','SESSION_SECRET','STORAGE_DRIVER','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_CREATOR','STRIPE_PRICE_PRO','STRIPE_PRICE_BUSINESS','OPENAI_API_KEY','RESEND_API_KEY','EMAIL_FROM','ADMIN_EMAILS','EXPORT_WORKER_TOKEN','BACKUP_SIGNING_SECRET','LICENSE_SIGNING_SECRET','METRICS_TOKEN','EXPO_PUBLIC_API_URL'];
const weak = /^(change_me|changeme|replace|replace-with|example|test|secret|password|todo|localhost|https:\/\/app\.yaposan\.example)/i;
const issues=[];
for (const key of required) {
  const value=env[key]||'';
  if (!value) issues.push(`${key} is missing`);
  else if (weak.test(value)) issues.push(`${key} still contains a placeholder`);
}
for (const key of ['SESSION_SECRET','EXPORT_WORKER_TOKEN','BACKUP_SIGNING_SECRET','LICENSE_SIGNING_SECRET','METRICS_TOKEN']) {
  if ((env[key]||'').length < 32) issues.push(`${key} must be at least 32 characters`);
}
for (const key of ['PUBLIC_ORIGINS','EXPO_PUBLIC_API_URL']) {
  const value=env[key]||'';
  if (value && !value.split(',').every(v=>/^https:\/\//i.test(v.trim()))) issues.push(`${key} must use HTTPS`);
}
if (env.STORAGE_DRIVER === 'r2') {
  for (const key of ['STORAGE_ENDPOINT','STORAGE_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','PUBLIC_ASSET_BASE_URL']) if (!env[key]) issues.push(`${key} is required for R2`);
}
const report={version:'1.0.0',checkedAt:new Date().toISOString(),envFile,valid:issues.length===0,issues};
report.checksum=crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
console.log(JSON.stringify(report,null,2));
process.exit(issues.length?1:0);

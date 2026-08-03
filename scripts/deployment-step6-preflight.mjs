import process from "node:process";

const required = [
  "PUBLIC_APP_URL","PUBLIC_API_URL","DATABASE_URL","REDIS_URL","SESSION_SECRET",
  "EXPORT_WORKER_TOKEN","R2_ACCOUNT_ID","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY",
  "R2_BUCKET","STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","STRIPE_PRICE_CREATOR",
  "STRIPE_PRICE_PRO","STRIPE_PRICE_BUSINESS","OPENAI_API_KEY","RESEND_API_KEY",
  "ADMIN_EMAILS","METRICS_TOKEN","LICENSE_SIGNING_SECRET","BACKUP_SIGNING_SECRET"
];
const placeholders = /^(change-me|replace-me|example|todo|your-|<|\$\{)/i;
const issues=[];
for (const key of required) {
  const value=(process.env[key]||"").trim();
  if (!value) issues.push(`${key} is missing`);
  else if (placeholders.test(value)) issues.push(`${key} still contains a placeholder`);
}
for (const key of ["PUBLIC_APP_URL","PUBLIC_API_URL"]) {
  const value=process.env[key]||"";
  if (value && !/^https:\/\//i.test(value)) issues.push(`${key} must use HTTPS`);
}
for (const key of ["SESSION_SECRET","EXPORT_WORKER_TOKEN","METRICS_TOKEN","LICENSE_SIGNING_SECRET","BACKUP_SIGNING_SECRET"]) {
  const value=process.env[key]||"";
  if (value && value.length < 32) issues.push(`${key} must be at least 32 characters`);
}
if ((process.env.NODE_ENV||"") !== "production") issues.push("NODE_ENV must be production");
if ((process.env.STORAGE_DRIVER||"").toLowerCase() !== "r2") issues.push("STORAGE_DRIVER must be r2 for production workers");
if ((process.env.COLLABORATION_STORE||"").toLowerCase() !== "redis") issues.push("COLLABORATION_STORE must be redis for multi-instance production");
const report={ok:issues.length===0, checkedAt:new Date().toISOString(), requiredCount:required.length, issues};
console.log(JSON.stringify(report,null,2));
if (issues.length) process.exit(1);

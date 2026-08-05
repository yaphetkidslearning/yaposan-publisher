import fs from "node:fs";
import path from "node:path";
import { writePhase89Evidence } from "../server/phase89LaunchVerification.mjs";

const root = process.cwd();
const requiredEnv = [
  "DATABASE_URL", "SESSION_SECRET", "STORAGE_ENDPOINT", "STORAGE_BUCKET",
  "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET", "OPENAI_API_KEY", "ADMIN_EMAILS"
];
const placeholder = /(replace|changeme|example|dummy|test-secret|your[_-])/i;
const environment = requiredEnv.map(name => ({
  name,
  present: Boolean(process.env[name]),
  placeholder: Boolean(process.env[name] && placeholder.test(process.env[name])),
}));
const urls = ["PUBLIC_SITE_URL", "APP_SITE_URL", "API_BASE_URL"].map(name => ({
  name,
  value: process.env[name] || "",
  validHttps: /^https:\/\//.test(process.env[name] || ""),
}));
const result = writePhase89Evidence(root, process.env);
const report = { ...result, environment, urls };
const target = path.join(root, "release", "phase89", "production-preflight-report.json");
fs.writeFileSync(target, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, passed: `${report.passedCount}/${report.totalCount}`, report: target }, null, 2));
if (environment.some(item => !item.present || item.placeholder) || urls.some(item => !item.validHttps)) process.exitCode = 2;

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const requiredFiles = [
  "server/index.ts",
  "server/config.ts",
  "server/phase86ReleaseCertification.ts",
  "src/app/index.tsx",
  "src/app/editor.tsx",
  "src/app/sign-in.tsx",
  "src/app/account.tsx",
  "render.yaml",
  "Dockerfile",
];

const requiredEnv = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "STORAGE_DRIVER",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "OPENAI_API_KEY",
  "ADMIN_EMAILS",
];

const missingFiles = requiredFiles.filter((name) => !fs.existsSync(path.join(root, name)));
const missingEnvironment = requiredEnv.filter((name) => !process.env[name]);
const placeholderSecrets = requiredEnv.filter((name) => /^(value|replace|changeme|test)$/i.test(process.env[name] ?? ""));
const versionOk = packageJson.version === "1.0.0";
const sourceHash = crypto.createHash("sha256")
  .update(requiredFiles.filter((name) => fs.existsSync(path.join(root, name))).map((name) => fs.readFileSync(path.join(root, name))).join(""))
  .digest("hex");

const report = {
  schema: "yaposan.phase86.preflight",
  generatedAt: new Date().toISOString(),
  version: packageJson.version,
  versionOk,
  missingFiles,
  missingEnvironment,
  placeholderSecrets,
  sourceHash,
  passed: versionOk && missingFiles.length === 0 && missingEnvironment.length === 0 && placeholderSecrets.length === 0,
};

fs.mkdirSync(path.join(root, "release", "phase86"), { recursive: true });
fs.writeFileSync(path.join(root, "release", "phase86", "preflight-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;

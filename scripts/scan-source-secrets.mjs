import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", ".expo", "dist", "coverage", "web-build"]);
const ignoredFiles = new Set(["package-lock.json"]);
const textExts = new Set([".js", ".cjs", ".mjs", ".ts", ".tsx", ".json", ".md", ".yml", ".yaml", ".toml", ".txt", ".env", ".example", ".sh", ".ps1", ".py", ".html", ".css"]);
const patterns = [
  ["OpenAI-style secret", /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ["Resend secret", /\bre_[A-Za-z0-9_-]{20,}\b/g],
  ["Stripe live secret", /\bsk_live_[A-Za-z0-9]{16,}\b/g],
  ["Stripe webhook secret", /\bwhsec_[A-Za-z0-9]{16,}\b/g],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["Private key block", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory() && ignoredDirs.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const findings = [];
for (const file of walk(root)) {
  if (ignoredFiles.has(path.basename(file))) continue;
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file);
  if (!textExts.has(ext) && !base.startsWith(".env")) continue;
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
  for (const [label, rx] of patterns) {
    rx.lastIndex = 0;
    if (rx.test(text)) findings.push(`${path.relative(root, file)}: ${label}`);
  }
}

if (findings.length) {
  console.error("Potential secrets found in the source tree:");
  for (const finding of findings) console.error(`- ${finding}`);
  console.error("Rotate any real credential before publishing. Do not rely on deleting it from the latest commit; scan Git history too.");
  process.exit(1);
}
console.log("Source-tree secret scan passed. Before making the repository public, also run a full Git-history scan with gitleaks.");

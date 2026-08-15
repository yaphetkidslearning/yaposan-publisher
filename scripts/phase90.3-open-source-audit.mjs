import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

const required = [
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "public/robots.txt",
  "public/sitemap.xml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  "docs/OPEN-SOURCE-SECURITY-CHECKLIST.md",
];

const missing = required.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  console.error("Phase 90.3 missing required files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const layoutPath = join(root, "src/app/_layout.tsx");
const layout = readFileSync(layoutPath, "utf8");
for (const expected of [
  "Yaposan — Creative Design & Publishing Suite",
  'name="description"',
  'rel="canonical"',
  'property="og:title"',
  'type="application/ld+json"',
]) {
  if (!layout.includes(expected)) {
    console.error(`SEO metadata missing from src/app/_layout.tsx: ${expected}`);
    process.exit(1);
  }
}

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".expo",
  "dist",
  "coverage",
]);

const allowedExtensions = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".yml", ".yaml",
  ".md", ".txt", ".env", ".example", ".ps1", ".sh", ".toml",
]);

const suspicious = [
  ["OpenAI key", /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ["Stripe live secret", /\bsk_live_[A-Za-z0-9]{16,}\b/g],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["Database URL with credentials", /\bpostgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/gi],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
];

const findings = [];

function walk(directory) {
  for (const name of readdirSync(directory)) {
    if (ignoredDirectories.has(name)) continue;

    const path = join(directory, name);
    const info = statSync(path);

    if (info.isDirectory()) {
      walk(path);
      continue;
    }

    const rel = relative(root, path).replaceAll("\\\\", "/");
    if (
      rel.endsWith(".zip") ||
      rel.endsWith(".png") ||
      rel.endsWith(".jpg") ||
      rel.endsWith(".jpeg") ||
      rel.endsWith(".gif") ||
      rel.endsWith(".pdf") ||
      rel.endsWith(".docx") ||
      rel.endsWith("package-lock.json")
    ) {
      continue;
    }

    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    if (!allowedExtensions.has(ext) && !name.startsWith(".env")) continue;

    let content;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      continue;
    }

    for (const [label, pattern] of suspicious) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        findings.push(`${label}: ${rel}`);
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error("Potential secrets detected. Review before making the repository public:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Phase 90.3 verification passed.");
console.log("- SEO/community files present");
console.log("- Root metadata present");
console.log("- No high-confidence secret pattern detected in current text files");
console.log("Reminder: this does not replace a full Git-history secret scan.");

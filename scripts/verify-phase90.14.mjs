import { existsSync, readFileSync } from "node:fs";

const required = [
  "src/app/+html.tsx",
  "scripts/postprocess-phase90.14-web-export.mjs",
  "scripts/verify-production.mjs",
  "tests/phase9014-static-seo-production.test.mjs",
  "PHASE90.14-STATIC-SEO-HEAD-AND-PRODUCTION-WEB-STARTUP-REPAIR.md",
  ".gitleaks.toml",
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing Phase 90.14 file: ${file}`);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const script of ["build:web", "check:phase90.14", "test:phase90.14", "verify:phase90.14"]) {
  if (!pkg.scripts?.[script]) throw new Error(`Missing package script: ${script}`);
}
if (!pkg.scripts["build:web"].includes("postprocess-phase90.14-web-export.mjs")) {
  throw new Error("build:web must post-process the Expo static export for Phase 90.14 SEO safety");
}

const htmlSource = readFileSync("src/app/+html.tsx", "utf8");
for (const expected of [
  "Yaposan — Creative Design & Publishing Suite",
  'name="description"',
  'rel="canonical"',
  'property="og:title"',
  'name="twitter:title"',
  'application/ld+json',
]) {
  if (!htmlSource.includes(expected)) throw new Error(`Static HTML metadata missing: ${expected}`);
}

const gitleaks = readFileSync(".gitleaks.toml", "utf8");
if (!gitleaks.includes("useDefault = true")) throw new Error("Phase 90.4 Gitleaks defaults were removed");

if (existsSync("dist/index.html")) {
  const built = readFileSync("dist/index.html", "utf8");
  if (!/<title\b[^>]*>[^<]*Yaposan[^<]*<\/title>/i.test(built)) {
    throw new Error("dist/index.html does not contain a non-empty Yaposan title");
  }
  if (/<title\b[^>]*>\s*<\/title>/i.test(built)) {
    throw new Error("dist/index.html still contains an empty title");
  }
}

console.log("Phase 90.14 static SEO and production web startup repair check passed.");

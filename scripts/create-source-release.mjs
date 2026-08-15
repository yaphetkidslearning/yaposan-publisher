import JSZip from "jszip";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const requestedOutput = process.argv[2] || "Yaposan-source.zip";
const outputPath = resolve(root, requestedOutput);

const EXCLUDED_DIRS = new Set([".git", ".expo", ".turbo", "coverage", "dist", "node_modules"]);
const EXCLUDED_FILE_PATTERNS = [/^\.env(?:\..+)?$/i, /^gitleaks-report(?:[-_.].*)?$/i, /\.log$/i, /\.zip$/i, /^\.DS_Store$/i];
const REQUIRED_ARCHIVE_PATHS = [
  "package.json",
  "package-lock.json",
  ".env.example",
  "LICENSE",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "src/app/_layout.tsx",
  "src/app/+html.tsx",
  "server/database.ts",
  "scripts/create-source-release.mjs",
  "scripts/verify-phase90.17.mjs",
  "scripts/verify-phase90.18.mjs",
  "tests/phase9017-open-source-finalization.test.mjs",
  "tests/phase9018-source-package-integrity.test.mjs",
  "PHASE90.17-OPEN-SOURCE-RELEASE-FINALIZATION.md",
  "PHASE90.18-COMPLETE-SOURCE-AND-RELEASE-FINALIZATION.md",
  "src/app/product-photo-studio.tsx",
  "server/backgroundRemoval.ts",
  "services/background-removal/app.py",
  "services/background-removal/Dockerfile",
  "release/phase90.19/quality-benchmark.json",
  "release/phase90.19/cost-policy.json",
  "release/phase90.19/model-license-review.json",
  "tests/phase9019-product-photo-engine.test.mjs",
  "scripts/verify-phase90.19.mjs",
  "PHASE90.19-YAPOSAN-PRODUCT-PHOTO-ENGINE-AND-QUALITY-BENCHMARK.md",
  "src/components/ProductPhotoMaskTouchup.web.tsx",
  "release/phase91.0/quality-targets.json",
  "release/phase91.0/cost-policy.json",
  "release/phase91.0/organization-pilot.json",
  "release/phase91.0/model-policy.json",
  "tests/phase910-production-product-photo-engine.test.mjs",
  "scripts/verify-phase91.0.mjs",
  "PHASE91.0-PRODUCTION-PRODUCT-PHOTO-ENGINE.md",
  "release/phase91.1/benchmark-schema.json",
  "release/phase91.1/benchmark-template.csv",
  "release/phase91.1/pilot-readiness.json",
  "scripts/evaluate-phase91.1-benchmark.mjs",
  "scripts/verify-phase91.1.mjs",
  "tests/phase911-organization-quality-certification.test.mjs",
  "PHASE91.1-ORGANIZATION-QUALITY-CERTIFICATION-AND-PILOT-READINESS.md",
  "tests/phase912-organization-neutral-product-photo.test.mjs",
  "scripts/verify-phase91.2.mjs",
  "PHASE91.2-ORGANIZATION-NEUTRAL-PRODUCT-PHOTO-PLATFORM.md",
  "release/phase91.3/completeness-policy.json",
  "tests/phase913-complete-product-photo-release.test.mjs",
  "scripts/verify-phase91.3.mjs",
  "PHASE91.3-COMPLETE-PRODUCT-PHOTO-RELEASE-INTEGRITY.md",
  "release/phase91.4/parity-policy.json",
  "release/phase91.4/benchmark-template.csv",
  "scripts/evaluate-phase91.4-parity.mjs",
  "scripts/verify-phase91.4.mjs",
  "tests/phase914-quality-parity-hardening.test.mjs",
  "PHASE91.4-PRODUCT-PHOTO-QUALITY-PARITY-HARDENING.md",
  "release/phase91.5/category-parity-policy.json",
  "release/phase91.5/benchmark-template.csv",
  "scripts/evaluate-phase91.5-category-parity.mjs",
  "scripts/verify-phase91.5.mjs",
  "tests/phase915-advanced-product-photo-parity.test.mjs",
  "PHASE91.5-ADVANCED-PRODUCT-PHOTO-PARITY.md",
  "services/background-removal/Dockerfile.gpu",
  "services/background-removal/requirements-gpu.txt",
  "release/phase91.6/quality-certification-policy.json",
  "release/phase91.6/benchmark-template.csv",
  "scripts/evaluate-phase91.6-quality.mjs",
  "scripts/verify-phase91.6.mjs",
  "tests/phase916-commercial-quality.test.mjs",
  "PHASE91.6-COMMERCIAL-PRODUCT-PHOTO-QUALITY.md",
  "release/phase91.7/pure-white-batch-policy.json",
  "release/phase91.7/white-background-certification.md",
  "scripts/verify-phase91.7.mjs",
  "tests/phase917-pure-white-batch.test.mjs",
  "PHASE91.7-PURE-WHITE-LARGE-BATCH-PRODUCT-PHOTO.md",
  "server/productPhotoBatches.ts",
  "server/productPhotoBatchWorker.ts",
  "release/phase91.8/batch-reliability-policy.json",
  "release/phase91.8/production-test-plan.md",
  "release/phase91.8/known-limitations.md",
  "scripts/verify-phase91.8.mjs",
  "tests/phase918-batch-reliability-pure-white.test.mjs",
  "PHASE91.8-BATCH-RELIABILITY-AND-PURE-WHITE-PRODUCTION.md"
];

function normalizedRelativePath(path) {
  return relative(root, path).split(sep).join("/");
}

function shouldExcludeFile(relPath) {
  const name = basename(relPath);
  if (/^\.env(?:\..+)?\.example$/i.test(name) || /^\.env\.example$/i.test(name)) return false;
  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(name));
}

async function addTree(zip, absoluteDir) {
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const absolutePath = resolve(absoluteDir, entry.name);
    const relPath = normalizedRelativePath(absolutePath);
    if (absolutePath === outputPath) continue;
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      await addTree(zip, absolutePath);
      continue;
    }
    if (!entry.isFile() || shouldExcludeFile(relPath)) continue;
    const stat = await lstat(absolutePath);
    zip.file(relPath, await readFile(absolutePath), { date: stat.mtime, unixPermissions: stat.mode & 0o777 });
  }
}

const zip = new JSZip();
await addTree(zip, root);
for (const required of REQUIRED_ARCHIVE_PATHS) {
  if (!zip.file(required)) throw new Error(`Refusing incomplete source archive: missing ${required}`);
}

for (const path of Object.keys(zip.files)) {
  const parts = path.split("/");
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) throw new Error(`Excluded directory leaked into archive: ${path}`);
  if (shouldExcludeFile(path)) throw new Error(`Excluded file leaked into archive: ${path}`);
}

const payload = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 }, platform: "UNIX" });
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, payload);

const verified = await JSZip.loadAsync(payload);
for (const required of REQUIRED_ARCHIVE_PATHS) {
  if (!verified.file(required)) throw new Error(`Generated archive verification failed: missing ${required}`);
}

console.log(`Created ${normalizedRelativePath(outputPath) || basename(outputPath)} (${(payload.length / 1024 / 1024).toFixed(2)} MiB) with complete source-tree integrity checks.`);

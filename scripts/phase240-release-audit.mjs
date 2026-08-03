import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const required = [
  "src/utils/platformReleaseCertificationEngine.ts",
  "src/components/publisher/PlatformReleaseCertificationModal.tsx",
  "tests/phase240-final-platform-release.test.mjs",
  "PHASE24.0-FINAL-PLATFORM-COMPLETION-AND-RELEASE-CERTIFICATION.md",
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const failures = [];
if (missing.length) failures.push(`Missing required files: ${missing.join(", ")}`);
if (pkg.version !== "24.0.0") failures.push(`Expected package version 24.0.0, found ${pkg.version}`);
for (const script of ["test:phase24", "audit:phase24", "release:manifest", "verify:phase24"]) if (!pkg.scripts?.[script]) failures.push(`Missing npm script ${script}`);
const sourceRoots = ["src", "tests", "scripts"];
const forbidden = /\b(TODO|FIXME|NOT IMPLEMENTED)\b/i;
for (const dir of sourceRoots) {
  const walk = (folder) => { for (const entry of fs.readdirSync(folder, { withFileTypes: true })) { const full = path.join(folder, entry.name); if (entry.isDirectory()) walk(full); else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) { const text = fs.readFileSync(full, "utf8"); if (forbidden.test(text) && !full.endsWith("phase240-release-audit.mjs") && !full.endsWith("phase235-production-audit.mjs")) failures.push(`Unfinished marker in ${path.relative(root, full)}`); } } };
  walk(path.join(root, dir));
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Phase 24 release audit passed: files, scripts, version, and unfinished-marker checks are clean.");

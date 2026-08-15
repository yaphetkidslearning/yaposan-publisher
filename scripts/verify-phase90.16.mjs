import { existsSync, readFileSync } from "node:fs";

const required = [
  "src/app/+html.tsx",
  "src/app/accessibility.tsx",
  "src/global.css",
  "release/phase90.16/browser-accessibility-evidence.json",
  "tests/phase9016-accessibility-browser-readiness.test.mjs",
  "PHASE90.16-ACCESSIBILITY-AND-BROWSER-READINESS.md",
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing Phase 90.16 file: ${file}`);
}

const html = readFileSync("src/app/+html.tsx", "utf8");
if (!/<html\s+lang=["']en["']/.test(html)) throw new Error("Document language must remain declared as English");

const accessibility = readFileSync("src/app/accessibility.tsx", "utf8");
if (!/accessibilityRole=["']main["']/.test(accessibility)) throw new Error("Accessibility route needs a main landmark");
if (!/nativeID=["']main-content["']/.test(accessibility)) throw new Error("Accessibility route needs a stable main-content target");
if (!/accessibilityLabel=["']Open Yaposan Help center["']/.test(accessibility)) throw new Error("Accessibility Help link needs a descriptive accessible label");

const css = readFileSync("src/global.css", "utf8");
for (const pattern of [/:focus-visible/, /prefers-reduced-motion:\s*reduce/, /forced-colors:\s*active/]) {
  if (!pattern.test(css)) throw new Error(`Missing accessibility CSS safeguard: ${pattern}`);
}

const evidence = JSON.parse(readFileSync("release/phase90.16/browser-accessibility-evidence.json", "utf8"));
if (evidence.certificationStatus !== "EXTERNAL_EVIDENCE_REQUIRED") {
  throw new Error("Phase 90.16 must not self-certify manual browser/WCAG evidence");
}
const manualGroups = [evidence.manualAccessibilityEvidence, evidence.browserMatrixEvidence];
if (manualGroups.some((group) => Object.values(group ?? {}).some((value) => value !== false))) {
  throw new Error("Manual evidence template must ship unclaimed; complete it only from real test evidence");
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (!pkg.scripts?.test?.includes("test:phase90.16")) throw new Error("Top-level npm test must include Phase 90.16");
if (!pkg.scripts?.["verify:phase90.16"]?.includes("build:web")) throw new Error("Phase 90.16 verification must include a production web export");
if (!pkg.scripts?.["verify:phase90.16"]?.includes("check:phase90.15")) throw new Error("Phase 90.16 verification must retain Phase 90.15 hydration checks");

console.log("Phase 90.16 accessibility/browser-readiness automated baseline passed; external WCAG/browser evidence remains required.");

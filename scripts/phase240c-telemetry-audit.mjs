import fs from "node:fs";
const required=["src/utils/telemetryDiagnosticsEngine.ts","src/components/publisher/TelemetryDiagnosticsCenterModal.tsx","desktop/main.cjs","desktop/preload.cjs","tests/phase240c-telemetry-diagnostics.test.mjs","PHASE24.0C-OPTIONAL-TELEMETRY-AND-DIAGNOSTICS.md"];
const missing=required.filter((file)=>!fs.existsSync(file));
if(missing.length){console.error("Phase 24.0C audit failed. Missing:",missing.join(", "));process.exit(1);}
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
if(pkg.version!=="24.0.3") throw new Error(`Expected version 24.0.3, received ${pkg.version}`);
for(const script of ["test:phase24.0c","audit:phase24.0c","verify:phase24.0c"]) if(!pkg.scripts?.[script]) throw new Error(`Missing script ${script}`);
const main=fs.readFileSync("desktop/main.cjs","utf8");
if(!main.includes("enabled:false")||!main.includes("telemetryAllowed")) throw new Error("Telemetry is not private-by-default.");
console.log("Phase 24.0C telemetry and diagnostics audit passed");

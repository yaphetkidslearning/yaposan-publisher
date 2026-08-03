import fs from "node:fs";
import assert from "node:assert/strict";
const home=fs.readFileSync("src/app/index.tsx","utf8");
assert.match(home,/hero-phase25\.42\.6\.png/);
assert.match(home,/height: 338/);
assert.match(home,/heroPromptShell/);
for (const file of ["src/utils/projectProfessionalManager.ts","src/utils/prepressEngine.ts","src/utils/projectPhase8DManager.ts"]) {
  const source=fs.readFileSync(file,"utf8");
  assert.match(source,/typeof .*fontFamily === "string"/);
}
console.log("Phase 25.42.6 checks passed");

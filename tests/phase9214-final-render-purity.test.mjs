import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const modal=read("src/components/publisher/CommercialReleaseCompletionModal.tsx");
const pkg=JSON.parse(read("package.json"));
const phase=read("release/CURRENT_CREATIVE_PLATFORM_PHASE").trim();

test("92.14 baseline remains valid in later releases",()=>{
  assert.ok(Number(pkg.version.split(".")[0]) > 92 || (Number(pkg.version.split(".")[0]) === 92 && Number(pkg.version.split(".")[1]) >= 14));
  assert.equal(phase,pkg.version);
  assert.ok(pkg.scripts["verify:phase92.14"]);
});

test("commercial release modal uses a render-safe stable device id",()=>{
  assert.match(modal,/useId/);
  assert.match(modal,/const deviceId = `device-\$\{reactDeviceId/);
  assert.doesNotMatch(modal,/useState\(\(\) => `device-\$\{Math\.random/);
});

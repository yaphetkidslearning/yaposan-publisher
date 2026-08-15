import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const index = fs.readFileSync(new URL("../server/index.ts", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../server/productPhotoBatchWorker.ts", import.meta.url), "utf8");
const engine = fs.readFileSync(new URL("../src/services/creativeCreationEngine.ts", import.meta.url), "utf8");
const orchestrator = fs.readFileSync(new URL("../src/services/creativeOrchestrator.ts", import.meta.url), "utf8");
const platform = fs.readFileSync(new URL("../src/services/phase9110CreationPlatform.ts", import.meta.url), "utf8");
const aiScreen = fs.readFileSync(new URL("../src/app/ai.tsx", import.meta.url), "utf8");

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test("refresh route no longer contains a Product Photo worker route", () => {
  const start = index.indexOf('/api/v1/auth/refresh');
  const end = index.indexOf('/api/v1/webhooks/stripe', start);
  const refreshRegion = index.slice(start, end);
  assert.equal(refreshRegion.includes('/api/v1/internal/product-photo/process-next'), false);
  assert.equal(count(index, '/api/v1/internal/product-photo/process-next'), 1);
});

test("Product Photo worker uses main instead of top-level await", () => {
  assert.match(worker, /async function main\(\)/);
  assert.match(worker, /main\(\)\.catch/);
  const beforeMain = worker.slice(0, worker.indexOf("async function main"));
  assert.equal(/\bawait\b/.test(beforeMain), false);
});

test("91.11 universal creation coverage remains connected", () => {
  for (const kind of ["design","image","video","website","presentation","document","social","marketing","audio","app","automation"]) {
    assert.match(engine, new RegExp(`kind:\\"${kind}\\"`));
  }
  assert.match(orchestrator, /options\.generate/);
  assert.match(orchestrator, /generated/);
  assert.match(platform, /resolveCreationAction/);
  assert.match(platform, /createAgentWorkflow/);
  assert.match(platform, /Role-based permissions/);
  assert.match(aiScreen, /Automation/);
  assert.match(aiScreen, /runResultAction/);
  assert.match(aiScreen, /\/api\/v1\/ai\/generate/);
});

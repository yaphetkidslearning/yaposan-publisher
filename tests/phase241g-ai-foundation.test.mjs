import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Phase 24.1G AI provider foundation is installed", () => {
  const provider = fs.readFileSync("src/ai/providerManager.ts", "utf8");
  const settings = fs.readFileSync("src/app/ai-provider-settings.tsx", "utf8");
  const workspace = fs.readFileSync("src/app/ai-workspace.tsx", "utf8");
  assert.match(provider, /OpenAI/);
  assert.match(provider, /Google Gemini/);
  assert.match(provider, /Anthropic Claude/);
  assert.match(provider, /localFallback/);
  assert.match(settings, /Usage dashboard/);
  assert.match(workspace, /generateWithProvider/);
});

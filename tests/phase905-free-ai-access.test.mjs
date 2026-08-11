import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const home=fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url),"utf8");
const account=fs.readFileSync(new URL("../src/app/account.tsx", import.meta.url),"utf8");
const access=fs.readFileSync(new URL("../src/components/ai/AIAccessManager.tsx", import.meta.url),"utf8");

test("Phase 90.5 replaces subscription pricing on the home screen",()=>{
  assert.match(home,/Choose how you use AI/);
  for(const value of ["Yaposan Local","Community AI","Use My AI Provider","Yaposan AI Credits","Pay provider directly","Pay as you go"]) assert.ok(home.includes(value),value);
  for(const old of ["$9.99/month","$19.99/month","$39.99/month","Choose a plan"]) assert.equal(home.includes(old),false,old);
});

test("Phase 90.5 makes BYO provider the recommended path",()=>{
  assert.match(home,/Use My AI Provider[\s\S]*featured: true/);
  assert.match(home,/Yaposan adds no subscription fee/);
  assert.match(home,/shared monthly budget/);
});

test("Account exposes AI access and prepaid credits instead of subscription selection",()=>{
  assert.ok(account.includes("AIAccessManager"));
  assert.ok(account.includes("AI Access"));
  assert.ok(account.includes("AI Credits"));
  assert.equal(account.includes("<BillingManager/>"),false);
  for(const value of ["$2","$5","$10","OpenAI","Gemini","Anthropic","Ollama","LM Studio"]) assert.ok(access.includes(value),value);
});

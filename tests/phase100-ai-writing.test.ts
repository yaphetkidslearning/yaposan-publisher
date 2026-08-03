import assert from "node:assert/strict";
import test from "node:test";
import { runAiWriting } from "../src/services/aiService";

test("grammar correction normalizes capitalization and punctuation", async () => {
  assert.equal(await runAiWriting({ action: "grammar", text: "i am ready" }), "I am ready.");
});

test("headline generator returns title case", async () => {
  assert.equal(await runAiWriting({ action: "headline", text: "summer community festival" }), "Summer Community Festival");
});

test("bullet generator creates usable bullet text", async () => {
  const result = await runAiWriting({ action: "bullets", text: "Quality, value, community" });
  assert.match(result, /• Quality/);
  assert.match(result, /• value/);
});

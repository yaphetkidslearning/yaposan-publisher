import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRESS_PROFILES2, buildPrepressWorkflow2, buildProofPlan2, buildSeparationPlates2, buildTrapPlan2, certifyPrepress2, inspectPrepressDocument2, normalizePressProfile2 } from "../src/utils/professionalPrepressEngine2.ts";

const document: any = {
  id: "doc-65",
  title: "Packaging Sleeve",
  outputIntent: "FOGRA39",
  colorants: [{ name: "Brand Orange", type: "spot" }],
  pages: [{
    id: "p1", number: 1, width: 612, height: 792,
    bleed: { top: 9, right: 9, bottom: 9, left: 9 }, safeMargin: 18,
    objects: [
      { id: "headline", pageId: "p1", kind: "text", bounds: { x: 30, y: 30, width: 200, height: 40 }, fill: { colorants: { K: 100 }, overprint: true }, text: { fontFamily: "Inter", fontSize: 24, embedded: true } },
      { id: "photo", pageId: "p1", kind: "image", bounds: { x: 30, y: 100, width: 300, height: 200 }, image: { dpi: 300, effectiveDpi: 300, colorSpace: "cmyk", embeddedProfile: true } },
      { id: "brand", pageId: "p1", kind: "vector", bounds: { x: 360, y: 100, width: 120, height: 120 }, fill: { colorants: { "Brand Orange": 100 } }, stroke: { colorants: { K: 100 }, width: 0.5 } },
    ],
  }],
};

test("Phase 65 normalizes press profiles", () => {
  const profile = normalizePressProfile2({ id: " custom ", name: " Custom ", process: "offset", maxTotalInk: 999, minImageDpi: 2, minLineWidth: 0 });
  assert.equal(profile.id, "custom");
  assert.equal(profile.maxTotalInk, 400);
  assert.equal(profile.minImageDpi, 72);
  assert.equal(profile.minLineWidth, 0.05);
});

test("Phase 65 inspects press readiness and catches production errors", () => {
  const bad: any = JSON.parse(JSON.stringify(document));
  bad.outputIntent = undefined;
  bad.pages[0].objects.push({ id: "bad", pageId: "p1", kind: "text", bounds: { x: 2, y: 2, width: 90, height: 20 }, fill: { colorants: { C: 100, M: 100, Y: 100, K: 100 }, overprint: true, knockout: true }, stroke: { colorants: { K: 100 }, width: 0.1 }, text: { fontFamily: "Locked", fontSize: 8, embedded: false, restricted: true }, transparency: { opacity: 0.5, flattened: false } });
  const issues = inspectPrepressDocument2(bad, DEFAULT_PRESS_PROFILES2[2]);
  assert.ok(issues.some(i => i.code === "MISSING_OUTPUT_INTENT"));
  assert.ok(issues.some(i => i.code === "TOTAL_INK_LIMIT"));
  assert.ok(issues.some(i => i.code === "HAIRLINE"));
  assert.ok(issues.some(i => i.code === "RESTRICTED_FONT"));
  assert.ok(issues.some(i => i.code === "UNFLATTENED_TRANSPARENCY"));
  assert.ok(issues.some(i => i.code === "OVERPRINT_KNOCKOUT_CONFLICT"));
});

test("Phase 65 creates trapping and separation plans", () => {
  const traps = buildTrapPlan2(document, DEFAULT_PRESS_PROFILES2[0]);
  assert.equal(traps.length, 3);
  assert.equal(traps.find(t => t.objectId === "headline")?.mode, "none");
  assert.equal(traps.find(t => t.objectId === "brand")?.mode, "spread");
  const plates = buildSeparationPlates2(document);
  assert.deepEqual(plates.map(p => p.name), ["Brand Orange", "K"]);
  assert.ok(plates.find(p => p.name === "K")?.overprintObjectIds.includes("headline"));
});

test("Phase 65 builds proof workflows and deterministic certificates", () => {
  const proof = buildProofPlan2(document, DEFAULT_PRESS_PROFILES2[0]);
  assert.equal(proof.version, "65.0");
  assert.equal(proof.ready, true);
  const workflow = buildPrepressWorkflow2(document, DEFAULT_PRESS_PROFILES2[0]);
  assert.equal(workflow.pipeline.at(-1), "production-certification");
  assert.equal(workflow.ready, true);
  const date = "2026-07-31T22:30:00.000Z";
  const first = certifyPrepress2(document, DEFAULT_PRESS_PROFILES2[0], date);
  const second = certifyPrepress2(document, DEFAULT_PRESS_PROFILES2[0], date);
  assert.equal(first.passed, true);
  assert.equal(first.checksum, second.checksum);
  assert.equal(first.version, "65.0");
});

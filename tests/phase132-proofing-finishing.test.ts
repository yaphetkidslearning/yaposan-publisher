import assert from "node:assert/strict";
import test from "node:test";

import type { PublisherProject } from "../src/types/publisher";
import { analyzeFinishing, analyzeSoftProof, buildImpositionSheets, getPrepressSettings, runPrepress, updatePrepressSettings } from "../src/utils/prepressEngine";

const project: PublisherProject = {
  id: "phase132", name: "Phase 13.2 Test", createdAt: 1, updatedAt: 1, activePageId: "p1", colorMode: "CMYK", autoSave: false, version: 2,
  pages: [{ id: "p1", name: "Page 1", width: 300, height: 400, orientation: "portrait", sizeKey: "custom", backgroundColor: "#ffffff", margin: 20, bleed: 9,
    elements: [
      { id: "e1", name: "CutContour Dieline", type: "line", x: 0, y: 0, width: 200, height: 0, rotation: 0, zIndex: 1, opacity: 1, borderColor: "#ff00ff" },
      { id: "e2", name: "Fold Guide", type: "line", x: 150, y: 0, width: 0, height: 400, rotation: 0, zIndex: 2, opacity: 1, borderColor: "#00ffff" },
      { id: "e3", name: "Neon Red", type: "rectangle", x: 20, y: 20, width: 80, height: 80, rotation: 0, zIndex: 3, opacity: 1, fillColor: "#ff0000" },
    ] }],
};

test("soft proof reports active mode and saturated press colors", () => {
  const settings = { ...getPrepressSettings(project), proofMode: "gamut" as const, activeProofPlate: "Magenta" as const, outputProfile: "FOGRA39" as const };
  const proof = analyzeSoftProof(project, settings);
  assert.equal(proof.mode, "gamut");
  assert.equal(proof.activePlate, "Magenta");
  assert.ok(proof.outOfGamutColors >= 1);
});

test("finishing analysis detects dielines and fold guides", () => {
  const summary = analyzeFinishing(project);
  assert.equal(summary.dielineObjects, 1);
  assert.equal(summary.foldObjects, 1);
});

test("imposition sheets include positioned slots", () => {
  const configured = updatePrepressSettings(project, { imposition: "two-up", gutter: 12 });
  const sheets = buildImpositionSheets(configured);
  assert.equal(sheets.length, 1);
  assert.equal(sheets[0].slots.length, 2);
  assert.equal(sheets[0].slots[1].x, 312);
});

test("phase 13.2 settings persist", () => {
  const configured = updatePrepressSettings(project, { proofMode: "overprint", finishingOperations: ["die-cut", "foil"], dielineRequired: true });
  const settings = getPrepressSettings(configured);
  assert.equal(settings.proofMode, "overprint");
  assert.deepEqual(settings.finishingOperations, ["die-cut", "foil"]);
  assert.equal(settings.dielineRequired, true);
});

test("preflight warns about missing finishing guides", () => {
  const noGuides = { ...project, pages: [{ ...project.pages[0], elements: project.pages[0].elements.filter((element) => element.id === "e3") }] };
  const configured = updatePrepressSettings(noGuides, { dielineRequired: true, finishingOperations: ["fold", "perforate"] });
  const codes = new Set(runPrepress(configured).issues.map((item) => item.code));
  assert.ok(codes.has("MISSING_DIELINE"));
  assert.ok(codes.has("MISSING_FOLD_GUIDE"));
  assert.ok(codes.has("MISSING_PERFORATION"));
});

test("manifest and report contain phase 13.2 production data", () => {
  const configured = updatePrepressSettings(project, { finishingOperations: ["die-cut"], proofMode: "separation" });
  const report = runPrepress(configured);
  assert.deepEqual(report.manifest.finishing, ["die-cut"]);
  assert.equal(report.manifest.proofMode, "separation");
  assert.equal(report.finishing.dielineObjects, 1);
  assert.ok(report.impositionSheets.length >= 1);
});

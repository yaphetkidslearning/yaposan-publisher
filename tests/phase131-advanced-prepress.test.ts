import assert from "node:assert/strict";
import test from "node:test";

import type { PublisherProject } from "../src/types/publisher";
import {
  analyzeInkCoverage,
  buildColorSeparations,
  buildProductionManifest,
  getPrepressSettings,
  hexToCmyk,
  runPrepress,
  updatePrepressSettings,
} from "../src/utils/prepressEngine";

const project: PublisherProject = {
  id: "phase131",
  name: "Phase 13.1 Test",
  createdAt: 1,
  updatedAt: 1,
  activePageId: "p1",
  colorMode: "CMYK",
  autoSave: false,
  version: 2,
  pages: [{
    id: "p1",
    name: "Page 1",
    width: 612,
    height: 792,
    orientation: "portrait",
    sizeKey: "letter",
    backgroundColor: "#ffffff",
    margin: 36,
    bleed: 9,
    elements: [
      { id: "e1", name: "Cyan Box", type: "rectangle", x: 10, y: 10, width: 100, height: 100, rotation: 0, zIndex: 1, opacity: 1, fillColor: "#00ffff" },
      { id: "e2", name: "Black Text", type: "text", x: 30, y: 30, width: 200, height: 30, rotation: 0, zIndex: 2, opacity: 1, text: "Hello", textColor: "#000000", fontFamily: "Arial" },
      { id: "e3", name: "Image", type: "image", x: 50, y: 50, width: 100, height: 100, rotation: 0, zIndex: 3, opacity: 1, imageUri: "asset://photo.jpg" },
    ],
  }],
};

test("hex colors convert to process CMYK", () => {
  assert.deepEqual(hexToCmyk("#00ffff"), { c: 100, m: 0, y: 0, k: 0 });
  assert.deepEqual(hexToCmyk("#000000"), { c: 0, m: 0, y: 0, k: 100 });
  assert.equal(hexToCmyk("transparent"), null);
});

test("color separations identify used process plates", () => {
  const plates = buildColorSeparations(project);
  assert.equal(plates.find((plate) => plate.name === "Cyan")?.used, true);
  assert.equal(plates.find((plate) => plate.name === "Black")?.used, true);
  assert.equal(plates.find((plate) => plate.name === "Magenta")?.used, false);
});

test("ink coverage reports sampled colors and limits", () => {
  const settings = { ...getPrepressSettings(project), inkLimit: 90 };
  const result = analyzeInkCoverage(project, settings);
  assert.ok(result.sampledObjects >= 2);
  assert.ok(result.objectsOverLimit >= 2);
});

test("advanced prepress settings persist on the project", () => {
  const next = updatePrepressSettings(project, { trapping: true, trapWidth: 0.35, includeSlug: true, generateSeparations: true });
  const settings = getPrepressSettings(next);
  assert.equal(settings.trapping, true);
  assert.equal(settings.trapWidth, 0.35);
  assert.equal(settings.includeSlug, true);
});

test("preflight adds separation, ink, slug, and trapping diagnostics", () => {
  const configured = updatePrepressSettings(project, { inkLimit: 90, trapping: true, trapWidth: 3, includeSlug: true, slugSize: 8, generateSeparations: true, convertToCmyk: false });
  const report = runPrepress(configured);
  const codes = new Set(report.issues.map((item) => item.code));
  assert.ok(codes.has("INK_COVERAGE_EXCEEDED"));
  assert.ok(codes.has("INVALID_TRAP_WIDTH"));
  assert.ok(codes.has("SLUG_TOO_SMALL"));
  assert.ok(codes.has("SEPARATIONS_RGB_OUTPUT"));
});

test("production manifest records plates, fonts, images, and marks", () => {
  const settings = { ...getPrepressSettings(project), cropMarks: true, includeSlug: true };
  const report = runPrepress(project, settings);
  const manifest = buildProductionManifest(project, settings, { ready: report.ready, imposedSlots: report.imposedSlots, separations: report.separations });
  assert.ok(manifest.plates.includes("Cyan"));
  assert.ok(manifest.fonts.includes("Arial"));
  assert.ok(manifest.linkedImages.includes("asset://photo.jpg"));
  assert.ok(manifest.marks.includes("Crop marks"));
  assert.ok(manifest.marks.includes("Slug area"));
});

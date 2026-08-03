import assert from "node:assert/strict";
import test from "node:test";

import type { PublisherProject } from "../src/types/publisher";
import { applyPrintPreset, buildBookletImposition, buildNUpImposition, getPrepressSettings, runPrepress, updatePrepressSettings } from "../src/utils/prepressEngine";

function project(pageCount = 3): PublisherProject {
  return {
    id: "p", name: "Print Test", createdAt: 1, updatedAt: 1, activePageId: "page-1", autoSave: true, version: 2, colorMode: "RGB",
    pages: Array.from({ length: pageCount }, (_, i) => ({
      id: `page-${i + 1}`, name: `Page ${i + 1}`, width: 816, height: 1056, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 48, bleed: 0,
      elements: i === 0 ? [{ id: "text-1", name: "Headline", type: "text", x: 20, y: 20, width: 300, height: 80, rotation: 0, zIndex: 1, opacity: 1, text: "Hello", fontFamily: "Custom Font", oversetText: true }] : [],
    })),
  };
}

test("prepress settings normalize and update", () => {
  const base = project();
  assert.equal(getPrepressSettings(base).pdfStandard, "PDF/X-4");
  const next = updatePrepressSettings(base, { cropMarks: false, inkLimit: 280 });
  assert.equal(next.prepressSettings?.cropMarks, false);
  assert.equal(next.prepressSettings?.inkLimit, 280);
});

test("commercial preset enables production settings", () => {
  const next = applyPrintPreset(project(), "commercial");
  assert.equal(next.prepressSettings?.convertToCmyk, true);
  assert.equal(next.prepressSettings?.cropMarks, true);
  assert.equal(next.prepressSettings?.pdfStandard, "PDF/X-4");
});

test("booklet imposition pads and orders pages", () => {
  const slots = buildBookletImposition(6, 8, "left");
  assert.equal(slots.length, 8);
  assert.deepEqual(slots.slice(0, 4).map((slot) => slot.pageNumber), [null, 1, 2, null]);
  assert.equal(slots.filter((slot) => slot.pageNumber === null).length, 2);
});

test("N-up imposition creates correct slots", () => {
  const slots = buildNUpImposition(5, "four-up");
  assert.equal(slots.length, 8);
  assert.equal(slots[4].sheet, 2);
  assert.equal(slots[4].pageNumber, 5);
});

test("preflight reports production blockers", () => {
  const report = runPrepress(project(), { ...getPrepressSettings(project()), pdfStandard: "PDF/X-1a", flattenTransparency: false });
  assert.equal(report.ready, false);
  assert.ok(report.issues.some((item) => item.code === "MISSING_DOCUMENT_BLEED"));
  assert.ok(report.issues.some((item) => item.code === "FONT_NOT_EMBEDDED"));
  assert.ok(report.issues.some((item) => item.code === "OVERSET_TEXT"));
  assert.ok(report.issues.some((item) => item.code === "PDFX1A_TRANSPARENCY"));
});

test("booklet preset creates imposed production report", () => {
  const configured = applyPrintPreset(project(5), "booklet");
  const report = runPrepress(configured);
  assert.equal(configured.prepressSettings?.imposition, "booklet");
  assert.equal(report.imposedSlots.length, 16);
  assert.ok(report.issues.some((item) => item.code === "BOOKLET_BLANKS"));
});

import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherProject } from "../src/types/publisher";
import { addEmbeddedFont, allProjectFonts, fontFallback, fontUsage, isFontKnown, removeEmbeddedFont, searchFonts } from "../src/utils/typographyManager";

const project: PublisherProject = {
  id: "typography-test", name: "Typography", createdAt: 1, updatedAt: 1, activePageId: "page-1", autoSave: true, version: 2,
  pages: [{ id: "page-1", name: "Page 1", width: 800, height: 1000, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 20, bleed: 0,
    elements: [
      { id: "t1", name: "Heading", type: "text", x: 0, y: 0, width: 300, height: 80, rotation: 0, zIndex: 1, opacity: 1, text: "Heading", fontFamily: "Georgia", fontSize: 32 },
      { id: "t2", name: "Body", type: "text", x: 0, y: 100, width: 300, height: 80, rotation: 0, zIndex: 2, opacity: 1, text: "Body", fontFamily: "Arial", fontSize: 14 },
      { id: "t3", name: "Body 2", type: "text", x: 0, y: 200, width: 300, height: 80, rotation: 0, zIndex: 3, opacity: 1, text: "Body", fontFamily: "Arial", fontSize: 14 },
    ] }],
};

test("font catalog supports search and categories", () => {
  assert.ok(searchFonts(project, "arial").some((font) => font.family === "Arial"));
  assert.ok(searchFonts(project, "", "Serif").every((font) => font.category === "Serif"));
});

test("font usage counts publication text accurately", () => {
  const usage = fontUsage(project);
  assert.equal(usage.get("Arial"), 2);
  assert.equal(usage.get("Georgia"), 1);
});

test("custom fonts embed into and remove from project data", () => {
  const embedded = addEmbeddedFont(project, "Yaposan Sans", "data:font/ttf;base64,AAAA");
  assert.equal(embedded.embeddedFonts?.["Yaposan Sans"], "data:font/ttf;base64,AAAA");
  assert.ok(allProjectFonts(embedded).some((font) => font.family === "Yaposan Sans" && font.category === "Custom"));
  assert.equal(isFontKnown(embedded, "Yaposan Sans"), true);
  const removed = removeEmbeddedFont(embedded, "Yaposan Sans");
  assert.equal(removed.embeddedFonts?.["Yaposan Sans"], undefined);
});

test("font fallback remains deterministic", () => {
  assert.match(fontFallback("Georgia"), /serif/);
  assert.equal(fontFallback("Unknown Family"), "Arial, sans-serif");
});

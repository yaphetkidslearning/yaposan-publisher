import assert from "node:assert/strict";
import test from "node:test";
import { addBookChapter, addIndexEntry, addPublishingNote, buildOpenTypeFeatureString, composeText, createDesktopPublishingDocument, generateIndex, generateTableOfContents, hyphenateWord } from "../src/utils/professionalDesktopPublishingEngine";

test("Phase 25.1 composes publication text with production metrics", () => {
  const doc = createDesktopPublishingDocument("Book");
  const report = composeText("Professional publishing composition provides balanced typography across multiple paragraphs.\n\nSecond paragraph.", doc.settings, 28);
  assert.ok(report.lines.length > 2);
  assert.equal(report.paragraphs, 2);
  assert.ok(report.words >= 10);
});

test("Phase 25.1 manages notes, chapters, TOC and index", () => {
  let doc = createDesktopPublishingDocument("Book");
  doc = addPublishingNote(doc, "footnote", "Source note");
  doc = addBookChapter(doc, "Introduction", 1, 4);
  doc = addIndexEntry(doc, "Typography", 3);
  assert.equal(doc.notes.length, 1);
  assert.match(generateTableOfContents(doc), /Introduction/);
  assert.match(generateIndex(doc), /Typography, 3/);
});

test("Phase 25.1 exposes hyphenation and OpenType settings", () => {
  const doc = createDesktopPublishingDocument();
  assert.ok(hyphenateWord("typography", doc.settings.hyphenation).length >= 1);
  assert.match(buildOpenTypeFeatureString(doc.settings.openType), /liga/);
});

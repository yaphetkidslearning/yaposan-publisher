import test from "node:test";
import assert from "node:assert/strict";
import { applyMergeRecord, extractMergeFields, mergeToken, parseMergeCsv, resolveMergeText } from "../src/services/mergeFieldService";
import type { PublisherProject } from "../src/types/publisher";

const project: PublisherProject = {
  id: "p", name: "Summer Flyer", createdAt: 1, updatedAt: 1, activePageId: "page-1", autoSave: true, version: 2,
  mergeData: { variables: { city: "Baltimore" }, records: [{ id: "r1", name: "Jane", values: { name: "Jane", company: "Yaposan" } }] },
  pages: [{ id: "page-1", name: "Page 1", width: 100, height: 100, orientation: "portrait", sizeKey: "custom", backgroundColor: "#fff", margin: 0, bleed: 0,
    elements: [{ id: "t", name: "Text", type: "text", x: 0, y: 0, width: 50, height: 20, rotation: 0, zIndex: 1, opacity: 1, text: "Hello {{name}} from {{city}}. Page {{page}} of {{pages}}.", fontFamily: "Arial", fontSize: 12 }]
  }]
};

test("normalizes merge tokens and extracts unique fields", () => {
  assert.equal(mergeToken("Full Name"), "{{full_name}}");
  assert.deepEqual(extractMergeFields("{{name}} {{ company }} {{name}}"), ["name", "company"]);
});

test("parses quoted CSV records", () => {
  const records = parseMergeCsv('name,company,note\nJane,Yaposan,"Hello, world"\nJohn,Goodwill,Welcome');
  assert.equal(records.length, 2);
  assert.equal(records[0].values.note, "Hello, world");
  assert.equal(records[1].values.company, "Goodwill");
});

test("resolves record, project variable, and dynamic page fields", () => {
  const page = project.pages[0];
  const result = resolveMergeText(page.elements[0].text ?? "", { project, page, record: project.mergeData?.records[0], now: new Date("2026-07-20T12:00:00") });
  assert.equal(result, "Hello Jane from Baltimore. Page 1 of 1.");
});

test("applies merge values across document text while preserving source project", () => {
  const merged = applyMergeRecord(project, project.mergeData?.records[0], 0);
  assert.equal(merged.pages[0].elements[0].text, "Hello Jane from Baltimore. Page 1 of 1.");
  assert.match(project.pages[0].elements[0].text ?? "", /{{name}}/);
});

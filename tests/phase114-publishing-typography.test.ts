import test from "node:test";
import assert from "node:assert/strict";
import type { PublisherElement, PublisherProject } from "../src/types/publisher";
import { autoCreateLinkedFrame, createTextThread, estimateTextCapacity, flowThreadText, hasOversetText, normalizePublishingTypography, openTypeFeatureSettings, publishingTypographyIssues, unlinkTextFrame } from "../src/utils/professionalPublishingTypography";

const text = (id: string, value = "Hello world"): PublisherElement => ({ id, name: `Text ${id}`, type: "text", x: 20, y: 20, width: 200, height: 100, rotation: 0, zIndex: 1, opacity: 1, text: value, fontFamily: "Arial", fontSize: 20 });
const project: PublisherProject = { id: "p", name: "P", createdAt: 1, updatedAt: 1, activePageId: "p1", autoSave: true, version: 2, pages: [{ id: "p1", name: "Page 1", width: 800, height: 1000, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 0, bleed: 0, elements: [text("a", "A".repeat(200)), text("b")] }, { id: "p2", name: "Page 2", width: 800, height: 1000, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 0, bleed: 0, elements: [] }] };

test("normalizes professional publishing controls", () => {
  const value = normalizePublishingTypography({ ...text("a"), widowLines: 99, orphanLines: 0, stylisticSets: [20, 1, 1, 30], paragraphBorderWidth: 100 });
  assert.equal(value.widowLines, 10);
  assert.equal(value.orphanLines, 1);
  assert.deepEqual(value.stylisticSets, [1, 20]);
  assert.equal(value.paragraphBorderWidth, 20);
});

test("creates and removes linked text threads", () => {
  const linked = createTextThread(project, ["a", "b"], "Story");
  const first = linked.pages[0].elements[0];
  assert.equal(first.linkedTextFrameId, "b");
  assert.equal(Object.values(linked.typographyThreads ?? {})[0].name, "Story");
  const removed = unlinkTextFrame(linked, "b");
  assert.equal(removed.pages[0].elements[1].textThreadId, undefined);
});

test("auto creates a continuation frame on the next page", () => {
  const next = autoCreateLinkedFrame(project, "a");
  assert.equal(next.pages[1].elements.length, 1);
  assert.ok(next.pages[1].elements[0].previousTextFrameId);
});

test("flows text across thread capacity and detects overset", () => {
  const tiny = { ...project, pages: [{ ...project.pages[0], elements: [{ ...text("a", "X".repeat(1000)), width: 60, height: 30 }, { ...text("b", ""), width: 60, height: 30 }] }, project.pages[1]] };
  const linked = createTextThread(tiny, ["a", "b"], "Tiny");
  const threadId = Object.keys(linked.typographyThreads ?? {})[0];
  const flowed = flowThreadText(linked, threadId);
  assert.ok(estimateTextCapacity(flowed.pages[0].elements[0]) > 0);
  assert.equal(flowed.pages[0].elements[1].oversetText, true);
  assert.equal(hasOversetText({ ...text("x", "X".repeat(1000)), width: 60, height: 30 }), true);
});

test("builds OpenType settings and reports publishing issues", () => {
  const settings = openTypeFeatureSettings({ ...text("a"), stylisticSets: [1, 12], swashes: true, figureStyle: "oldstyle", fractions: true });
  assert.match(settings, /ss01/);
  assert.match(settings, /ss12/);
  assert.match(settings, /swsh/);
  assert.match(settings, /onum/);
  assert.match(settings, /frac/);
  const broken = { ...project, pages: [{ ...project.pages[0], elements: [{ ...text("a", "X".repeat(1000)), width: 60, height: 30, linkedTextFrameId: "missing" }] }, project.pages[1]] };
  const issues = publishingTypographyIssues(broken);
  assert.ok(issues.some((issue) => issue.includes("overset")));
  assert.ok(issues.some((issue) => issue.includes("missing text frame")));
});

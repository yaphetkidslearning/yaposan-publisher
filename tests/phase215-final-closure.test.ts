import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PublisherProject } from "../src/types/publisher";
import { exportPhase21Closure, finalizePhase21, PHASE21_REGRESSION_SUITES } from "../src/utils/phase21ClosureEngine";

const project = {
  id: "phase21-closure",
  name: "Phase 21 Closure",
  createdAt: 1,
  updatedAt: 1,
  activePageId: "p1",
  autoSave: true,
  version: 2,
  pages: [{ id: "p1", name: "Page 1", width: 612, height: 792, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 36, bleed: 0, elements: [] }],
} as PublisherProject;

test("finalizes the complete Phase 21 migration chain", () => {
  const finalized = finalizePhase21(project);
  assert.equal(finalized.phase21Version, "21.5");
  assert.equal(finalized.phase21Closure?.version, "21.5");
  assert.ok(finalized.documentFoundation);
  assert.ok(finalized.documentStyles);
  assert.ok(finalized.documentReferences);
  assert.ok(finalized.documentVariables);
  assert.ok(finalized.publicationCompletion?.packageManifest);
});

test("registers every Phase 21 regression suite including Phase 21.3", () => {
  assert.equal(PHASE21_REGRESSION_SUITES.length, 6);
  assert.ok(PHASE21_REGRESSION_SUITES.includes("phase213-variables-smart-content.test.ts"));
});

test("package scripts include the complete Phase 21 verification chain", () => {
  const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as { scripts: Record<string, string> };
  assert.match(pkg.scripts["test:phase21.3"], /phase213-variables-smart-content/);
  assert.match(pkg.scripts["verify:phase21.5"], /test:phase21\.0/);
  assert.match(pkg.scripts["verify:phase21.5"], /test:phase21\.1/);
  assert.match(pkg.scripts["verify:phase21.5"], /test:phase21\.2/);
  assert.match(pkg.scripts["verify:phase21.5"], /test:phase21\.3/);
  assert.match(pkg.scripts["verify:phase21.5"], /test:phase21\.4/);
  assert.match(pkg.scripts["verify:phase21.5"], /test:phase21\.5/);
});

test("exports a formal Phase 21.5 closure report", () => {
  const report = JSON.parse(exportPhase21Closure(project)) as { phase: string; closure: { regressionSuites: string[] } };
  assert.equal(report.phase, "21.5");
  assert.equal(report.closure.regressionSuites.length, 6);
});

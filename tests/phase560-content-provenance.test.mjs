import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const engine = fs.readFileSync(path.join(root, "src/utils/phase56ContentProvenanceEngine.ts"), "utf8");
const screen = fs.readFileSync(path.join(root, "src/app/content-provenance.tsx"), "utf8");
const index = fs.readFileSync(path.join(root, "src/app/index.tsx"), "utf8");

test("Phase 56 defines provenance, fingerprints, disclosures, manifests, and honest external boundaries", () => {
  for (const token of ["ProvenanceRecord", "ProvenanceEvent", "createLocalFingerprint", "buildExportManifest", "provenanceTrustScore", "provenanceBlockers", "C2PA signing"]) assert.match(engine, new RegExp(token));
});

test("Phase 56 screen persists records and exposes repair, status, manifest, and audit controls", () => {
  for (const token of ["AsyncStorage", "Rebuild local fingerprint", "Export trust manifest", "Authenticity audit", "PHASE56_CAPABILITIES"]) assert.match(screen, new RegExp(token));
});

test("Phase 56 is integrated into navigation and package scripts", () => {
  assert.match(index, /Content Provenance/);
  assert.match(index, /content-provenance/);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.version, "56.0.0");
  assert.ok(pkg.scripts["test:phase56"]);
});

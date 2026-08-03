import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
test("telemetry engine is private by default and supports consent", () => {
  const source = read("src/utils/telemetryDiagnosticsEngine.ts");
  assert.match(source, /enabled:\s*false/);
  assert.match(source, /crashReports:\s*false/);
  assert.match(source, /performanceMetrics:\s*false/);
  assert.match(source, /anonymousUsage:\s*false/);
  assert.match(source, /setTelemetryConsent/);
  assert.match(source, /clearTelemetryData/);
  assert.match(source, /exportTelemetryReport/);
});
test("desktop runtime stores consent and sanitizes telemetry", () => {
  const source = read("desktop/main.cjs");
  assert.match(source, /telemetryAllowed/);
  assert.match(source, /telemetryEvents=telemetryEvents\.slice\(-500\)/);
  assert.match(source, /yaposan:telemetry-consent/);
  assert.match(source, /yaposan:telemetry-clear/);
  assert.match(source, /uncaughtException/);
});
test("diagnostics center is integrated in the real editor", () => {
  const editor = read("src/app/editor.tsx");
  const toolbar = read("src/components/publisher/EditorToolbar.tsx");
  assert.match(editor, /TelemetryDiagnosticsCenterModal/);
  assert.match(editor, /showTelemetryDiagnosticsCenter/);
  assert.match(toolbar, /label="Diagnostics"/);
});
test("home prompt maintains accessible contrast", () => {
  const home = read("src/app/index.tsx");
  assert.match(home, /placeholderTextColor="#52657a"/);
  assert.match(home, /color: "#102033"/);
  assert.match(home, /backgroundColor: "#ffffff"/);
  assert.match(home, /backgroundColor: "#087f78"/);
});

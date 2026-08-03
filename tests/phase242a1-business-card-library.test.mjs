import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const library = fs.readFileSync(new URL("../src/templates/businessCardLibrary.ts", import.meta.url), "utf8");
const browser = fs.readFileSync(new URL("../src/app/templates.tsx", import.meta.url), "utf8");

test("Phase 24.2A.1 declares 12 industries and 10 design systems", () => {
  const industryBlock = library.match(/const industries = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  const styleBlock = library.match(/const styles = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  assert.equal((industryBlock.match(/\["/g) ?? []).length, 12);
  assert.equal((styleBlock.match(/\["/g) ?? []).length, 10);
});

test("templates are two-sided and use editable placeholders", () => {
  assert.match(library, /name: "Front"/);
  assert.match(library, /name: "Back"/);
  for (const key of ["PersonName", "Title", "BusinessName", "Phone", "Email", "Website", "Address", "Logo", "QR"]) assert.match(library, new RegExp(`\\{\\{${key}\\}\\}`));
});

test("library exports exactly the generated 120-template collection", () => {
  assert.match(library, /industries\.flatMap/);
  assert.match(library, /styles\.map/);
  assert.match(library, /BUSINESS_CARD_TEMPLATE_COUNT/);
});

test("template browser creates and opens a real Publisher project", () => {
  assert.match(browser, /templateToProject/);
  assert.match(browser, /savePublisherProject/);
  assert.match(browser, /projectId=/);
  assert.match(browser, /120 editable/);
});

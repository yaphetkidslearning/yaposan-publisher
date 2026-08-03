import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const docs = fs.readFileSync(new URL("../src/templates/businessDocumentLibrary.ts", import.meta.url), "utf8");
const builtins = fs.readFileSync(new URL("../src/templates/builtInTemplates.ts", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/app/templates.tsx", import.meta.url), "utf8");

test("Phase 24.2A.3 defines all eight business document collections", () => {
  for (const count of [100, 80, 40, 40, 40, 80, 70, 70]) assert.match(docs, new RegExp(`count: ${count}`));
  for (const name of ["Letterheads", "Invoices", "Quotes & Estimates", "Receipts", "Certificates", "Company Profiles", "Brochures", "Flyers"]) assert.match(docs, new RegExp(name.replace(/[&]/g, "&")));
});

test("document templates include editable smart placeholders and data objects", () => {
  for (const key of ["Logo", "BusinessName", "Phone", "Email", "Website", "Description", "Address", "QR", "Price", "Total"]) assert.match(docs, new RegExp(`\\{\\{${key}\\}\\}`));
  assert.match(docs, /type: PublisherElement\["type"\]/);
  assert.match(docs, /"table"/);
});

test("built-in registry combines cards and business documents", () => {
  assert.match(builtins, /BUSINESS_CARD_TEMPLATES/);
  assert.match(builtins, /BUSINESS_DOCUMENT_TEMPLATES/);
  assert.match(builtins, /registerMany\(\[\.\.\.BUSINESS_CARD_TEMPLATES, \.\.\.BUSINESS_DOCUMENT_TEMPLATES\]\)/);
});

test("template browser advertises the cumulative 640-template library", () => {
  assert.match(app, /640 editable business templates/);
  assert.match(app, /Phase 24\.2A\.3/);
});

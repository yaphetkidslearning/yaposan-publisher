import assert from "node:assert/strict";
import test from "node:test";
import { buildDataSource, getActiveMergePreview, navigateMergeRecord, resolveBoundElement, resolveVariableText, type MailMergeProjectData } from "../src/utils/mailMergeEngine";

const source = buildDataSource("recipients.csv", "csv", [
  { name: "jane doe", amount: "$1250.5", joined: "2026-07-21", status: "VIP", photo: "https://example.com/jane.png" },
  { name: "john smith", amount: "", joined: "2026-07-22", status: "Standard", photo: "https://example.com/john.png" },
]);

function data(): MailMergeProjectData {
  return { sources: [source], activeSourceId: source.id, activeRecordId: source.records[0].id, previewEnabled: true, fieldProperties: {
    name: { field: "name", textTransform: "titlecase" },
    amount: { field: "amount", currencyFormat: { currency: "USD" }, emptyBehavior: "default", defaultValue: "$0.00" },
    joined: { field: "joined", dateFormat: { dateStyle: "long", locale: "en-US" } },
  } };
}

test("resolves formatted fields while preserving template data", () => {
  const context = getActiveMergePreview(data());
  assert.ok(context);
  const result = resolveVariableText("Hello {{name}} — {{amount}} — {{joined}}", context);
  assert.match(result, /Hello Jane Doe/);
  assert.match(result, /\$1,250\.50/);
  assert.match(result, /July 21, 2026/);
});

test("supports IF ELSE rules and inline formatting", () => {
  const context = getActiveMergePreview(data());
  assert.ok(context);
  assert.equal(resolveVariableText('{{#if status equals "VIP"}}Priority{{else}}Standard{{/if}}', context), "Priority");
  assert.equal(resolveVariableText("{{name|upper}}", context), "JANE DOE");
});

test("navigates records and resolves bound images and visibility", () => {
  const next = navigateMergeRecord(data(), "next");
  const context = getActiveMergePreview(next);
  assert.ok(context);
  assert.equal(context.record.values.name, "john smith");
  const image = resolveBoundElement({ hidden: false, imageUri: "fallback.png", mergeBinding: { kind: "image", field: "photo", visibleWhen: { field: "status", operator: "equals", value: "VIP" } } }, context);
  assert.equal(image.imageUri, "https://example.com/john.png");
  assert.equal(image.hidden, true);
  assert.equal(resolveVariableText("{{amount}}", context), "$0.00");
});

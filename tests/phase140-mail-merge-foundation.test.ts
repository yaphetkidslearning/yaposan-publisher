import assert from "node:assert/strict";
import test from "node:test";
import { importTextDataSource, mergeFieldToken, queryMergeRecords } from "../src/utils/mailMergeEngine";

test("imports quoted CSV and detects production field types", () => {
  const source = importTextDataSource("recipients.csv", "csv", 'Name,Email,Amount,Joined\n"Doe, Jane",jane@example.com,$1,250.50,2026-07-21\n');
  assert.equal(source.records.length, 1);
  assert.equal(source.records[0].values.name, "Doe, Jane");
  assert.equal(source.fields.find((field) => field.key === "email")?.type, "email");
  assert.equal(mergeFieldToken("First Name"), "{{first_name}}");
});

test("imports TSV, detects duplicate records, searches and sorts", () => {
  const source = importTextDataSource("list.tsv", "tsv", "Name\tCity\nDawit\tBaltimore\nYosan\tTowson\nDawit\tBaltimore\n");
  assert.equal(source.duplicateRecordIds.length, 1);
  const result = queryMergeRecords(source, { searchQuery: "balt", sort: { field: "name", direction: "asc" }, filters: [] });
  assert.equal(result.length, 2);
  assert.equal(result[0].values.name, "Dawit");
});

test("imports nested JSON and filters empty values", () => {
  const source = importTextDataSource("contacts.json", "json", JSON.stringify([{ name: "A", address: { city: "Baltimore" } }, { name: "B", address: { city: "" } }]));
  assert.ok(source.fields.some((field) => field.key === "address_city"));
  const result = queryMergeRecords(source, { filters: [{ field: "address_city", operator: "isNotEmpty" }] });
  assert.equal(result.length, 1);
});

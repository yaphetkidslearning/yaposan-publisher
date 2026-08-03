import test from "node:test";
import assert from "node:assert/strict";
import {
  createCodeTableElement,
  createGroupedSummary,
  createLinkedChartElement,
  createLinkedDataSource,
  createPivotElement,
  markDataSourceMissing,
  parseDelimitedData,
  refreshDataSource,
  relinkDataSource,
} from "../src/utils/professionalDataObjectsEngine";

const csv = `Region,Product,Sales\nEast,Hoodie,120\nEast,Polo,80\nWest,Hoodie,150\nWest,Polo,50`;

test("parses quoted and delimited data", () => {
  const parsed = parseDelimitedData(csv);
  assert.deepEqual(parsed.headers, ["Region", "Product", "Sales"]);
  assert.equal(parsed.rows.length, 4);
});

test("creates grouped and pivot summaries", () => {
  const parsed = parseDelimitedData(csv);
  const source = createLinkedDataSource({ name: "Sales.csv", type: "csv", ...parsed });
  const grouped = createGroupedSummary(source.rows, { groupBy: "Region", valueField: "Sales", operation: "sum", includeGrandTotal: true });
  assert.equal(grouped.rows.at(-1)?.[1], 400);
  const pivot = createPivotElement("pivot", 1, source, { rowField: "Region", columnField: "Product", valueField: "Sales", operation: "sum", includeGrandTotal: true, includeSubtotals: true }) as any;
  assert.equal(pivot.dataObjectKind, "pivot");
  assert.ok(pivot.tableCells.length >= 4);
});

test("creates linked chart and QR/barcode tables", () => {
  const parsed = parseDelimitedData(csv);
  const source = createLinkedDataSource({ name: "Sales.csv", type: "csv", ...parsed });
  const chart = createLinkedChartElement("chart", 2, source, "Product", "Sales", "bar") as any;
  assert.equal(chart.dataObjectKind, "linked-chart");
  const qr = createCodeTableElement("qr", 3, source, "Product", "qr") as any;
  const barcode = createCodeTableElement("barcode", 4, source, "Product", "barcode") as any;
  assert.equal(qr.dataObjectKind, "qr-table");
  assert.equal(barcode.dataObjectKind, "barcode-table");
});

test("tracks missing, refresh and relink status", () => {
  const parsed = parseDelimitedData(csv);
  const source = createLinkedDataSource({ name: "Sales.csv", type: "csv", ...parsed });
  assert.equal(markDataSourceMissing(source).status, "missing");
  assert.equal(refreshDataSource(source, parsed.headers, parsed.rows).status, "ready");
  assert.equal(relinkDataSource(source, { name: "Sales-2027.csv", type: "csv", ...parsed }).name, "Sales-2027.csv");
});

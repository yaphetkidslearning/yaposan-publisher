import assert from "node:assert/strict";
import test from "node:test";
import { buildChartSvg, createCalendarElement, createChartElement, createProfessionalTableElement, createScheduleElement, formatAdvancedValue, monthMatrix, evaluateIfFormula, conditionalFormatForValue } from "../src/utils/dataVisualizationEngine";

test("Phase 15.0 creates a professional editable table", () => {
  const table = createProfessionalTableElement("table-1", 4, 8, 5, "professional") as any;
  assert.equal(table.type, "table");
  assert.equal(table.tableRows, 8);
  assert.equal(table.tableColumns, 5);
  assert.equal(table.tableRepeatHeader, true);
  assert.equal(table.tableCells[0][0], "Column 1");
});

test("Phase 15.1 formats advanced cell values", () => {
  assert.match(formatAdvancedValue("1234.5", "currency"), /1,234\.50/);
  assert.equal(formatAdvancedValue("0.25", "percent"), "25%");
  assert.match(formatAdvancedValue("1000", "scientific"), /e\+/i);
  assert.equal(formatAdvancedValue("1.5", "fraction"), "1 1/2");
  assert.equal(evaluateIfFormula('=IF(10>=5,"Yes","No")'), "Yes");
  assert.deepEqual(conditionalFormatForValue(88,[{operator:"gte",value:80,format:{fillColor:"#DCFCE7"}}]),{fillColor:"#DCFCE7"});
});

test("Phase 15.2 builds scalable SVG charts", () => {
  const data = [{ label: "A", value: 10 }, { label: "B", value: 20 }];
  for (const type of ["column", "bar", "line", "area", "pie", "doughnut", "scatter", "bubble", "radar", "funnel", "waterfall", "gauge", "histogram", "box-plot"] as const) {
    const svg = buildChartSvg(type, data, "Test");
    assert.match(svg, /^<svg/);
    assert.match(svg, /Test/);
    const element = createChartElement(`chart-${type}`, 2, type, data, "Test") as any;
    assert.equal(element.type, "svg");
    assert.equal(element.chartType, type);
  }
});

test("Phase 15.3 creates calendar and schedule data objects", () => {
  const matrix = monthMatrix(2026, 6);
  assert.ok(matrix.length >= 4 && matrix.length <= 6);
  assert.equal(matrix.flat().filter(Boolean).length, 31);
  const calendar = createCalendarElement("calendar-1", 3, 2026, 6, [{ id: "e1", title: "Launch", date: "2026-07-21" }]) as any;
  assert.equal(calendar.type, "table");
  assert.ok(calendar.tableCells.flat().some((value: string) => value.includes("Launch")));
  const schedule = createScheduleElement("schedule-1", 3, "week") as any;
  assert.equal(schedule.calendarView, "week");
});

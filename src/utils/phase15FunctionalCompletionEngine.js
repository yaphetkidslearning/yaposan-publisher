import { buildChartSvg, createCalendarElement } from "./dataVisualizationEngine";
import { refreshLinkedElement } from "./professionalDataObjectsEngine";
const colToIndex = (letters) => letters.toUpperCase().split("").reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
const refPattern = /\$?([A-Z]+)\$?(\d+)/gi;
const numeric = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw)
        return 0;
    const percent = raw.endsWith("%");
    const parsed = Number(raw.replace(/[$,%\s,]/g, ""));
    if (!Number.isFinite(parsed))
        throw new Error("VALUE");
    return percent ? parsed / 100 : parsed;
};
function getCell(cells, ref) {
    const match = /^\$?([A-Z]+)\$?(\d+)$/i.exec(ref.trim());
    if (!match)
        return "#REF!";
    const row = Number(match[2]) - 1;
    const col = colToIndex(match[1]);
    return cells[row]?.[col] ?? "#REF!";
}
function expandRange(cells, range) {
    const [start, end] = range.split(":");
    const a = /^\$?([A-Z]+)\$?(\d+)$/i.exec(start ?? "");
    const b = /^\$?([A-Z]+)\$?(\d+)$/i.exec(end ?? start ?? "");
    if (!a || !b)
        return [];
    const minRow = Math.min(Number(a[2]), Number(b[2])) - 1;
    const maxRow = Math.max(Number(a[2]), Number(b[2])) - 1;
    const minCol = Math.min(colToIndex(a[1]), colToIndex(b[1]));
    const maxCol = Math.max(colToIndex(a[1]), colToIndex(b[1]));
    const result = [];
    for (let row = minRow; row <= maxRow; row += 1)
        for (let col = minCol; col <= maxCol; col += 1)
            result.push(cells[row]?.[col] ?? "");
    return result;
}
export function evaluateTableFormula(formula, cells, stack = new Set()) {
    if (!formula.startsWith("="))
        return formula;
    const expression = formula.slice(1).trim();
    const fn = /^(SUM|AVERAGE|COUNT|MIN|MAX)\(([^)]+)\)$/i.exec(expression);
    if (fn) {
        const values = fn[2].split(",").flatMap((part) => part.includes(":") ? expandRange(cells, part.trim()) : [getCell(cells, part.trim())]).map(numeric);
        if (fn[1].toUpperCase() === "COUNT")
            return values.length;
        if (!values.length)
            return 0;
        if (fn[1].toUpperCase() === "SUM")
            return values.reduce((a, b) => a + b, 0);
        if (fn[1].toUpperCase() === "AVERAGE")
            return values.reduce((a, b) => a + b, 0) / values.length;
        if (fn[1].toUpperCase() === "MIN")
            return Math.min(...values);
        return Math.max(...values);
    }
    try {
        const replaced = expression.replace(refPattern, (match) => {
            if (stack.has(match.toUpperCase()))
                throw new Error("CIRC");
            const raw = getCell(cells, match);
            if (raw === "#REF!")
                throw new Error("REF");
            if (raw.startsWith("=")) {
                const next = new Set(stack);
                next.add(match.toUpperCase());
                const value = evaluateTableFormula(raw, cells, next);
                if (typeof value === "string" && value.startsWith("#"))
                    throw new Error(value);
                return String(value);
            }
            return String(numeric(raw));
        });
        if (!/^[0-9+\-*/().\s]+$/.test(replaced))
            return "#NAME?";
        const value = Function(`"use strict";return (${replaced})`)();
        if (!Number.isFinite(value))
            return value === Infinity ? "#DIV/0!" : "#VALUE!";
        return value;
    }
    catch (error) {
        const message = String(error);
        if (message.includes("CIRC"))
            return "#CIRC!";
        if (message.includes("REF"))
            return "#REF!";
        return "#VALUE!";
    }
}
export function recalculateTable(element) {
    if (element.type !== "table" || !element.tableCells)
        return element;
    const cells = element.tableCells.map((row) => [...row]);
    const values = cells.map((row) => row.map((cell) => String(evaluateTableFormula(cell, cells))));
    return { ...element, tableCalculatedCells: values, tableFormulaStatus: "ready" };
}
export function updateChartElement(element, input) {
    if (!element.chartType)
        return element;
    const type = input.type ?? element.chartType;
    const title = input.title ?? element.chartTitle ?? element.name;
    const data = input.data ?? element.chartData ?? [];
    const legendPosition = input.legendPosition ?? element.chartLegendPosition ?? "right";
    const axisMin = input.axisMin ?? element.chartAxisMin;
    const axisMax = input.axisMax ?? element.chartAxisMax;
    const showGridlines = input.showGridlines ?? element.chartShowGridlines ?? true;
    const showDataLabels = input.showDataLabels ?? element.chartShowDataLabels ?? false;
    const svgMarkup = buildChartSvg(type, data, title, 720, 420, { legendPosition, axisMin, axisMax, showGridlines, showDataLabels });
    return { ...element, name: title, chartType: type, chartTitle: title, chartData: data, svgMarkup, svgOriginalMarkup: svgMarkup, chartLegendPosition: legendPosition, chartAxisMin: axisMin, chartAxisMax: axisMax, chartShowGridlines: showGridlines, chartShowDataLabels: showDataLabels };
}
export function regenerateCalendarElement(element, overrides = {}) {
    if (element.calendarView !== "month")
        return { ...element, ...overrides };
    const year = overrides.calendarYear ?? element.calendarYear ?? new Date().getFullYear();
    const month = overrides.calendarMonth ?? element.calendarMonth ?? new Date().getMonth();
    const events = overrides.calendarEvents ?? element.calendarEvents ?? [];
    const rebuilt = createCalendarElement(element.id, element.zIndex, year, month, events);
    return { ...element, ...rebuilt, id: element.id, x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation, opacity: element.opacity, zIndex: element.zIndex, calendarYear: year, calendarMonth: month, calendarEvents: events };
}
export function upsertCalendarEvent(element, event) {
    const events = [...(element.calendarEvents ?? [])];
    const index = events.findIndex((item) => item.id === event.id);
    if (index >= 0)
        events[index] = { ...event };
    else
        events.push({ ...event });
    return regenerateCalendarElement(element, { calendarEvents: events.sort((a, b) => `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`)) });
}
export const removeCalendarEvent = (element, eventId) => regenerateCalendarElement(element, { calendarEvents: (element.calendarEvents ?? []).filter((event) => event.id !== eventId) });
export function moveCalendarEvent(element, eventId, date, time) {
    return regenerateCalendarElement(element, { calendarEvents: (element.calendarEvents ?? []).map((event) => event.id === eventId ? { ...event, date, time: time ?? event.time } : event) });
}
export function registerDataSource(registry, source) { return { ...registry, [source.id]: { ...source } }; }
export function removeDataSource(registry, sourceId) { const next = { ...registry }; delete next[sourceId]; return next; }
export function dataSourceDependents(project, sourceId) { return project.pages.flatMap((page) => page.elements.filter((element) => element.linkedDataSource?.id === sourceId)); }
export function refreshProjectDataSource(project, source) {
    const registry = registerDataSource(project.dataSourceRegistry ?? {}, { ...source, status: "ready", lastRefreshedAt: new Date().toISOString() });
    return { ...project, dataSourceRegistry: registry, updatedAt: Date.now(), pages: project.pages.map((page) => ({ ...page, elements: page.elements.map((element) => element.linkedDataSource?.id === source.id ? refreshLinkedElement(element, registry[source.id]) : element) })) };
}
export function validateDataSourceRegistry(project) {
    return Object.values(project.dataSourceRegistry ?? {}).map((source) => ({ sourceId: source.id, status: source.status === "missing" ? "missing" : "ready", dependentIds: dataSourceDependents(project, source.id).map((element) => element.id) }));
}
export function addDiagramNode(elements, groupId, nextId, title = "New Node") {
    const group = elements.filter((element) => element.groupId === groupId);
    const maxY = Math.max(80, ...group.map((element) => element.y + element.height));
    const maxZ = Math.max(0, ...elements.map((element) => element.zIndex));
    const nodeId = nextId();
    const node = { id: nodeId, name: title, type: "rectangle", x: group[0]?.x ?? 120, y: maxY + 30, width: 180, height: 72, rotation: 0, zIndex: maxZ + 2, opacity: 1, shapeType: "rounded-rectangle", fillColor: "#CCFBF1", borderColor: "#0F766E", borderWidth: 2, text: title, textColor: "#0F172A", fontSize: 18, groupId, diagramType: group[0]?.diagramType, diagramRole: "node" };
    const parent = group.filter((item) => item.diagramRole === "node").at(-1);
    const connector = parent ? { id: nextId(), name: `${parent.name} to ${title}`, type: "line", x: parent.x + parent.width / 2, y: parent.y + parent.height, width: Math.max(1, node.x + node.width / 2 - (parent.x + parent.width / 2)), height: Math.max(1, node.y - (parent.y + parent.height)), rotation: 0, zIndex: maxZ + 1, opacity: 1, borderColor: "#0F766E", borderWidth: 2, groupId, diagramType: group[0]?.diagramType, diagramRole: "connector", diagramFromId: parent.id, diagramToId: node.id } : null;
    return [...elements, ...(connector ? [connector] : []), node];
}
export function deleteDiagramNode(elements, nodeId) { return elements.filter((element) => element.id !== nodeId && (element.diagramFromId !== nodeId && element.diagramToId !== nodeId)); }
export function relayoutDiagram(elements, groupId, direction = "vertical") {
    const nodes = elements.filter((element) => element.groupId === groupId && element.diagramRole === "node");
    const startX = Math.min(...nodes.map((node) => node.x), 120), startY = Math.min(...nodes.map((node) => node.y), 120);
    return elements.map((element) => {
        const index = nodes.findIndex((node) => node.id === element.id);
        if (index < 0)
            return element;
        return { ...element, x: direction === "horizontal" ? startX + index * 220 : startX, y: direction === "vertical" ? startY + index * 120 : startY };
    });
}

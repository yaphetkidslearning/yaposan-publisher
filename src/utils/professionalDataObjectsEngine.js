import { createProfessionalTableElement, createChartElement } from "./dataVisualizationEngine";
const clean = (value) => String(value ?? "").trim();
const numberValue = (value) => {
    const parsed = Number(String(value ?? "").replace(/[$,%\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
};
export function parseDelimitedData(text, delimiter = ",") {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (!lines.length)
        return { headers: [], rows: [] };
    const parseLine = (line) => {
        const values = [];
        let value = "", quoted = false;
        for (let index = 0; index < line.length; index += 1) {
            const char = line[index];
            if (char === '"') {
                if (quoted && line[index + 1] === '"') {
                    value += '"';
                    index += 1;
                }
                else
                    quoted = !quoted;
            }
            else if (char === delimiter && !quoted) {
                values.push(value);
                value = "";
            }
            else
                value += char;
        }
        values.push(value);
        return values.map((item) => item.trim());
    };
    const headers = parseLine(lines[0]).map((header, index) => header || `Column ${index + 1}`);
    const rows = lines.slice(1).map((line) => {
        const cells = parseLine(line);
        return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    });
    return { headers, rows };
}
export function parseWorksheetRows(matrix) {
    if (!matrix.length)
        return { headers: [], rows: [] };
    const headers = matrix[0].map((value, index) => clean(value) || `Column ${index + 1}`);
    const rows = matrix.slice(1).filter((row) => row.some((value) => clean(value).length > 0)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
    return { headers, rows };
}
export function parseJsonData(text) {
    const parsed = JSON.parse(text);
    const array = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.rows) ? parsed.rows : [];
    const rows = array.filter((item) => item !== null && typeof item === "object");
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    return { headers, rows };
}
export function createLinkedDataSource(input) {
    const now = new Date().toISOString();
    return {
        id: input.id ?? `data-source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: input.name,
        type: input.type,
        uri: input.uri,
        sheetName: input.sheetName,
        linkedAt: input.linkedAt ?? now,
        lastRefreshedAt: input.lastRefreshedAt ?? now,
        status: input.status ?? "ready",
        fingerprint: input.fingerprint,
        headers: [...input.headers],
        rows: input.rows.map((row) => ({ ...row })),
        refreshPolicy: input.refreshPolicy ?? "manual",
        errorMessage: input.errorMessage,
    };
}
export function relinkDataSource(source, next) {
    return createLinkedDataSource({ ...source, ...next, id: source.id, linkedAt: source.linkedAt, lastRefreshedAt: new Date().toISOString(), status: "ready", errorMessage: undefined });
}
export function markDataSourceMissing(source, message = "The linked source file could not be found.") {
    return { ...source, status: "missing", errorMessage: message };
}
export function refreshDataSource(source, headers, rows) {
    return { ...source, headers: [...headers], rows: rows.map((row) => ({ ...row })), lastRefreshedAt: new Date().toISOString(), status: "ready", errorMessage: undefined };
}
function aggregate(values, operation) {
    const numbers = values.map(numberValue);
    if (operation === "count")
        return values.length;
    if (!numbers.length)
        return 0;
    if (operation === "average")
        return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
    if (operation === "min")
        return Math.min(...numbers);
    if (operation === "max")
        return Math.max(...numbers);
    return numbers.reduce((sum, value) => sum + value, 0);
}
export function createGroupedSummary(rows, config) {
    const groups = new Map();
    rows.forEach((row) => {
        const key = clean(row[config.groupBy]) || "(Blank)";
        const values = groups.get(key) ?? [];
        values.push(row[config.valueField]);
        groups.set(key, values);
    });
    const output = [];
    Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, values]) => {
        output.push([key, aggregate(values, config.operation)]);
        if (config.includeSubtotal)
            output.push([`${key} subtotal`, aggregate(values, config.operation)]);
    });
    if (config.includeGrandTotal)
        output.push(["Grand Total", aggregate(rows.map((row) => row[config.valueField]), config.operation)]);
    return { headers: [config.groupBy, `${config.operation} of ${config.valueField}`], rows: output };
}
export function createPivotSummary(rows, config) {
    const rowKeys = Array.from(new Set(rows.map((row) => clean(row[config.rowField]) || "(Blank)"))).sort();
    const columnKeys = config.columnField ? Array.from(new Set(rows.map((row) => clean(row[config.columnField]) || "(Blank)"))).sort() : ["Value"];
    const resultRows = rowKeys.map((rowKey) => {
        const values = columnKeys.map((columnKey) => {
            const matching = rows.filter((row) => (clean(row[config.rowField]) || "(Blank)") === rowKey && (!config.columnField || (clean(row[config.columnField]) || "(Blank)") === columnKey));
            return aggregate(matching.map((row) => row[config.valueField]), config.operation);
        });
        const row = [rowKey, ...values];
        if (config.includeSubtotals)
            row.push(values.reduce((sum, value) => sum + Number(value), 0));
        return row;
    });
    const headers = [config.rowField, ...columnKeys, ...(config.includeSubtotals ? ["Subtotal"] : [])];
    if (config.includeGrandTotal) {
        const totals = columnKeys.map((columnKey) => aggregate(rows.filter((row) => !config.columnField || (clean(row[config.columnField]) || "(Blank)") === columnKey).map((row) => row[config.valueField]), config.operation));
        resultRows.push(["Grand Total", ...totals, ...(config.includeSubtotals ? [totals.reduce((sum, value) => sum + value, 0)] : [])]);
    }
    return { headers, rows: resultRows };
}
export function createDataTableElement(id, zIndex, headers, rows, name = "Professional Data Table", source) {
    const element = createProfessionalTableElement(id, zIndex, Math.max(2, rows.length + 1), Math.max(1, headers.length), "professional");
    element.name = name;
    element.tableCells = [headers, ...rows].map((row) => row.map((value) => String(value ?? "")));
    element.tableRows = element.tableCells.length;
    element.tableColumns = headers.length;
    element.height = Math.max(180, element.tableRows * 42);
    element.width = Math.min(900, Math.max(300, headers.length * 150));
    element.dataObjectKind = "linked-table";
    element.linkedDataSource = source ? { ...source } : undefined;
    element.dataRefreshStatus = source?.status ?? "ready";
    return element;
}
export function createPivotElement(id, zIndex, source, config) {
    const summary = createPivotSummary(source.rows, config);
    const element = createDataTableElement(id, zIndex, summary.headers, summary.rows, "Pivot Summary", source);
    element.dataObjectKind = "pivot";
    element.pivotConfiguration = { ...config };
    return element;
}
export function createSummaryElement(id, zIndex, source, config) {
    const summary = createGroupedSummary(source.rows, config);
    const element = createDataTableElement(id, zIndex, summary.headers, summary.rows, "Grouped Summary", source);
    element.dataObjectKind = "summary";
    element.summaryConfiguration = { ...config };
    return element;
}
export function createCodeTableElement(id, zIndex, source, field, kind) {
    const headers = [field, kind === "qr" ? "QR Value" : "Barcode Value"];
    const rows = source.rows.map((row) => [clean(row[field]), clean(row[field])]);
    const element = createDataTableElement(id, zIndex, headers, rows, kind === "qr" ? "QR Code Table" : "Barcode Table", source);
    element.dataObjectKind = kind === "qr" ? "qr-table" : "barcode-table";
    element.codeField = field;
    element.codeKind = kind;
    element.tableCellFormats = Object.fromEntries(rows.map((_, index) => [`${index + 1}:1`, { kind, valueField: field }]));
    return element;
}
export function createLinkedChartElement(id, zIndex, source, labelField, valueField, chartType = "column", title = "Linked Chart") {
    const data = source.rows.map((row) => ({ label: clean(row[labelField]) || "Item", value: numberValue(row[valueField]) }));
    const element = createChartElement(id, zIndex, chartType, data, title);
    element.dataObjectKind = "linked-chart";
    element.linkedDataSource = { ...source };
    element.chartLink = { labelField, valueField, chartType };
    element.dataRefreshStatus = source.status;
    return element;
}
export function refreshLinkedElement(element, source) {
    const current = element;
    if (current.dataObjectKind === "linked-chart" && current.chartLink) {
        return { ...createLinkedChartElement(element.id, element.zIndex, source, current.chartLink.labelField, current.chartLink.valueField, current.chartLink.chartType, current.chartTitle ?? element.name), x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation };
    }
    if (current.dataObjectKind === "pivot" && current.pivotConfiguration)
        return { ...createPivotElement(element.id, element.zIndex, source, current.pivotConfiguration), x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation };
    if (current.dataObjectKind === "summary" && current.summaryConfiguration)
        return { ...createSummaryElement(element.id, element.zIndex, source, current.summaryConfiguration), x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation };
    if ((current.dataObjectKind === "qr-table" || current.dataObjectKind === "barcode-table") && current.codeField)
        return { ...createCodeTableElement(element.id, element.zIndex, source, current.codeField, current.dataObjectKind === "qr-table" ? "qr" : "barcode"), x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation };
    const rows = source.rows.map((row) => source.headers.map((header) => clean(row[header])));
    return { ...createDataTableElement(element.id, element.zIndex, source.headers, rows, element.name, source), x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation };
}

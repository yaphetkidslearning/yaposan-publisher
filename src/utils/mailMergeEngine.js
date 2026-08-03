import * as XLSX from "xlsx";
export function normalizeFieldKey(value) {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return normalized || "field";
}
function parseDelimitedLine(line, delimiter) {
    const cells = [];
    let value = "";
    let quoted = false;
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
            cells.push(value);
            value = "";
        }
        else
            value += char;
    }
    cells.push(value);
    return cells;
}
function rowsFromDelimited(text, delimiter) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (!lines.length)
        return [];
    const rawHeaders = parseDelimitedLine(lines[0], delimiter);
    const used = new Map();
    const headers = rawHeaders.map((header, index) => {
        const base = normalizeFieldKey(header || `Field ${index + 1}`);
        const count = (used.get(base) ?? 0) + 1;
        used.set(base, count);
        return count === 1 ? base : `${base}_${count}`;
    });
    return lines.slice(1).map((line) => {
        const cells = parseDelimitedLine(line, delimiter);
        return Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]));
    });
}
function flattenObject(value, prefix = "", result = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return result;
    for (const [rawKey, rawValue] of Object.entries(value)) {
        const key = normalizeFieldKey(prefix ? `${prefix}_${rawKey}` : rawKey);
        if (rawValue === null || ["string", "number", "boolean"].includes(typeof rawValue))
            result[key] = rawValue;
        else if (Array.isArray(rawValue))
            result[key] = rawValue.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ");
        else
            flattenObject(rawValue, key, result);
    }
    return result;
}
function rowsFromJson(text) {
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && Array.isArray(parsed.records)) ? parsed.records : [parsed];
    return list.filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => flattenObject(item));
}
function rowsFromWorkbook(buffer) {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const rows = [];
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
        for (const row of sheetRows) {
            const normalized = { _sheet: sheetName };
            for (const [key, value] of Object.entries(row))
                normalized[normalizeFieldKey(key)] = value == null ? "" : String(value);
            rows.push(normalized);
        }
    }
    return rows;
}
function detectType(values) {
    const populated = values.filter((value) => value !== null && String(value).trim() !== "");
    if (!populated.length)
        return "text";
    const strings = populated.map(String);
    if (strings.every((value) => /^(true|false|yes|no|0|1)$/i.test(value)))
        return "boolean";
    if (strings.every((value) => /^[-+]?[$€£]?\s?\d[\d,]*(\.\d+)?$/.test(value)) && strings.some((value) => /[$€£]/.test(value)))
        return "currency";
    if (strings.every((value) => /^[-+]?\d[\d,]*(\.\d+)?$/.test(value)))
        return "number";
    if (strings.every((value) => !Number.isNaN(Date.parse(value))) && strings.some((value) => /[-/]|[A-Za-z]{3}/.test(value)))
        return "date";
    if (strings.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))
        return "email";
    if (strings.every((value) => /^https?:\/\//i.test(value)))
        return strings.some((value) => /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(value)) ? "image" : "url";
    return "text";
}
function validateValue(type, value) {
    const text = value == null ? "" : String(value).trim();
    if (!text)
        return true;
    if (type === "number" || type === "currency")
        return !Number.isNaN(Number(text.replace(/[$€£,\s]/g, "")));
    if (type === "date")
        return !Number.isNaN(Date.parse(text));
    if (type === "email")
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    if (type === "url" || type === "image") {
        try {
            new URL(text);
            return true;
        }
        catch {
            return false;
        }
    }
    if (type === "boolean")
        return /^(true|false|yes|no|0|1)$/i.test(text);
    return true;
}
export function buildDataSource(name, format, rows) {
    const now = Date.now();
    const allKeys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const records = rows.map((row, index) => ({ id: `merge-record-${now}-${index}`, values: Object.fromEntries(allKeys.map((key) => [key, row[key] ?? ""])), sourceRow: index + 2 }));
    const issues = [];
    const fields = allKeys.map((key) => {
        const values = records.map((record) => record.values[key]);
        const type = detectType(values);
        let invalidCount = 0;
        records.forEach((record) => { if (!validateValue(type, record.values[key])) {
            invalidCount += 1;
            issues.push({ recordId: record.id, field: key, message: `Value does not match detected ${type} type`, severity: "warning" });
        } });
        return { key, label: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), type, nullable: values.some((value) => value == null || String(value).trim() === ""), uniqueValues: new Set(values.map((value) => String(value ?? "").trim().toLowerCase())).size, invalidCount };
    });
    const seen = new Map();
    const duplicateRecordIds = [];
    records.forEach((record) => {
        const signature = JSON.stringify(Object.keys(record.values).sort().map((key) => [key, String(record.values[key] ?? "").trim().toLowerCase()]));
        if (seen.has(signature))
            duplicateRecordIds.push(record.id);
        else
            seen.set(signature, record.id);
    });
    return { id: `merge-source-${now}-${Math.random().toString(36).slice(2, 8)}`, name, format, createdAt: now, updatedAt: now, fields, records, duplicateRecordIds, validationIssues: issues };
}
export function importTextDataSource(name, format, text) {
    const rows = format === "json" ? rowsFromJson(text) : rowsFromDelimited(text, format === "tsv" ? "\t" : ",");
    return buildDataSource(name, format, rows);
}
export function importWorkbookDataSource(name, buffer) {
    return buildDataSource(name, "xlsx", rowsFromWorkbook(buffer));
}
export function queryMergeRecords(source, options) {
    const search = (options.searchQuery ?? "").trim().toLowerCase();
    let records = source.records.filter((record) => !search || Object.values(record.values).some((value) => String(value ?? "").toLowerCase().includes(search)));
    for (const filter of options.filters ?? []) {
        records = records.filter((record) => {
            const actual = String(record.values[filter.field] ?? "");
            const expected = filter.value ?? "";
            if (filter.operator === "contains")
                return actual.toLowerCase().includes(expected.toLowerCase());
            if (filter.operator === "equals")
                return actual.toLowerCase() === expected.toLowerCase();
            if (filter.operator === "notEquals")
                return actual.toLowerCase() !== expected.toLowerCase();
            if (filter.operator === "isEmpty")
                return actual.trim() === "";
            return actual.trim() !== "";
        });
    }
    if (options.sort) {
        const { field, direction } = options.sort;
        records = [...records].sort((a, b) => String(a.values[field] ?? "").localeCompare(String(b.values[field] ?? ""), undefined, { numeric: true, sensitivity: "base" }) * (direction === "asc" ? 1 : -1));
    }
    return records;
}
export function mergeFieldToken(fieldKey) { return `{{${normalizeFieldKey(fieldKey)}}}`; }
function titleCase(value) {
    return value.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}
function formatMergeValue(value, property) {
    const empty = value == null || String(value).trim() === "";
    if (empty) {
        if (property?.emptyBehavior === "default")
            return property.defaultValue ?? "";
        if (property?.emptyBehavior === "keep-token")
            return mergeFieldToken(property.field);
        return property?.defaultValue ?? "";
    }
    let output = String(value);
    if (property?.currencyFormat) {
        const numeric = Number(output.replace(/[^0-9+-.]/g, ""));
        if (!Number.isNaN(numeric)) {
            output = new Intl.NumberFormat(property.currencyFormat.locale, {
                style: "currency",
                currency: property.currencyFormat.currency || "USD",
                minimumFractionDigits: property.currencyFormat.minimumFractionDigits,
                maximumFractionDigits: property.currencyFormat.maximumFractionDigits,
            }).format(numeric);
        }
    }
    else if (property?.numberFormat) {
        const numeric = Number(output.replace(/,/g, ""));
        if (!Number.isNaN(numeric))
            output = new Intl.NumberFormat(undefined, property.numberFormat).format(numeric);
    }
    else if (property?.dateFormat) {
        const parsed = new Date(output);
        if (!Number.isNaN(parsed.getTime()))
            output = new Intl.DateTimeFormat(property.dateFormat.locale, { dateStyle: property.dateFormat.dateStyle ?? "medium" }).format(parsed);
    }
    if (property?.textTransform === "uppercase")
        output = output.toUpperCase();
    if (property?.textTransform === "lowercase")
        output = output.toLowerCase();
    if (property?.textTransform === "titlecase")
        output = titleCase(output);
    return output;
}
function evaluateCondition(record, field, operator, expected = "") {
    const actual = String(record.values[normalizeFieldKey(field)] ?? "");
    if (operator === "equals")
        return actual.toLowerCase() === expected.toLowerCase();
    if (operator === "notEquals")
        return actual.toLowerCase() !== expected.toLowerCase();
    if (operator === "contains")
        return actual.toLowerCase().includes(expected.toLowerCase());
    if (operator === "isEmpty")
        return actual.trim() === "";
    return actual.trim() !== "";
}
export function resolveVariableText(text, context) {
    let output = text;
    const conditionalPattern = /{{#if\s+([a-zA-Z0-9_.-]+)(?:\s+(equals|notEquals|contains|isEmpty|isNotEmpty)(?:\s+"([^"]*)")?)?}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g;
    output = output.replace(conditionalPattern, (_match, field, operator = "isNotEmpty", expected = "", truthy = "", falsy = "") => evaluateCondition(context.record, field, operator, expected) ? truthy : falsy);
    return output.replace(/{{\s*([a-zA-Z0-9_.-]+)(?:\|([^}]+))?\s*}}/g, (token, rawField, inlineOptions) => {
        const field = normalizeFieldKey(rawField);
        const baseProperty = context.fieldProperties?.[field];
        let property = { field, ...baseProperty };
        if (inlineOptions) {
            for (const option of inlineOptions.split("|").map((item) => item.trim())) {
                if (option === "upper")
                    property = { ...property, textTransform: "uppercase" };
                else if (option === "lower")
                    property = { ...property, textTransform: "lowercase" };
                else if (option === "title")
                    property = { ...property, textTransform: "titlecase" };
                else if (option.startsWith("default:"))
                    property = { ...property, emptyBehavior: "default", defaultValue: option.slice(8) };
                else if (option.startsWith("currency:"))
                    property = { ...property, currencyFormat: { currency: option.slice(9) || "USD" } };
                else if (option === "number")
                    property = { ...property, numberFormat: { maximumFractionDigits: 2, useGrouping: true } };
                else if (option.startsWith("date:"))
                    property = { ...property, dateFormat: { dateStyle: (option.slice(5) || "medium") } };
            }
        }
        const dottedField = rawField.split(".").map(normalizeFieldKey).join("_");
        const value = context.record.values[field] ?? context.record.values[dottedField];
        if ((value == null || String(value).trim() === "") && property.emptyBehavior === "keep-token")
            return token;
        return formatMergeValue(value, property);
    });
}
export function resolveBoundElement(element, context) {
    const binding = element.mergeBinding;
    let hidden = element.hidden;
    if (binding?.visibleWhen)
        hidden = !evaluateCondition(context.record, binding.visibleWhen.field, binding.visibleWhen.operator, binding.visibleWhen.value);
    if (binding?.kind === "image") {
        const value = formatMergeValue(context.record.values[normalizeFieldKey(binding.field)], binding.property);
        return { ...element, hidden, imageUri: value || element.imageUri };
    }
    return { ...element, hidden, text: element.text ? resolveVariableText(element.text, context) : element.text };
}
export function getActiveMergePreview(data) {
    const source = data.sources.find((item) => item.id === data.activeSourceId) ?? data.sources[0];
    if (!source)
        return undefined;
    const records = queryMergeRecords(source, data);
    const record = records.find((item) => item.id === data.activeRecordId) ?? records[0];
    if (!record)
        return undefined;
    return { source, record, recordIndex: Math.max(0, records.findIndex((item) => item.id === record.id)), fieldProperties: data.fieldProperties };
}
export function navigateMergeRecord(data, direction) {
    const source = data.sources.find((item) => item.id === data.activeSourceId) ?? data.sources[0];
    if (!source)
        return data;
    const records = queryMergeRecords(source, data);
    if (!records.length)
        return data;
    const current = Math.max(0, records.findIndex((record) => record.id === data.activeRecordId));
    const index = direction === "first" ? 0 : direction === "last" ? records.length - 1 : direction === "previous" ? Math.max(0, current - 1) : Math.min(records.length - 1, current + 1);
    return { ...data, activeSourceId: source.id, activeRecordId: records[index].id };
}

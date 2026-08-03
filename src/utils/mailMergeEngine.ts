import * as XLSX from "xlsx";

export type MergeSourceFormat = "csv" | "tsv" | "json" | "xlsx";
export type MergeFieldType = "text" | "number" | "currency" | "date" | "boolean" | "email" | "url" | "image";
export type MergeCell = string | number | boolean | null;
export type MergeRecord = { id: string; values: Record<string, MergeCell>; sourceRow: number };
export type MergeField = { key: string; label: string; type: MergeFieldType; nullable: boolean; uniqueValues: number; invalidCount: number };
export type MergeValidationIssue = { recordId: string; field: string; message: string; severity: "warning" | "error" };
export type MailMergeDataSource = {
  id: string;
  name: string;
  format: MergeSourceFormat;
  createdAt: number;
  updatedAt: number;
  fields: MergeField[];
  records: MergeRecord[];
  duplicateRecordIds: string[];
  validationIssues: MergeValidationIssue[];
};
export type MailMergeProjectData = {
  sources: MailMergeDataSource[];
  activeSourceId?: string;
  activeRecordId?: string;
  searchQuery?: string;
  sort?: { field: string; direction: "asc" | "desc" };
  filters?: Array<{ field: string; operator: "contains" | "equals" | "notEquals" | "isEmpty" | "isNotEmpty"; value?: string }>;
  previewEnabled?: boolean;
  fieldProperties?: Record<string, MergeFieldProperty>;
  batchSettings?: import("./mailMergeBatchEngine").MergeBatchSettings;
  batchHistory?: import("./mailMergeBatchEngine").MergeBatchHistoryItem[];
  addressBook?: import("./mailMergePrintEngine").MergeAddressBookData;
  printSettings?: import("./mailMergePrintEngine").MergePrintSettings;
  printHistory?: import("./mailMergePrintEngine").MergePrintHistoryItem[];
  completionSettings?: import("./mailMergeCompletionEngine").MergeCompletionSettings;
};

export function normalizeFieldKey(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized || "field";
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) { cells.push(value); value = ""; }
    else value += char;
  }
  cells.push(value);
  return cells;
}

function rowsFromDelimited(text: string, delimiter: string): Record<string, MergeCell>[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const rawHeaders = parseDelimitedLine(lines[0], delimiter);
  const used = new Map<string, number>();
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

function flattenObject(value: unknown, prefix = "", result: Record<string, MergeCell> = {}): Record<string, MergeCell> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
    const key = normalizeFieldKey(prefix ? `${prefix}_${rawKey}` : rawKey);
    if (rawValue === null || ["string", "number", "boolean"].includes(typeof rawValue)) result[key] = rawValue as MergeCell;
    else if (Array.isArray(rawValue)) result[key] = rawValue.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ");
    else flattenObject(rawValue, key, result);
  }
  return result;
}

function rowsFromJson(text: string): Record<string, MergeCell>[] {
  const parsed: unknown = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && Array.isArray((parsed as { records?: unknown[] }).records)) ? (parsed as { records: unknown[] }).records : [parsed];
  return list.filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => flattenObject(item));
}

function rowsFromWorkbook(buffer: ArrayBuffer): Record<string, MergeCell>[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const rows: Record<string, MergeCell>[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
    for (const row of sheetRows) {
      const normalized: Record<string, MergeCell> = { _sheet: sheetName };
      for (const [key, value] of Object.entries(row)) normalized[normalizeFieldKey(key)] = value == null ? "" : String(value);
      rows.push(normalized);
    }
  }
  return rows;
}

function detectType(values: MergeCell[]): MergeFieldType {
  const populated = values.filter((value) => value !== null && String(value).trim() !== "");
  if (!populated.length) return "text";
  const strings = populated.map(String);
  if (strings.every((value) => /^(true|false|yes|no|0|1)$/i.test(value))) return "boolean";
  if (strings.every((value) => /^[-+]?[$€£]?\s?\d[\d,]*(\.\d+)?$/.test(value)) && strings.some((value) => /[$€£]/.test(value))) return "currency";
  if (strings.every((value) => /^[-+]?\d[\d,]*(\.\d+)?$/.test(value))) return "number";
  if (strings.every((value) => !Number.isNaN(Date.parse(value))) && strings.some((value) => /[-/]|[A-Za-z]{3}/.test(value))) return "date";
  if (strings.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return "email";
  if (strings.every((value) => /^https?:\/\//i.test(value))) return strings.some((value) => /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(value)) ? "image" : "url";
  return "text";
}

function validateValue(type: MergeFieldType, value: MergeCell): boolean {
  const text = value == null ? "" : String(value).trim();
  if (!text) return true;
  if (type === "number" || type === "currency") return !Number.isNaN(Number(text.replace(/[$€£,\s]/g, "")));
  if (type === "date") return !Number.isNaN(Date.parse(text));
  if (type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  if (type === "url" || type === "image") { try { new URL(text); return true; } catch { return false; } }
  if (type === "boolean") return /^(true|false|yes|no|0|1)$/i.test(text);
  return true;
}

export function buildDataSource(name: string, format: MergeSourceFormat, rows: Record<string, MergeCell>[]): MailMergeDataSource {
  const now = Date.now();
  const allKeys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const records: MergeRecord[] = rows.map((row, index) => ({ id: `merge-record-${now}-${index}`, values: Object.fromEntries(allKeys.map((key) => [key, row[key] ?? ""])), sourceRow: index + 2 }));
  const issues: MergeValidationIssue[] = [];
  const fields: MergeField[] = allKeys.map((key) => {
    const values = records.map((record) => record.values[key]);
    const type = detectType(values);
    let invalidCount = 0;
    records.forEach((record) => { if (!validateValue(type, record.values[key])) { invalidCount += 1; issues.push({ recordId: record.id, field: key, message: `Value does not match detected ${type} type`, severity: "warning" }); } });
    return { key, label: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), type, nullable: values.some((value) => value == null || String(value).trim() === ""), uniqueValues: new Set(values.map((value) => String(value ?? "").trim().toLowerCase())).size, invalidCount };
  });
  const seen = new Map<string, string>();
  const duplicateRecordIds: string[] = [];
  records.forEach((record) => {
    const signature = JSON.stringify(Object.keys(record.values).sort().map((key) => [key, String(record.values[key] ?? "").trim().toLowerCase()]));
    if (seen.has(signature)) duplicateRecordIds.push(record.id); else seen.set(signature, record.id);
  });
  return { id: `merge-source-${now}-${Math.random().toString(36).slice(2, 8)}`, name, format, createdAt: now, updatedAt: now, fields, records, duplicateRecordIds, validationIssues: issues };
}

export function importTextDataSource(name: string, format: Exclude<MergeSourceFormat, "xlsx">, text: string): MailMergeDataSource {
  const rows = format === "json" ? rowsFromJson(text) : rowsFromDelimited(text, format === "tsv" ? "\t" : ",");
  return buildDataSource(name, format, rows);
}

export function importWorkbookDataSource(name: string, buffer: ArrayBuffer): MailMergeDataSource {
  return buildDataSource(name, "xlsx", rowsFromWorkbook(buffer));
}

export function queryMergeRecords(source: MailMergeDataSource, options: Pick<MailMergeProjectData, "searchQuery" | "sort" | "filters">): MergeRecord[] {
  const search = (options.searchQuery ?? "").trim().toLowerCase();
  let records = source.records.filter((record) => !search || Object.values(record.values).some((value) => String(value ?? "").toLowerCase().includes(search)));
  for (const filter of options.filters ?? []) {
    records = records.filter((record) => {
      const actual = String(record.values[filter.field] ?? "");
      const expected = filter.value ?? "";
      if (filter.operator === "contains") return actual.toLowerCase().includes(expected.toLowerCase());
      if (filter.operator === "equals") return actual.toLowerCase() === expected.toLowerCase();
      if (filter.operator === "notEquals") return actual.toLowerCase() !== expected.toLowerCase();
      if (filter.operator === "isEmpty") return actual.trim() === "";
      return actual.trim() !== "";
    });
  }
  if (options.sort) {
    const { field, direction } = options.sort;
    records = [...records].sort((a, b) => String(a.values[field] ?? "").localeCompare(String(b.values[field] ?? ""), undefined, { numeric: true, sensitivity: "base" }) * (direction === "asc" ? 1 : -1));
  }
  return records;
}

export function mergeFieldToken(fieldKey: string): string { return `{{${normalizeFieldKey(fieldKey)}}}`; }

export type MergeTextTransform = "none" | "uppercase" | "lowercase" | "titlecase";
export type MergeEmptyBehavior = "keep-token" | "blank" | "default";
export type MergeFieldProperty = {
  field: string;
  label?: string;
  defaultValue?: string;
  emptyBehavior?: MergeEmptyBehavior;
  textTransform?: MergeTextTransform;
  numberFormat?: { minimumFractionDigits?: number; maximumFractionDigits?: number; useGrouping?: boolean };
  currencyFormat?: { currency: string; locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number };
  dateFormat?: { locale?: string; dateStyle?: "full" | "long" | "medium" | "short" };
};
export type MergeElementBinding = {
  sourceId?: string;
  field: string;
  kind: "text" | "image";
  property?: MergeFieldProperty;
  visibleWhen?: { field: string; operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty"; value?: string };
  advanced?: { styles?: import("./mailMergeCompletionEngine").MergeConditionalStyle[]; imageRule?: import("./mailMergeCompletionEngine").MergeConditionalImage; codeBinding?: { kind: "qr" | "barcode"; field: string; fallback?: string } };
};

export type MergePreviewContext = {
  source: MailMergeDataSource;
  record: MergeRecord;
  recordIndex: number;
  fieldProperties?: Record<string, MergeFieldProperty>;
  batchSettings?: import("./mailMergeBatchEngine").MergeBatchSettings;
  batchHistory?: import("./mailMergeBatchEngine").MergeBatchHistoryItem[];
  addressBook?: import("./mailMergePrintEngine").MergeAddressBookData;
  printSettings?: import("./mailMergePrintEngine").MergePrintSettings;
  printHistory?: import("./mailMergePrintEngine").MergePrintHistoryItem[];
};

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMergeValue(value: MergeCell, property?: MergeFieldProperty): string {
  const empty = value == null || String(value).trim() === "";
  if (empty) {
    if (property?.emptyBehavior === "default") return property.defaultValue ?? "";
    if (property?.emptyBehavior === "keep-token") return mergeFieldToken(property.field);
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
  } else if (property?.numberFormat) {
    const numeric = Number(output.replace(/,/g, ""));
    if (!Number.isNaN(numeric)) output = new Intl.NumberFormat(undefined, property.numberFormat).format(numeric);
  } else if (property?.dateFormat) {
    const parsed = new Date(output);
    if (!Number.isNaN(parsed.getTime())) output = new Intl.DateTimeFormat(property.dateFormat.locale, { dateStyle: property.dateFormat.dateStyle ?? "medium" }).format(parsed);
  }
  if (property?.textTransform === "uppercase") output = output.toUpperCase();
  if (property?.textTransform === "lowercase") output = output.toLowerCase();
  if (property?.textTransform === "titlecase") output = titleCase(output);
  return output;
}

function evaluateCondition(record: MergeRecord, field: string, operator: string, expected = ""): boolean {
  const actual = String(record.values[normalizeFieldKey(field)] ?? "");
  if (operator === "equals") return actual.toLowerCase() === expected.toLowerCase();
  if (operator === "notEquals") return actual.toLowerCase() !== expected.toLowerCase();
  if (operator === "contains") return actual.toLowerCase().includes(expected.toLowerCase());
  if (operator === "isEmpty") return actual.trim() === "";
  return actual.trim() !== "";
}

export function resolveVariableText(text: string, context: MergePreviewContext): string {
  let output = text;
  const conditionalPattern = /{{#if\s+([a-zA-Z0-9_.-]+)(?:\s+(equals|notEquals|contains|isEmpty|isNotEmpty)(?:\s+"([^"]*)")?)?}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g;
  output = output.replace(conditionalPattern, (_match, field: string, operator = "isNotEmpty", expected = "", truthy = "", falsy = "") =>
    evaluateCondition(context.record, field, operator, expected) ? truthy : falsy);
  return output.replace(/{{\s*([a-zA-Z0-9_.-]+)(?:\|([^}]+))?\s*}}/g, (token, rawField: string, inlineOptions?: string) => {
    const field = normalizeFieldKey(rawField);
    const baseProperty = context.fieldProperties?.[field];
    let property: MergeFieldProperty = { field, ...baseProperty };
    if (inlineOptions) {
      for (const option of inlineOptions.split("|").map((item) => item.trim())) {
        if (option === "upper") property = { ...property, textTransform: "uppercase" };
        else if (option === "lower") property = { ...property, textTransform: "lowercase" };
        else if (option === "title") property = { ...property, textTransform: "titlecase" };
        else if (option.startsWith("default:")) property = { ...property, emptyBehavior: "default", defaultValue: option.slice(8) };
        else if (option.startsWith("currency:")) property = { ...property, currencyFormat: { currency: option.slice(9) || "USD" } };
        else if (option === "number") property = { ...property, numberFormat: { maximumFractionDigits: 2, useGrouping: true } };
        else if (option.startsWith("date:")) property = { ...property, dateFormat: { dateStyle: (option.slice(5) || "medium") as "full" | "long" | "medium" | "short" } };
      }
    }
    const dottedField = rawField.split(".").map(normalizeFieldKey).join("_");
    const value = context.record.values[field] ?? context.record.values[dottedField];
    if ((value == null || String(value).trim() === "") && property.emptyBehavior === "keep-token") return token;
    return formatMergeValue(value, property);
  });
}

export function resolveBoundElement<T extends { hidden?: boolean; text?: string; imageUri?: string; mergeBinding?: MergeElementBinding }>(element: T, context: MergePreviewContext): T {
  const binding = element.mergeBinding;
  let hidden = element.hidden;
  if (binding?.visibleWhen) hidden = !evaluateCondition(context.record, binding.visibleWhen.field, binding.visibleWhen.operator, binding.visibleWhen.value);
  if (binding?.kind === "image") {
    const value = formatMergeValue(context.record.values[normalizeFieldKey(binding.field)], binding.property);
    return { ...element, hidden, imageUri: value || element.imageUri };
  }
  return { ...element, hidden, text: element.text ? resolveVariableText(element.text, context) : element.text };
}

export function getActiveMergePreview(data: MailMergeProjectData): MergePreviewContext | undefined {
  const source = data.sources.find((item) => item.id === data.activeSourceId) ?? data.sources[0];
  if (!source) return undefined;
  const records = queryMergeRecords(source, data);
  const record = records.find((item) => item.id === data.activeRecordId) ?? records[0];
  if (!record) return undefined;
  return { source, record, recordIndex: Math.max(0, records.findIndex((item) => item.id === record.id)), fieldProperties: data.fieldProperties };
}

export function navigateMergeRecord(data: MailMergeProjectData, direction: "first" | "previous" | "next" | "last"): MailMergeProjectData {
  const source = data.sources.find((item) => item.id === data.activeSourceId) ?? data.sources[0];
  if (!source) return data;
  const records = queryMergeRecords(source, data);
  if (!records.length) return data;
  const current = Math.max(0, records.findIndex((record) => record.id === data.activeRecordId));
  const index = direction === "first" ? 0 : direction === "last" ? records.length - 1 : direction === "previous" ? Math.max(0, current - 1) : Math.min(records.length - 1, current + 1);
  return { ...data, activeSourceId: source.id, activeRecordId: records[index].id };
}

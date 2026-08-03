import type { PublisherPage, PublisherProject } from "../types/publisher";
import type { MergeDataRecord, MergeFieldDefinition } from "../types/aiWriting";

export const BUILT_IN_MERGE_FIELDS: MergeFieldDefinition[] = [
  { key: "date", label: "Current date", kind: "dynamic" },
  { key: "time", label: "Current time", kind: "dynamic" },
  { key: "datetime", label: "Date and time", kind: "dynamic" },
  { key: "page", label: "Page number", kind: "dynamic" },
  { key: "pages", label: "Total pages", kind: "dynamic" },
  { key: "number", label: "Auto number", kind: "dynamic" },
  { key: "project", label: "Project name", kind: "dynamic" },
];

export function normalizeMergeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

export function mergeToken(key: string): string {
  return `{{${normalizeMergeKey(key)}}}`;
}

export function extractMergeFields(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)) found.add(normalizeMergeKey(match[1]));
  return [...found];
}

export function parseMergeCsv(value: string): MergeDataRecord[] {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const parseLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { cells.push(current.trim()); current = ""; }
      else current += char;
    }
    cells.push(current.trim());
    return cells;
  };
  const headers = parseLine(lines[0]).map(normalizeMergeKey).filter(Boolean);
  return lines.slice(1).map((line, index) => {
    const cells = parseLine(line);
    const values: Record<string, string> = {};
    headers.forEach((header, column) => { values[header] = cells[column] ?? ""; });
    return { id: `record-${Date.now()}-${index}`, name: values.name || values.full_name || `Record ${index + 1}`, values };
  });
}

export type MergeContext = {
  project: PublisherProject;
  page: PublisherPage;
  record?: MergeDataRecord;
  recordIndex?: number;
  now?: Date;
};

export function resolveMergeText(text: string, context: MergeContext): string {
  const now = context.now ?? new Date();
  const pageIndex = Math.max(0, context.project.pages.findIndex((item) => item.id === context.page.id));
  const variables = context.project.mergeData?.variables ?? {};
  const recordValues = context.record?.values ?? {};
  const dynamic: Record<string, string> = {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    datetime: now.toLocaleString(),
    page: String(pageIndex + 1),
    pages: String(context.project.pages.length),
    number: String((context.recordIndex ?? 0) + 1),
    project: context.project.name,
  };
  return text.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, rawKey: string) => {
    const key = normalizeMergeKey(rawKey);
    return recordValues[key] ?? variables[key] ?? dynamic[key] ?? `{{${key}}}`;
  });
}

export function applyMergeRecord(project: PublisherProject, record?: MergeDataRecord, recordIndex = 0): PublisherProject {
  return {
    ...project,
    pages: project.pages.map((page) => ({
      ...page,
      elements: page.elements.map((element) => element.type === "text" && element.text?.includes("{{")
        ? { ...element, text: resolveMergeText(element.text, { project, page, record, recordIndex }) }
        : element),
    })),
  };
}

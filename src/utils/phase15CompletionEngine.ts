import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type Phase15IssueSeverity = "error" | "warning" | "info";
export type Phase15Issue = { id: string; severity: Phase15IssueSeverity; elementId?: string; pageId?: string; message: string; fix?: string };
export type Phase15AuditReport = { generatedAt: string; score: number; errors: number; warnings: number; infos: number; issues: Phase15Issue[] };

const isDataObject = (element: PublisherElement) => Boolean(element.dataObjectKind || element.chartType || element.calendarView || element.diagramType || element.type === "table");
const cellCount = (element: PublisherElement) => (element.tableCells ?? []).reduce((total, row) => total + row.length, 0);

export function auditPhase15Element(element: PublisherElement, pageId?: string): Phase15Issue[] {
  const issues: Phase15Issue[] = [];
  const push = (severity: Phase15IssueSeverity, message: string, fix?: string) => issues.push({ id: `${element.id}-${issues.length}`, severity, elementId: element.id, pageId, message, fix });
  if (!isDataObject(element)) return issues;
  if (!element.name.trim()) push("warning", "Visualization has no accessible object name.", "Add a descriptive name in Properties.");
  if (!element.accessibilityLabel?.trim()) push("warning", "Visualization is missing an accessibility label.", "Generate or enter an accessibility label.");
  if (element.width < 24 || element.height < 24) push("error", "Visualization is too small to edit or export reliably.", "Increase width and height to at least 24 px.");
  if (element.opacity < 0.15) push("warning", "Visualization opacity is very low.", "Increase opacity for readable output.");
  if (element.type === "table") {
    if (!element.tableCells?.length || !cellCount(element)) push("error", "Table has no cell data.", "Add at least one row and one column.");
    if ((element.tableRows ?? 0) > 200 || (element.tableColumns ?? 0) > 50) push("warning", "Large table may reduce canvas and export performance.", "Split the table or filter the linked data.");
    if (element.tableRepeatHeader !== false && (element.tableHeaderRows ?? 1) < 1) push("warning", "Repeated headers are enabled but no header row is defined.", "Set Header rows to 1 or disable repeated headers.");
  }
  if (element.chartType && (!element.chartData || element.chartData.length === 0)) push("error", "Chart has no retained source data.", "Open the chart data editor and add values.");
  if (element.linkedDataSource?.status && element.linkedDataSource.status !== "ready") push("error", `Linked source status is ${element.linkedDataSource.status}.`, "Refresh or relink the source.");
  if (element.dataRefreshStatus && element.dataRefreshStatus !== "ready") push("warning", `Data object refresh status is ${element.dataRefreshStatus}.`, "Refresh the linked object before export.");
  if (element.diagramType && !element.groupId) push("info", "Diagram is ungrouped.", "Group its nodes and connectors for easier movement.");
  if (element.calendarView && !element.calendarYear) push("warning", "Calendar year metadata is missing.", "Set the calendar year in Properties.");
  return issues;
}

export function auditPhase15Project(project: PublisherProject): Phase15AuditReport {
  const issues = project.pages.flatMap((page) => page.elements.flatMap((element) => auditPhase15Element(element, page.id)));
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  const infos = issues.filter((issue) => issue.severity === "info").length;
  return { generatedAt: new Date().toISOString(), score: Math.max(0, 100 - errors * 15 - warnings * 5 - infos), errors, warnings, infos, issues };
}

export function generateAccessibilityLabel(element: PublisherElement): string {
  if (element.accessibilityLabel?.trim()) return element.accessibilityLabel.trim();
  if (element.chartType) return `${element.name || "Chart"}, ${element.chartType} chart with ${element.chartData?.length ?? 0} data points`;
  if (element.calendarView) return `${element.name || "Calendar"}, ${element.calendarView} calendar${element.calendarYear ? ` for ${element.calendarYear}` : ""}`;
  if (element.diagramType) return `${element.name || "Diagram"}, ${element.diagramType} diagram`;
  if (element.dataObjectKind) return `${element.name || "Data object"}, ${element.dataObjectKind.replace(/-/g, " ")}`;
  if (element.type === "table") return `${element.name || "Table"}, ${element.tableRows ?? element.tableCells?.length ?? 0} rows by ${element.tableColumns ?? element.tableCells?.[0]?.length ?? 0} columns`;
  return element.name || element.type;
}

export function normalizePhase15Element(element: PublisherElement): PublisherElement {
  const normalized: PublisherElement = { ...element, accessibilityLabel: generateAccessibilityLabel(element) };
  if (normalized.type === "table") {
    const rows = normalized.tableCells?.length ?? normalized.tableRows ?? 1;
    const columns = normalized.tableCells?.[0]?.length ?? normalized.tableColumns ?? 1;
    normalized.tableRows = Math.max(1, rows);
    normalized.tableColumns = Math.max(1, columns);
    normalized.tableHeaderRows = Math.max(0, Math.min(normalized.tableHeaderRows ?? 1, normalized.tableRows));
    normalized.tableCellPadding = Math.max(0, normalized.tableCellPadding ?? 8);
  }
  normalized.width = Math.max(24, normalized.width);
  normalized.height = Math.max(24, normalized.height);
  normalized.opacity = Math.max(0, Math.min(1, normalized.opacity));
  return normalized;
}

export function duplicatePhase15Elements(elements: PublisherElement[], nextId: () => string, offset = 24): PublisherElement[] {
  const groupMap = new Map<string, string>();
  return elements.map((element) => {
    const oldGroup = element.groupId;
    const groupId = oldGroup ? (groupMap.get(oldGroup) ?? (() => { const id = `group-${nextId()}`; groupMap.set(oldGroup, id); return id; })()) : undefined;
    return normalizePhase15Element({ ...element, id: nextId(), name: `${element.name} Copy`, x: element.x + offset, y: element.y + offset, zIndex: element.zIndex + 1, groupId });
  });
}

export function exportPhase15Data(element: PublisherElement): string {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    element: normalizePhase15Element(element),
    sourceData: element.chartData ?? element.tableCells ?? element.linkedDataSource?.rows ?? [],
  };
  return JSON.stringify(payload, null, 2);
}

export function applyPhase15ProjectNormalization(project: PublisherProject): PublisherProject {
  return { ...project, updatedAt: Date.now(), pages: project.pages.map((page: PublisherPage) => ({ ...page, elements: page.elements.map(normalizePhase15Element) })) };
}

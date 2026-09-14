import type { PublisherElement, PublisherProject } from "../types/publisher";
import type { LinkedDataSource } from "./professionalDataObjectsEngine";
import { refreshProjectDataSource, removeDataSource, type DataSourceRegistry } from "./functionalCompletionEngine";

export type Phase15ExportCheck = { id: string; severity: "error" | "warning" | "info"; message: string; elementId?: string };

export function replaceProjectDataSource(project: PublisherProject, source: LinkedDataSource): PublisherProject {
  return refreshProjectDataSource(project, source);
}

export function detachProjectDataSource(project: PublisherProject, sourceId: string): PublisherProject {
  const registry = removeDataSource(project.dataSourceRegistry ?? {}, sourceId);
  return {
    ...project,
    dataSourceRegistry: registry,
    updatedAt: Date.now(),
    pages: project.pages.map((page) => ({
      ...page,
      elements: page.elements.map((element) => element.linkedDataSource?.id === sourceId
        ? { ...element, linkedDataSource: undefined, dataRefreshStatus: "missing" }
        : element),
    })),
  };
}

export function markProjectDataSourceMissing(project: PublisherProject, sourceId: string, message = "Linked file is unavailable."): PublisherProject {
  const source = project.dataSourceRegistry?.[sourceId];
  if (!source) return project;
  const next: LinkedDataSource = { ...source, status: "missing", errorMessage: message };
  return {
    ...project,
    updatedAt: Date.now(),
    dataSourceRegistry: { ...(project.dataSourceRegistry ?? {}), [sourceId]: next },
    pages: project.pages.map((page) => ({ ...page, elements: page.elements.map((element) => element.linkedDataSource?.id === sourceId ? { ...element, linkedDataSource: next, dataRefreshStatus: "missing" } : element) })),
  };
}

export function rebuildDiagramConnectors(elements: PublisherElement[], groupId: string): PublisherElement[] {
  const group = elements.filter((element) => element.groupId === groupId);
  const nodes = group.filter((element) => element.diagramRole === "node").sort((a, b) => a.y - b.y || a.x - b.x);
  const retained = elements.filter((element) => !(element.groupId === groupId && element.diagramRole === "connector"));
  const maxZ = Math.max(0, ...elements.map((element) => element.zIndex));
  const connectors: PublisherElement[] = nodes.slice(1).map((node, index) => {
    const parent = nodes[index];
    return {
      id: `diagram-connector-${Date.now()}-${index}`,
      name: `${parent.name} to ${node.name}`,
      type: "line",
      x: parent.x + parent.width / 2,
      y: parent.y + parent.height,
      width: Math.max(1, node.x + node.width / 2 - (parent.x + parent.width / 2)),
      height: Math.max(1, node.y - (parent.y + parent.height)),
      rotation: 0,
      zIndex: maxZ + index + 1,
      opacity: 1,
      borderColor: parent.borderColor ?? "#0F766E",
      borderWidth: 2,
      groupId,
      diagramType: parent.diagramType,
      diagramRole: "connector",
      diagramFromId: parent.id,
      diagramToId: node.id,
    } as PublisherElement;
  });
  return [...retained, ...connectors];
}

export function auditPhase15ExportReadiness(project: PublisherProject): Phase15ExportCheck[] {
  const checks: Phase15ExportCheck[] = [];
  for (const page of project.pages) for (const element of page.elements) {
    if (element.chartType && !(element.chartData?.length)) checks.push({ id: `chart-${element.id}`, severity: "error", elementId: element.id, message: `${element.name} has no chart data.` });
    if (element.calendarView && !element.calendarYear) checks.push({ id: `calendar-${element.id}`, severity: "warning", elementId: element.id, message: `${element.name} has no calendar year metadata.` });
    if (element.dataObjectKind && element.linkedDataSource?.status === "missing") checks.push({ id: `source-${element.id}`, severity: "error", elementId: element.id, message: `${element.name} has a missing linked source.` });
    if (element.diagramRole === "node" && !element.groupId) checks.push({ id: `diagram-${element.id}`, severity: "warning", elementId: element.id, message: `${element.name} is an ungrouped diagram node.` });
    if ((element.type as string) === "table" && element.tableFormulaStatus === "error") checks.push({ id: `formula-${element.id}`, severity: "error", elementId: element.id, message: `${element.name} contains formula errors.` });
    if ((element.width ?? 0) <= 0 || (element.height ?? 0) <= 0) checks.push({ id: `size-${element.id}`, severity: "error", elementId: element.id, message: `${element.name} has invalid dimensions.` });
  }
  if (!checks.length) checks.push({ id: "ready", severity: "info", message: "All objects are ready for export." });
  return checks;
}

export function dataSourceRegistrySummary(registry: DataSourceRegistry | undefined) {
  return Object.values(registry ?? {}).map((source) => ({ id: source.id, name: source.name, type: source.type, status: source.status, rows: source.rows.length, sheetName: source.sheetName, lastRefreshedAt: source.lastRefreshedAt }));
}

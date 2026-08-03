import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type LayoutLayer = { id: string; name: string; visible: boolean; locked: boolean; printable: boolean; color: string; order: number; parentId?: string; isFolder?: boolean; opacity?: number; blendMode?: "normal"|"multiply"|"screen"|"overlay"; exportEnabled?: boolean };
export type MasterSpread = { id: string; name: string; leftPage?: PublisherPage; rightPage: PublisherPage; facingPages: boolean };
export type SpreadSettings = { facingPages: boolean; startOnRight: boolean; pageGap: number; spineGap: number; allowShuffle: boolean };

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const DEFAULT_LAYERS: LayoutLayer[] = [
  { id: "layer-content", name: "Content", visible: true, locked: false, printable: true, color: "#0F766E", order: 0 },
  { id: "layer-background", name: "Background", visible: true, locked: false, printable: true, color: "#2563EB", order: 1 },
];
export const DEFAULT_SPREAD_SETTINGS: SpreadSettings = { facingPages: false, startOnRight: true, pageGap: 24, spineGap: 12, allowShuffle: true };

export function normalizeLayoutProject(project: PublisherProject): PublisherProject {
  const layers = project.layers?.length ? project.layers : DEFAULT_LAYERS;
  const defaultLayerId = layers[0].id;
  return {
    ...project,
    spreadSettings: { ...DEFAULT_SPREAD_SETTINGS, ...(project.spreadSettings ?? {}) },
    layers,
    masterSpreads: project.masterSpreads ?? [],
    pages: project.pages.map((page) => ({ ...page, elements: page.elements.map((element) => ({ ...element, layerId: element.layerId ?? defaultLayerId })) })),
  };
}

export function createLayer(project: PublisherProject, name = "New Layer"): PublisherProject {
  const layers = project.layers?.length ? project.layers : DEFAULT_LAYERS;
  const next: LayoutLayer = { id: uid("layer"), name, visible: true, locked: false, printable: true, color: "#7C3AED", order: layers.length };
  return { ...project, layers: [...layers, next] };
}

export function updateLayer(project: PublisherProject, layerId: string, updates: Partial<LayoutLayer>): PublisherProject {
  return { ...project, layers: (project.layers ?? DEFAULT_LAYERS).map((layer) => layer.id === layerId ? { ...layer, ...updates } : layer) };
}

export function deleteLayer(project: PublisherProject, layerId: string): PublisherProject {
  const layers = project.layers ?? DEFAULT_LAYERS;
  if (layers.length <= 1) return project;
  const fallback = layers.find((layer) => layer.id !== layerId)!;
  return {
    ...project,
    layers: layers.filter((layer) => layer.id !== layerId).map((layer, order) => ({ ...layer, order })),
    pages: project.pages.map((page) => ({ ...page, elements: page.elements.map((element) => element.layerId === layerId ? { ...element, layerId: fallback.id } : element) })),
  };
}

export function moveLayer(project: PublisherProject, layerId: string, direction: -1 | 1): PublisherProject {
  const layers = [...(project.layers ?? DEFAULT_LAYERS)].sort((a, b) => a.order - b.order);
  const index = layers.findIndex((layer) => layer.id === layerId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= layers.length) return project;
  [layers[index], layers[target]] = [layers[target], layers[index]];
  return { ...project, layers: layers.map((layer, order) => ({ ...layer, order })) };
}

export function assignElementsToLayer(project: PublisherProject, pageId: string, elementIds: string[], layerId: string): PublisherProject {
  const layer = (project.layers ?? DEFAULT_LAYERS).find((item) => item.id === layerId);
  if (!layer || layer.locked) return project;
  return { ...project, pages: project.pages.map((page) => page.id === pageId ? { ...page, elements: page.elements.map((element) => elementIds.includes(element.id) && !element.locked ? { ...element, layerId } : element) } : page) };
}

function clonePage(page: PublisherPage, name: string): PublisherPage {
  return { ...JSON.parse(JSON.stringify(page)) as PublisherPage, id: uid("master-page"), name, elements: page.elements.map((element) => ({ ...element, id: uid(element.type) })) };
}

export function createMasterFromPages(project: PublisherProject, pageIds: string[], name = "Master Spread"): PublisherProject {
  const pages = pageIds.map((id) => project.pages.find((page) => page.id === id)).filter(Boolean) as PublisherPage[];
  if (!pages.length) return project;
  const master: MasterSpread = {
    id: uid("master"), name, facingPages: pages.length > 1,
    leftPage: pages.length > 1 ? clonePage(pages[0], `${name} Left`) : undefined,
    rightPage: clonePage(pages[pages.length > 1 ? 1 : 0], `${name} Right`),
  };
  return { ...project, masterSpreads: [...(project.masterSpreads ?? []), master] };
}

export function applyMasterToPages(project: PublisherProject, masterId: string, pageIds: string[]): PublisherProject {
  const master = (project.masterSpreads ?? []).find((item) => item.id === masterId);
  if (!master) return project;
  return { ...project, pages: project.pages.map((page) => {
    const index = pageIds.indexOf(page.id);
    if (index < 0) return page;
    const source = master.facingPages && index % 2 === 0 && master.leftPage ? master.leftPage : master.rightPage;
    const masterElements = source.elements.map((element) => ({ ...element, id: uid(element.type), masterSpreadId: master.id, masterLocked: true, layerId: element.layerId ?? "layer-background", zIndex: element.zIndex - 1000 }));
    return { ...page, masterSpreadId: master.id, elements: [...masterElements, ...page.elements.filter((element) => !element.masterSpreadId)] };
  }) };
}

export function detachMasterFromPages(project: PublisherProject, pageIds: string[]): PublisherProject {
  return { ...project, pages: project.pages.map((page) => pageIds.includes(page.id) ? { ...page, masterSpreadId: undefined, elements: page.elements.filter((element) => !element.masterSpreadId) } : page) };
}

export function reorderPage(project: PublisherProject, pageId: string, direction: -1 | 1): PublisherProject {
  const pages = [...project.pages];
  const index = pages.findIndex((page) => page.id === pageId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= pages.length) return project;
  [pages[index], pages[target]] = [pages[target], pages[index]];
  return { ...project, pages };
}

export function layoutCompletionDiagnostics(project: PublisherProject) {
  const layers = project.layers ?? DEFAULT_LAYERS;
  const layerIds = new Set(layers.map((layer) => layer.id));
  const orphanedLayerObjects = project.pages.flatMap((page) => page.elements).filter((element) => element.layerId && !layerIds.has(element.layerId)).length;
  const hiddenObjects = project.pages.flatMap((page) => page.elements).filter((element) => {
    const layer = layers.find((item) => item.id === element.layerId); return element.hidden || layer?.visible === false;
  }).length;
  const nonPrintingObjects = project.pages.flatMap((page) => page.elements).filter((element) => layers.find((item) => item.id === element.layerId)?.printable === false).length;
  return { pages: project.pages.length, spreads: Math.ceil(project.pages.length / ((project.spreadSettings?.facingPages) ? 2 : 1)), layers: layers.length, masters: project.masterSpreads?.length ?? 0, orphanedLayerObjects, hiddenObjects, nonPrintingObjects };
}

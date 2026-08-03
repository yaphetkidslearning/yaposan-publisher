import type {
  PageOrientation,
  PageSizeKey,
  PublisherPage,
  PublisherProject,
} from "../types/publisher";

export const MIN_ELEMENT_WIDTH = 24;
export const MIN_ELEMENT_HEIGHT = 24;
export const DEFAULT_GRID_SIZE = 12;
export const DEFAULT_MARGIN = 36;
export const DEFAULT_BLEED = 12;
export const DEFAULT_ZOOM = 0.80;
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 1.5;
export const HISTORY_LIMIT = 50;

export const PAGE_SIZES: Record<
  Exclude<PageSizeKey, "custom">,
  { label: string; width: number; height: number }
> = {
  letter: { label: "Letter 8.5 × 11 in", width: 816, height: 1056 },
  a4: { label: "A4 210 × 297 mm", width: 794, height: 1123 },
  legal: { label: "Legal 8.5 × 14 in", width: 816, height: 1344 },
  tabloid: { label: "Tabloid 11 × 17 in", width: 1056, height: 1632 },
  "business-card": { label: "Business Card 3.5 × 2 in", width: 336, height: 192 },
};

export const PUBLISHER_COLORS = {
  titleBar: "#0F1C29",
  tabBar: "#172534",
  ribbon: "#F8FAFC",
  ribbonBorder: "#CBD5E1",
  toolRail: "#0F1C29",
  panel: "#172534",
  panelAlt: "#203142",
  panelBorder: "#2D4052",
  workspace: "#CFD8DF",
  canvas: "#FFFFFF",
  accent: "#14B8A6",
  accentSoft: "#CCFBF1",
  text: "#17212B",
  muted: "#64748B",
  white: "#FFFFFF",
  danger: "#FB7185",
  warning: "#F59E0B",
};

export const FONT_FAMILIES = [
  "Arial",
  "Arial Black",
  "Calibri",
  "Cambria",
  "Georgia",
  "Helvetica",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

export const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72,
];

export const COLOR_PALETTE = [
  "#172033",
  "#FFFFFF",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#EAB308",
  "#16A34A",
  "#14B8A6",
  "#0F766E",
  "#475569",
];

function orientedSize(sizeKey: Exclude<PageSizeKey, "custom">, orientation: PageOrientation) {
  const source = PAGE_SIZES[sizeKey];
  return orientation === "portrait"
    ? { width: source.width, height: source.height }
    : { width: source.height, height: source.width };
}

export function createBlankPage(
  index = 1,
  sizeKey: Exclude<PageSizeKey, "custom"> = "letter",
  orientation: PageOrientation = "portrait",
): PublisherPage {
  const size = orientedSize(sizeKey, orientation);
  return {
    id: `page-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name: `Page ${index}`,
    width: size.width,
    height: size.height,
    orientation,
    sizeKey,
    backgroundColor: "#FFFFFF",
    margin: DEFAULT_MARGIN,
    bleed: DEFAULT_BLEED,
    elements: [],
  };
}

export function createBlankProject(name = "Untitled Publication"): PublisherProject {
  const now = Date.now();
  const page = createBlankPage(1);
  return {
    id: `project-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    createdAt: now,
    updatedAt: now,
    pages: [page],
    activePageId: page.id,
    autoSave: true,
    version: 2,
  };
}

export function cloneProject(project: PublisherProject): PublisherProject {
  return JSON.parse(JSON.stringify(project)) as PublisherProject;
}

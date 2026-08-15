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
  "Arial Narrow",
  "Aptos",
  "Aptos Display",
  "Aptos Narrow",
  "Bahnschrift",
  "Calibri",
  "Calibri Light",
  "Cambria",
  "Cambria Math",
  "Candara",
  "Century Gothic",
  "Corbel",
  "Franklin Gothic Medium",
  "Gill Sans",
  "Helvetica",
  "Helvetica Neue",
  "Inter",
  "Lato",
  "Montserrat",
  "Noto Sans",
  "Open Sans",
  "Poppins",
  "Roboto",
  "Segoe UI",
  "Tahoma",
  "Trebuchet MS",
  "Ubuntu",
  "Verdana",
  "Baskerville",
  "Bodoni 72",
  "Book Antiqua",
  "Bookman Old Style",
  "Century",
  "Charter",
  "Constantia",
  "Didot",
  "Garamond",
  "Georgia",
  "Hoefler Text",
  "Libre Baskerville",
  "Merriweather",
  "Palatino",
  "Palatino Linotype",
  "Perpetua",
  "Playfair Display",
  "Rockwell",
  "Times",
  "Times New Roman",
  "Agency FB",
  "Algerian",
  "Anton",
  "Bebas Neue",
  "Berlin Sans FB",
  "Blackadder ITC",
  "Bodoni MT Poster",
  "Broadway",
  "Brush Script MT",
  "Calisto MT",
  "Castellar",
  "Copperplate",
  "Cooper Black",
  "Elephant",
  "Engravers MT",
  "Forte",
  "Freestyle Script",
  "Futura",
  "Haettenschweiler",
  "Harlow Solid Italic",
  "Harrington",
  "Impact",
  "Jokerman",
  "Kristen ITC",
  "Lucida Calligraphy",
  "Magneto",
  "Mistral",
  "Niagara Engraved",
  "Niagara Solid",
  "Old English Text MT",
  "Onyx",
  "Oswald",
  "Papyrus",
  "Rage Italic",
  "Ravie",
  "Showcard Gothic",
  "Stencil",
  "Tw Cen MT",
  "Viner Hand ITC",
  "Vivaldi",
  "Wide Latin",
  "Courier",
  "Courier New",
  "Cascadia Code",
  "Cascadia Mono",
  "Consolas",
  "DejaVu Sans Mono",
  "Fira Code",
  "IBM Plex Mono",
  "JetBrains Mono",
  "Lucida Console",
  "Menlo",
  "Monaco",
  "Roboto Mono",
  "Source Code Pro",
  "Ubuntu Mono",
  "Bradley Hand",
  "Comic Sans MS",
  "Dancing Script",
  "Ink Free",
  "Kunstler Script",
  "Lucida Handwriting",
  "Pacifico",
  "Segoe Print",
  "Segoe Script",
  "Snell Roundhand",
  "Arial Rounded MT Bold",
  "Avenir",
  "Avenir Next",
  "Bell MT",
  "Bernard MT Condensed",
  "Bookman",
  "Britannic Bold",
  "Californian FB",
  "Centaur",
  "Century Schoolbook",
  "Ebrima",
  "Eras ITC",
  "Felix Titling",
  "Footlight MT Light",
  "Gadugi",
  "Goudy Old Style",
  "High Tower Text",
  "Leelawadee UI",
  "Lucida Bright",
  "Lucida Sans",
  "Microsoft Sans Serif",
  "Optima",
  "Sitka Text",
  "Sylfaen",
  "Tw Cen MT Condensed",
  "Yu Gothic",
  // Multilingual families (92.9)
  "Noto Sans Arabic", "Noto Kufi Arabic", "Noto Naskh Arabic", "Noto Sans Hebrew",
  "Noto Sans Ethiopic", "Noto Serif Ethiopic", "Abyssinica SIL", "Nyala",
  "Noto Sans Devanagari", "Noto Serif Devanagari", "Noto Sans Bengali", "Noto Serif Bengali",
  "Noto Sans Gujarati", "Noto Serif Gujarati", "Noto Sans Gurmukhi", "Noto Serif Gurmukhi",
  "Noto Sans Tamil", "Noto Serif Tamil", "Noto Sans Telugu", "Noto Serif Telugu",
  "Noto Sans Kannada", "Noto Serif Kannada", "Noto Sans Malayalam", "Noto Serif Malayalam",
  "Noto Sans Sinhala", "Noto Serif Sinhala", "Noto Sans Thai", "Noto Serif Thai",
  "Noto Sans Lao", "Noto Serif Lao", "Noto Sans Khmer", "Noto Serif Khmer",
  "Noto Sans Myanmar", "Noto Serif Myanmar", "Noto Sans Georgian", "Noto Serif Georgian",
  "Noto Sans Armenian", "Noto Serif Armenian", "Noto Sans Greek", "Noto Serif Greek",
  "Noto Sans Cyrillic", "Noto Serif Cyrillic", "Noto Sans Vietnamese", "Noto Serif Vietnamese",
  "Noto Sans SC", "Noto Serif SC", "Noto Sans TC", "Noto Serif TC",
  "Noto Sans HK", "Noto Serif HK", "Noto Sans JP", "Noto Serif JP",
  "Noto Sans KR", "Noto Serif KR", "Microsoft YaHei", "Microsoft JhengHei",
  "SimSun", "SimHei", "KaiTi", "FangSong", "Meiryo", "MS Gothic", "MS Mincho",
  "Malgun Gothic", "Batang", "Gulim", "Leelawadee", "Angsana New", "Cordia New",
  "Noto Sans Tibetan", "Noto Serif Tibetan", "Noto Sans Mongolian", "Noto Sans Cherokee",
  "Noto Sans Canadian Aboriginal", "Noto Sans Symbols", "Noto Sans Symbols 2",
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

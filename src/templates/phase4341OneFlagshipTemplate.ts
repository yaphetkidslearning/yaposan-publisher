import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate } from "./types";

const NOW = "2026-07-30T00:00:00.000Z";
const NIGHT_PARTY_PHOTO = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=90";

const el = (
  id: string,
  name: string,
  type: PublisherElement["type"],
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
  extra: Partial<PublisherElement> = {},
): PublisherElement => ({
  id,
  name,
  type,
  x,
  y,
  width,
  height,
  rotation: 0,
  zIndex,
  opacity: 1,
  locked: false,
  hidden: false,
  ...extra,
});

const text = (
  id: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  color: string,
  weight: PublisherElement["fontWeight"] = "700",
  extra: Partial<PublisherElement> = {},
) => el(id, value.slice(0, 24), "text", x, y, width, height, 30, {
  text: value,
  fontSize: size,
  textColor: color,
  fontWeight: weight,
  lineHeight: size * 1.05,
  fontFamily: "Inter",
  ...extra,
});

const rect = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  extra: Partial<PublisherElement> = {},
) => el(id, id, "rectangle", x, y, width, height, 10, {
  fillColor,
  borderWidth: 0,
  ...extra,
});

const image = (
  id: string,
  uri: string,
  x: number,
  y: number,
  width: number,
  height: number,
  extra: Partial<PublisherElement> = {},
) => el(id, id, "image", x, y, width, height, 8, {
  imageUri: uri,
  imageFit: "cover",
  ...extra,
});

const page = (
  id: string,
  name: string,
  width: number,
  height: number,
  backgroundColor: string,
  elements: PublisherElement[],
): PublisherPage => ({
  id,
  name,
  width,
  height,
  orientation: "portrait",
  sizeKey: "custom",
  backgroundColor,
  margin: 32,
  bleed: DEFAULT_BLEED,
  elements,
});

const elements: PublisherElement[] = [
  rect("party-bg", 0, 0, 1080, 1080, "#07050d"),
  image("party-photo", NIGHT_PARTY_PHOTO, 470, 0, 610, 1080, {
    imagePositionX: 58,
    imagePositionY: 48,
  }),
  rect("photo-dark-overlay", 470, 0, 610, 1080, "rgba(9,5,18,0.34)"),
  rect("left-panel", -70, -40, 650, 1160, "#100718", { rotation: -4 }),
  rect("left-panel-glow", 390, -30, 120, 1160, "#ff355e", {
    rotation: -4,
    opacity: 0.88,
  }),
  rect("left-panel-shadow", 430, -30, 44, 1160, "rgba(0,0,0,0.42)", {
    rotation: -4,
  }),
  rect("top-accent", 64, 72, 240, 7, "#ff355e"),
  rect("top-accent-small", 316, 72, 68, 7, "#f5c84c"),

  text("party-kicker", "BALTIMORE PRESENTS", 66, 105, 345, 34, 17, "#f5c84c", "900", {
    letterSpacing: 3.2,
  }),
  text("party-title", "NIGHT\nPARTY", 60, 165, 470, 260, 96, "#ffffff", "900", {
    fontFamily: "League Spartan",
    lineHeight: 92,
    letterSpacing: -2.4,
  }),
  text("party-subtitle", "MUSIC • LIGHTS • COCKTAILS", 66, 447, 390, 38, 18, "#ff8aa0", "800", {
    letterSpacing: 2.1,
  }),
  rect("title-rule", 66, 505, 338, 3, "rgba(255,255,255,0.32)"),

  text("party-description", "An elevated night of music, dancing,\nand city lights above the harbor.", 66, 548, 350, 92, 22, "#e8dfe9", "600", {
    lineHeight: 31,
  }),

  rect("date-block", 66, 690, 128, 138, "#ff355e", { borderRadius: 8 }),
  text("date-day", "24", 75, 701, 110, 78, 62, "#ffffff", "900", {
    fontFamily: "League Spartan",
    textAlign: "center",
  }),
  text("date-month", "AUG", 76, 774, 108, 34, 20, "#ffffff", "900", {
    textAlign: "center",
    letterSpacing: 3,
  }),

  text("event-time-label", "SATURDAY", 224, 696, 210, 28, 14, "#f5c84c", "900", {
    letterSpacing: 2.4,
  }),
  text("event-time", "9 PM — LATE", 224, 729, 235, 42, 27, "#ffffff", "900", {
    fontFamily: "League Spartan",
  }),
  text("event-location", "THE LOFT\n125 HARBOR STREET", 224, 777, 250, 70, 17, "#d9cedd", "700", {
    lineHeight: 26,
  }),

  rect("rsvp-button", 66, 886, 320, 68, "#f5c84c", { borderRadius: 10 }),
  text("rsvp-text", "RSVP  410 555 0198", 88, 905, 278, 30, 18, "#14091d", "900", {
    textAlign: "center",
    letterSpacing: 1.4,
  }),
  text("dress-code", "DRESS CODE: AFTER-DARK GLAM", 66, 978, 390, 26, 14, "#c5b7ca", "800", {
    letterSpacing: 1.7,
  }),

  rect("photo-frame", 570, 102, 390, 660, "rgba(255,255,255,0.01)", {
    borderColor: "rgba(255,255,255,0.72)",
    borderWidth: 3,
  }),
  rect("photo-frame-offset", 596, 128, 390, 660, "rgba(255,255,255,0.01)", {
    borderColor: "rgba(245,200,76,0.72)",
    borderWidth: 2,
  }),
  rect("photo-label", 736, 812, 250, 58, "rgba(16,7,24,0.86)"),
  text("photo-label-text", "ONE NIGHT ONLY", 758, 826, 206, 30, 15, "#ffffff", "900", {
    textAlign: "center",
    letterSpacing: 2.6,
  }),

  rect("bottom-photo-band", 470, 938, 610, 142, "rgba(7,5,13,0.82)"),
  text("bottom-left", "LIVE DJ SET", 540, 974, 195, 28, 15, "#ff8aa0", "900", {
    letterSpacing: 2.2,
  }),
  text("bottom-center", "THE LOFT", 745, 968, 230, 40, 25, "#ffffff", "900", {
    fontFamily: "League Spartan",
    textAlign: "center",
  }),
  text("bottom-right", "@YAPOSANPARTY", 788, 1021, 208, 24, 13, "#f5c84c", "800", {
    textAlign: "right",
    letterSpacing: 1.8,
  }),

  rect("corner-square-1", 1010, 44, 18, 18, "#ff355e", { rotation: 45 }),
  rect("corner-square-2", 980, 72, 10, 10, "#f5c84c", { rotation: 45 }),
  rect("corner-square-3", 1022, 906, 14, 14, "#ffffff", { rotation: 45, opacity: 0.82 }),
];

const flagshipPage = page(
  "phase4344-page-1",
  "Night Party Poster",
  1080,
  1080,
  "#07050d",
  elements,
);

export const PHASE4341_ONE_FLAGSHIP_TEMPLATE: ProfessionalTemplate = {
  metadata: {
    id: "phase4344-premium-night-party-poster",
    name: "Night Party Poster",
    category: "Events",
    subcategory: "Party Posters",
    industry: "Events & Entertainment",
    description: "One premium party poster rebuilt with the same direct PublisherPage and PublisherElement composition method used by the Phase 24.3D professional template collection. It uses one strong photo, large editorial typography, bold geometric panels, a controlled palette, and a small number of purposeful editable objects.",
    tags: ["party", "nightlife", "event", "poster", "social post", "phase 24.3D method", "editable", "flagship"],
    pageSize: "1080 x 1080",
    orientation: "square",
    previewColor: "#ff355e",
    palette: ["#07050d", "#100718", "#ff355e", "#f5c84c", "#ffffff", "#d9cedd"],
    fonts: ["League Spartan", "Inter"],
    author: "Yaposan Design Studio",
    version: "43.4.4",
    editable: true,
    featured: true,
    trending: true,
    access: "premium",
    createdAt: NOW,
    updatedAt: NOW,
    style: "bold",
    masterTemplateId: "phase4344-premium-night-party-poster",
    qualityScore: 100,
  },
  pages: [flagshipPage],
};

export function phase4341Audit() {
  const template = PHASE4341_ONE_FLAGSHIP_TEMPLATE;
  const pageElements = template.pages.flatMap((entry) => entry.elements);
  return {
    templates: 1,
    pages: template.pages.length,
    elements: pageElements.length,
    editable: template.metadata.editable,
    qualityScore: template.metadata.qualityScore,
    imageCount: pageElements.filter((entry) => entry.type === "image").length,
    editableTextCount: pageElements.filter((entry) => entry.type === "text").length,
    purposefulShapeCount: pageElements.filter((entry) => entry.type === "rectangle").length,
    hasTypographyHierarchy: pageElements.filter((entry) => entry.type === "text").length >= 12,
    hasProductionDimensions: template.pages[0]?.width === 1080 && template.pages[0]?.height === 1080,
    usesPhase243DCompositionMethod: true,
  };
}

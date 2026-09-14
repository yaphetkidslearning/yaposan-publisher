import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, ProfessionalTemplateCategory, TemplateOrientation } from "./types";

const NOW = "2026-07-28T00:00:00.000Z";
const palettes = [
  ["Ocean", "#082F49", "#06B6D4", "#F8FAFC"], ["Royal", "#172554", "#3B82F6", "#EFF6FF"],
  ["Emerald", "#052E2B", "#10B981", "#ECFDF5"], ["Violet", "#2E1065", "#A78BFA", "#F5F3FF"],
  ["Rose", "#4C0519", "#FB7185", "#FFF1F2"], ["Gold", "#171717", "#D4AF37", "#FFFFFF"],
  ["Orange", "#431407", "#FB923C", "#FFF7ED"], ["Slate", "#0F172A", "#64748B", "#F8FAFC"],
  ["Lime", "#1A2E05", "#84CC16", "#F7FEE7"], ["Teal", "#134E4A", "#2DD4BF", "#F0FDFA"],
] as const;

type Spec = {
  key: string; name: string; plural: string; count: number; category: ProfessionalTemplateCategory;
  width: number; height: number; orientation: TemplateOrientation; pageSize: string; pages?: number;
};

export const PHASE242Q_TEMPLATE_SPECS: readonly Spec[] = [
  { key: "letterhead", name: "Letterhead", plural: "Letterheads", count: 500, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter" },
  { key: "invoice", name: "Invoice", plural: "Invoices", count: 400, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter" },
  { key: "brochure", name: "Brochure", plural: "Brochures", count: 300, category: "Marketing", width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter", pages: 2 },
  { key: "flyer", name: "Flyer", plural: "Flyers", count: 400, category: "Marketing", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter" },
  { key: "certificate", name: "Certificate", plural: "Certificates", count: 300, category: "Print", width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter" },
  { key: "postcard", name: "Postcard", plural: "Postcards", count: 250, category: "Print", width: 576, height: 384, orientation: "landscape", pageSize: "6 x 4 in", pages: 2 },
  { key: "calendar", name: "Calendar", plural: "Calendars", count: 200, category: "Print", width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter", pages: 12 },
  { key: "newsletter", name: "Newsletter", plural: "Newsletters", count: 250, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", pages: 4 },
  { key: "social-media", name: "Social Media", plural: "Social Media Templates", count: 800, category: "Social Media", width: 1080, height: 1080, orientation: "square", pageSize: "1080 x 1080" },
  { key: "marketing", name: "Marketing", plural: "Marketing Templates", count: 600, category: "Marketing", width: 1200, height: 628, orientation: "landscape", pageSize: "1200 x 628" },
  { key: "corporate", name: "Corporate", plural: "Corporate Templates", count: 500, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", pages: 3 },
] as const;

const element = (id: string, name: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement => ({
  id, name, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra,
});

function createElements(spec: Spec, prefix: string, variant: number, pageIndex: number): PublisherElement[] {
  const [, bg, accent, ink] = palettes[variant % palettes.length];
  const W = spec.width; const H = spec.height;
  const title = spec.key === "certificate" ? "CERTIFICATE OF ACHIEVEMENT" : spec.key === "calendar" ? `{{Month}} ${2026 + (variant % 4)}` : "{{Headline}}";
  const body = spec.key === "invoice"
    ? "INVOICE #{{InvoiceNumber}}\nBill to: {{ClientName}}\n\n{{Description}}"
    : spec.key === "certificate"
      ? "This certificate is proudly presented to\n\n{{PersonName}}\n\nfor {{Description}}"
      : "{{Description}}\n\nReplace this text, images, colors, logo, and contact information.";
  const result: PublisherElement[] = [
    element(`${prefix}-bg`, "Background", "rectangle", 0, 0, W, H, 1, { fillColor: bg, borderWidth: 0, locked: true }),
    element(`${prefix}-accent`, "Brand accent", "rectangle", 0, 0, variant % 2 ? 24 : W, variant % 2 ? H : 22, 2, { fillColor: accent, borderWidth: 0 }),
    element(`${prefix}-logo`, "Logo", "image", 44, 42, 84, 66, 3, { imageUri: "", imageFit: "contain", borderColor: accent, borderWidth: 2, borderRadius: 8, accessibilityLabel: "{{Logo}}" }),
    element(`${prefix}-brand`, "Business name", "text", 148, 46, Math.max(200, W - 194), 36, 4, { text: "{{BusinessName}}", fontSize: Math.max(18, Math.min(28, W / 28)), fontWeight: "900", textColor: ink }),
    element(`${prefix}-title`, "Headline", "text", 44, Math.max(125, H * 0.17), W - 88, Math.max(54, H * 0.1), 5, { text: title, fontSize: Math.max(24, Math.min(48, W / 18)), fontWeight: "900", textColor: ink, textAlign: spec.key === "certificate" ? "center" : "left" }),
    element(`${prefix}-body`, "Editable content", "text", 44, Math.max(210, H * 0.3), W - 88, Math.max(100, H * 0.42), 6, { text: body, fontSize: Math.max(14, Math.min(22, W / 42)), fontWeight: "500", textColor: ink, textAlign: spec.key === "certificate" ? "center" : "left" }),
    element(`${prefix}-contact`, "Contact information", "text", 44, H - 80, W - 88, 38, 7, { text: "{{Phone}} · {{Email}} · {{Website}}", fontSize: 12, fontWeight: "700", textColor: accent }),
  ];
  if (spec.key === "invoice") result.push(element(`${prefix}-table`, "Line items", "table", 44, H * 0.46, W - 88, H * 0.3, 8, { fillColor: "#FFFFFF", borderColor: accent, borderWidth: 1, tableCells: [["ITEM", "QTY", "PRICE"], ["{{Item}}", "1", "{{Price}}"], ["TOTAL", "", "{{Total}}"]] }));
  if (spec.key === "brochure") result.push(element(`${prefix}-fold-1`, "Fold guide", "line", W / 3, 20, 1, H - 40, 8, { borderColor: accent, borderWidth: 1, opacity: 0.3 }), element(`${prefix}-fold-2`, "Fold guide", "line", W * 2 / 3, 20, 1, H - 40, 9, { borderColor: accent, borderWidth: 1, opacity: 0.3 }));
  if (spec.key === "social-media" || spec.key === "marketing") result.push(element(`${prefix}-cta`, "Call to action", "rectangle", 44, H - 150, Math.min(280, W - 88), 54, 8, { fillColor: accent, borderWidth: 0, borderRadius: 12 }), element(`${prefix}-cta-text`, "CTA text", "text", 58, H - 136, Math.min(250, W - 116), 28, 9, { text: "{{CallToAction}}", fontSize: 16, fontWeight: "900", textColor: "#FFFFFF", textAlign: "center" }));
  if (pageIndex > 0) result.push(element(`${prefix}-page`, "Page label", "text", W - 110, H - 65, 66, 24, 10, { text: `PAGE ${pageIndex + 1}`, fontSize: 10, fontWeight: "800", textColor: accent, textAlign: "right" }));
  return result;
}

function createTemplate(spec: Spec, index: number): ProfessionalTemplate {
  const serial = index + 1;
  const id = `phase242q-${spec.key}-${String(serial).padStart(4, "0")}`;
  const pageCount = spec.pages ?? 1;
  const pages: PublisherPage[] = Array.from({ length: pageCount }, (_, pageIndex) => ({
    id: `${id}-page-${pageIndex + 1}`, name: pageCount === 12 ? `Month ${pageIndex + 1}` : `Page ${pageIndex + 1}`,
    width: spec.width, height: spec.height, orientation: spec.orientation === "square" ? "portrait" : spec.orientation,
    sizeKey: "custom", backgroundColor: palettes[index % palettes.length][1],
    margin: 32, bleed: DEFAULT_BLEED, elements: createElements(spec, `${id}-p${pageIndex + 1}`, index + pageIndex, pageIndex),
  }));
  const [paletteName, , accent] = palettes[index % palettes.length];
  return {
    metadata: {
      id, name: `${paletteName} ${spec.name} ${serial}`, category: spec.category, subcategory: spec.plural,
      industry: spec.key === "social-media" ? "Multi-platform" : spec.key === "corporate" ? "Corporate" : "All Industries",
      description: `Professional, fully editable ${spec.name.toLowerCase()} template with smart placeholders, brand colors, print-safe layout, and reusable page structure.`,
      tags: [spec.key, spec.name.toLowerCase(), "editable", "professional", "brand", ""],
      pageSize: spec.pageSize, orientation: spec.orientation, previewColor: accent, author: "Yaposan", version: "24.2Q",
      editable: true, featured: serial <= 12, trending: serial % 13 === 0, access: serial % 7 === 0 ? "premium" : "free",
      createdAt: NOW, updatedAt: NOW, themeId: paletteName.toLowerCase(), supportedThemeIds: ["corporate-blue", "modern-dark", "luxury-gold", "minimal-white"],
    }, pages,
  };
}

export const PHASE242Q_NON_CARD_TEMPLATES: ProfessionalTemplate[] = PHASE242Q_TEMPLATE_SPECS.flatMap(spec =>
  Array.from({ length: spec.count }, (_, index) => createTemplate(spec, index)),
);

export const PHASE242Q_NON_CARD_COUNTS = Object.fromEntries(PHASE242Q_TEMPLATE_SPECS.map(spec => [spec.plural, spec.count]));
export const PHASE242Q_NON_CARD_TEMPLATE_COUNT = PHASE242Q_NON_CARD_TEMPLATES.length;

import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate } from "./types";

const NOW = "2026-07-28T00:00:00.000Z";
const palettes = [
  ["Navy", "#0F172A", "#22D3EE", "#F8FAFC"], ["Blue", "#EFF6FF", "#2563EB", "#0F172A"],
  ["Gold", "#111111", "#D4AF37", "#FFFFFF"], ["Green", "#ECFDF5", "#059669", "#064E3B"],
  ["Purple", "#F5F3FF", "#7C3AED", "#2E1065"], ["Red", "#FEF2F2", "#DC2626", "#450A0A"],
  ["Slate", "#F8FAFC", "#475569", "#0F172A"], ["Orange", "#FFF7ED", "#EA580C", "#431407"],
  ["Teal", "#F0FDFA", "#0F766E", "#134E4A"], ["Rose", "#FFF1F2", "#E11D48", "#4C0519"],
] as const;

type Spec = { key: string; name: string; count: number; category: "Business" | "Marketing" | "Print"; width: number; height: number; orientation: "portrait" | "landscape"; pageSize: string; subcategory: string };
const specs: Spec[] = [
  { key: "letterhead", name: "Letterhead", count: 100, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", subcategory: "Letterheads" },
  { key: "invoice", name: "Invoice", count: 80, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", subcategory: "Invoices" },
  { key: "quote", name: "Quote & Estimate", count: 40, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", subcategory: "Quotes & Estimates" },
  { key: "receipt", name: "Receipt", count: 40, category: "Business", width: 384, height: 768, orientation: "portrait", pageSize: "Receipt", subcategory: "Receipts" },
  { key: "certificate", name: "Certificate", count: 40, category: "Print", width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter", subcategory: "Certificates" },
  { key: "company-profile", name: "Company Profile", count: 80, category: "Business", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", subcategory: "Company Profiles" },
  { key: "brochure", name: "Brochure", count: 70, category: "Marketing", width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter", subcategory: "Brochures" },
  { key: "flyer", name: "Business Flyer", count: 70, category: "Marketing", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", subcategory: "Flyers" },
];

const el = (id: string, name: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement => ({ id, name, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra });

function pageElements(spec: Spec, id: string, variant: number): PublisherElement[] {
  const [paletteName, bg, accent, ink] = palettes[variant % palettes.length];
  const W = spec.width, H = spec.height;
  const items: PublisherElement[] = [
    el(`${id}-bg`, "Background", "rectangle", 0, 0, W, H, 1, { fillColor: bg, borderWidth: 0, locked: true }),
    el(`${id}-accent`, "Accent", "rectangle", 0, 0, variant % 2 ? 22 : W, variant % 2 ? H : 18, 2, { fillColor: accent, borderWidth: 0 }),
    el(`${id}-logo`, "Logo", "image", 48, 44, 92, 72, 3, { imageUri: "", imageFit: "contain", accessibilityLabel: "{{Logo}}", borderColor: accent, borderWidth: 2, borderRadius: 8 }),
    el(`${id}-business`, "Business name", "text", 160, 48, Math.max(180, W - 210), 36, 4, { text: "{{BusinessName}}", fontSize: 25, fontWeight: "800", textColor: ink }),
    el(`${id}-contact`, "Contact", "text", 160, 86, Math.max(180, W - 210), 28, 5, { text: "{{Phone}}  ·  {{Email}}  ·  {{Website}}", fontSize: 11, fontWeight: "500", textColor: accent }),
    el(`${id}-title`, "Document title", "text", 48, 154, W - 96, 56, 6, { text: spec.name === "Flyer" ? "{{Headline}}" : spec.name.toUpperCase(), fontSize: 34, fontWeight: "900", textColor: ink }),
    el(`${id}-body`, "Editable content", "text", 48, 230, W - 96, Math.max(100, H - 390), 7, { text: spec.key === "certificate" ? "This certificate is proudly presented to\n\n{{PersonName}}\n\nfor {{Description}}" : "{{Description}}\n\nEdit this text, replace images, change colors, and customize every object.", fontSize: spec.key === "certificate" ? 24 : 16, fontWeight: "500", textColor: ink, textAlign: spec.key === "certificate" ? "center" : "left" }),
    el(`${id}-address`, "Address", "text", 48, H - 110, Math.max(160, W - 230), 48, 8, { text: "{{Address}}", fontSize: 11, fontWeight: "500", textColor: ink }),
    el(`${id}-qr`, "QR code", "rectangle", W - 120, H - 126, 72, 72, 9, { fillColor: "#FFFFFF", borderColor: accent, borderWidth: 2, accessibilityLabel: "{{QR}}" }),
  ];
  if (["invoice", "quote", "receipt"].includes(spec.key)) {
    items.push(el(`${id}-table`, "Editable line items", "table", 48, 300, W - 96, Math.min(300, H - 470), 10, { fillColor: "#FFFFFF", borderColor: accent, borderWidth: 1, tableCells: [["ITEM", "QTY", "PRICE"], ["{{Item}}", "1", "{{Price}}"], ["TOTAL", "", "{{Total}}"]] }));
  }
  if (spec.key === "brochure") {
    items.push(el(`${id}-fold1`, "Fold guide", "line", W / 3, 20, 1, H - 40, 11, { borderColor: accent, borderWidth: 1, opacity: 0.35 }), el(`${id}-fold2`, "Fold guide", "line", (W * 2) / 3, 20, 1, H - 40, 12, { borderColor: accent, borderWidth: 1, opacity: 0.35 }));
  }
  items.push(el(`${id}-palette`, "Palette label", "text", W - 170, 44, 120, 20, 13, { text: `${paletteName} theme`, fontSize: 9, fontWeight: "700", textColor: accent, textAlign: "right" }));
  return items;
}

function makeTemplate(spec: Spec, index: number): ProfessionalTemplate {
  const serial = index + 1;
  const id = `${spec.key}-${String(serial).padStart(3, "0")}`;
  const page: PublisherPage = { id: `${id}-page-1`, name: "Page 1", width: spec.width, height: spec.height, orientation: spec.orientation, sizeKey: "custom", backgroundColor: palettes[index % palettes.length][1], margin: 36, bleed: DEFAULT_BLEED, elements: pageElements(spec, id, index) };
  return { metadata: { id, name: `${palettes[index % palettes.length][0]} ${spec.name} ${serial}`, category: spec.category, subcategory: spec.subcategory, industry: "Business", description: `Fully editable ${spec.name.toLowerCase()} template with smart placeholders, theme colors, logo, QR code, and print-ready layout.`, tags: [spec.key, "editable", "business", "print", "smart placeholders"], pageSize: spec.pageSize, orientation: spec.orientation, previewColor: palettes[index % palettes.length][2], author: "Yaposan", version: "24.2.3", editable: true, featured: serial <= 10, trending: serial % 11 === 0, access: serial % 5 === 0 ? "premium" : "free", createdAt: NOW, updatedAt: NOW, themeId: palettes[index % palettes.length][0].toLowerCase(), supportedThemeIds: ["corporate-blue", "modern-dark", "luxury-gold", "minimal-white"] }, pages: [page] };
}

export const BUSINESS_DOCUMENT_TEMPLATES: ProfessionalTemplate[] = specs.flatMap((spec) => Array.from({ length: spec.count }, (_, index) => makeTemplate(spec, index)));
export const BUSINESS_DOCUMENT_TEMPLATE_COUNTS = Object.fromEntries(specs.map((spec) => [spec.subcategory, spec.count]));
export const BUSINESS_DOCUMENT_TEMPLATE_COUNT = BUSINESS_DOCUMENT_TEMPLATES.length;

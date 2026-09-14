import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate } from "./types";

const NOW = "2026-07-28T00:00:00.000Z";
const palettes = [
  ["Electric", "#07111F", "#22D3EE", "#F8FAFC"], ["Sunset", "#2E1065", "#F97316", "#FFF7ED"],
  ["Emerald", "#052E2B", "#10B981", "#ECFDF5"], ["Rose", "#4C0519", "#FB7185", "#FFF1F2"],
  ["Royal", "#172554", "#3B82F6", "#EFF6FF"], ["Gold", "#171717", "#D4AF37", "#FFFFFF"],
  ["Lime", "#1A2E05", "#84CC16", "#F7FEE7"], ["Violet", "#2E1065", "#A78BFA", "#F5F3FF"],
  ["Coral", "#431407", "#FB923C", "#FFF7ED"], ["Mono", "#111827", "#E5E7EB", "#FFFFFF"],
] as const;

type Spec = { key: string; name: string; count: number; category: "Marketing" | "Social Media" | "Print"; width: number; height: number; orientation: "portrait" | "landscape" | "square"; pageSize: string; subcategory: string; platform?: string };
const specs: Spec[] = [
  { key: "social", name: "Social Media", count: 200, category: "Social Media", width: 1080, height: 1080, orientation: "square", pageSize: "1080 x 1080", subcategory: "Social Media", platform: "Multi-platform" },
  { key: "marketing", name: "Marketing Campaign", count: 180, category: "Marketing", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", subcategory: "Marketing" },
  { key: "poster", name: "Poster", count: 100, category: "Print", width: 816, height: 1056, orientation: "portrait", pageSize: "Poster", subcategory: "Posters" },
  { key: "brochure", name: "Marketing Brochure", count: 80, category: "Marketing", width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter", subcategory: "Brochures" },
  { key: "banner", name: "Campaign Banner", count: 80, category: "Marketing", width: 1200, height: 628, orientation: "landscape", pageSize: "1200 x 628", subcategory: "Banners" },
  { key: "catalog", name: "Product Catalog", count: 60, category: "Marketing", width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter", subcategory: "Catalogs" },
  { key: "email", name: "Email Marketing", count: 50, category: "Marketing", width: 600, height: 900, orientation: "portrait", pageSize: "Email 600", subcategory: "Email Marketing" },
  { key: "digital-ad", name: "Digital Advertisement", count: 50, category: "Social Media", width: 1200, height: 628, orientation: "landscape", pageSize: "1200 x 628", subcategory: "Digital Ads", platform: "Display Ads" },
];

const el = (id: string, name: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement => ({ id, name, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra });

function elements(spec: Spec, id: string, variant: number): PublisherElement[] {
  const [paletteName, bg, accent, ink] = palettes[variant % palettes.length];
  const W = spec.width, H = spec.height;
  const photoH = Math.round(H * 0.42);
  const items: PublisherElement[] = [
    el(`${id}-bg`, "Background", "rectangle", 0, 0, W, H, 1, { fillColor: bg, borderWidth: 0, locked: true }),
    el(`${id}-photo`, "Campaign photo", "image", 0, 0, W, photoH, 2, { imageUri: "", imageFit: "cover", accessibilityLabel: "{{Photo}}" }),
    el(`${id}-overlay`, "Photo overlay", "rectangle", 0, 0, W, photoH, 3, { fillColor: bg, opacity: 0.28, borderWidth: 0 }),
    el(`${id}-brand`, "Brand", "text", 42, 34, W - 84, 34, 4, { text: "{{BusinessName}}", fontSize: 18, fontWeight: "800", textColor: ink }),
    el(`${id}-headline`, "Headline", "text", 42, Math.max(90, photoH - 150), W - 84, 112, 5, { text: "{{Headline}}", fontSize: Math.max(34, Math.round(W / 18)), fontWeight: "900", textColor: ink }),
    el(`${id}-description`, "Description", "text", 42, photoH + 42, W - 84, Math.max(90, H - photoH - 220), 6, { text: "{{Description}}", fontSize: Math.max(15, Math.round(W / 55)), fontWeight: "500", textColor: ink }),
    el(`${id}-cta`, "Call to action", "rectangle", 42, H - 130, Math.min(260, W * 0.38), 58, 7, { fillColor: accent, borderRadius: 12, borderWidth: 0 }),
    el(`${id}-cta-text`, "CTA text", "text", 58, H - 114, Math.min(228, W * 0.34), 30, 8, { text: "{{CallToAction}}", fontSize: 17, fontWeight: "800", textColor: bg, textAlign: "center" }),
    el(`${id}-contact`, "Contact", "text", Math.max(330, W * 0.48), H - 116, W - Math.max(372, W * 0.48), 48, 9, { text: "{{Website}}\n{{SocialHandle}}", fontSize: 13, fontWeight: "600", textColor: ink, textAlign: "right" }),
    el(`${id}-palette`, "Palette label", "text", W - 180, 34, 138, 24, 10, { text: `${paletteName} campaign`, fontSize: 10, fontWeight: "700", textColor: accent, textAlign: "right" }),
  ];
  if (spec.key === "catalog") items.push(el(`${id}-price`, "Price", "text", W - 230, photoH - 86, 188, 54, 11, { text: "{{Price}}", fontSize: 30, fontWeight: "900", textColor: accent, textAlign: "right" }));
  if (spec.key === "brochure") items.push(el(`${id}-fold1`, "Fold guide", "line", W / 3, 0, 1, H, 12, { borderColor: accent, borderWidth: 1, opacity: 0.25 }), el(`${id}-fold2`, "Fold guide", "line", W * 2 / 3, 0, 1, H, 13, { borderColor: accent, borderWidth: 1, opacity: 0.25 }));
  return items;
}

function makeTemplate(spec: Spec, index: number): ProfessionalTemplate {
  const serial = index + 1;
  const id = `${spec.key}-${String(serial).padStart(3, "0")}`;
  const page: PublisherPage = { id: `${id}-page-1`, name: "Page 1", width: spec.width, height: spec.height, orientation: spec.orientation === "square" ? "portrait" : spec.orientation, sizeKey: "custom", backgroundColor: palettes[index % palettes.length][1], margin: 24, bleed: DEFAULT_BLEED, elements: elements(spec, id, index) };
  return { metadata: { id, name: `${palettes[index % palettes.length][0]} ${spec.name} ${serial}`, category: spec.category, subcategory: spec.subcategory, industry: spec.platform ?? "Marketing", description: `Editable ${spec.name.toLowerCase()} template with campaign placeholders, brand colors, image area, CTA, and platform-ready dimensions.`, tags: [spec.key, "editable", "campaign", "marketing", "social media", spec.platform ?? "brand"], pageSize: spec.pageSize, orientation: spec.orientation, previewColor: palettes[index % palettes.length][2], author: "Yaposan", version: "24.2.5", editable: true, featured: serial <= 12, trending: serial % 9 === 0, access: serial % 6 === 0 ? "premium" : "free", createdAt: NOW, updatedAt: NOW, themeId: palettes[index % palettes.length][0].toLowerCase(), supportedThemeIds: ["corporate-blue", "modern-dark", "luxury-gold", "creative-purple"] }, pages: [page] };
}

export const MARKETING_SOCIAL_TEMPLATES: ProfessionalTemplate[] = specs.flatMap((spec) => Array.from({ length: spec.count }, (_, index) => makeTemplate(spec, index)));
export const MARKETING_SOCIAL_TEMPLATE_COUNTS = Object.fromEntries(specs.map((spec) => [spec.subcategory, spec.count]));
export const MARKETING_SOCIAL_TEMPLATE_COUNT = MARKETING_SOCIAL_TEMPLATES.length;

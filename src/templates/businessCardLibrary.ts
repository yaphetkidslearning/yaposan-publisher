import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate } from "./types";

const W = 336;
const H = 192;
const NOW = "2026-07-28T00:00:00.000Z";

const industries = [
  ["Corporate", "business"], ["Technology", "software"], ["Real Estate", "realtor"],
  ["Healthcare", "medical"], ["Restaurant", "food"], ["Construction", "contractor"],
  ["Church", "ministry"], ["Fashion", "boutique"], ["Automotive", "auto"],
  ["Beauty", "salon"], ["Finance", "accounting"], ["Creative", "design"],
] as const;

const styles = [
  ["Modern", "#0F172A", "#22D3EE", "#F8FAFC"],
  ["Minimal", "#FFFFFF", "#111827", "#2563EB"],
  ["Luxury", "#111111", "#D4AF37", "#FAFAF9"],
  ["Bold", "#7C3AED", "#FDE047", "#FFFFFF"],
  ["Elegant", "#F8F5F0", "#6B4F3A", "#1F2937"],
  ["Geometric", "#0B3B60", "#14B8A6", "#FFFFFF"],
  ["Clean", "#EFF6FF", "#1D4ED8", "#0F172A"],
  ["Premium", "#172554", "#C4B5FD", "#FFFFFF"],
  ["Classic", "#F5F5F4", "#7C2D12", "#292524"],
  ["Creative", "#EC4899", "#111827", "#FFFFFF"],
] as const;

const element = (id: string, name: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement => ({
  id, name, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra,
});

function frontElements(prefix: string, styleIndex: number, bg: string, accent: string, ink: string): PublisherElement[] {
  const variant = styleIndex % 5;
  const base: PublisherElement[] = [
    element(`${prefix}-bg`, "Background", "rectangle", 0, 0, W, H, 1, { fillColor: bg, borderColor: "transparent", borderWidth: 0, locked: true }),
  ];
  if (variant === 0) base.push(element(`${prefix}-stripe`, "Accent stripe", "rectangle", 0, 0, 18, H, 2, { fillColor: accent, borderWidth: 0 }));
  if (variant === 1) base.push(element(`${prefix}-panel`, "Accent panel", "rectangle", 220, 0, 116, H, 2, { fillColor: accent, borderWidth: 0 }));
  if (variant === 2) base.push(element(`${prefix}-circle`, "Accent circle", "circle", 235, -35, 135, 135, 2, { fillColor: accent, borderWidth: 0, opacity: 0.95 }));
  if (variant === 3) base.push(element(`${prefix}-bar`, "Accent bar", "rectangle", 0, 145, W, 47, 2, { fillColor: accent, borderWidth: 0 }));
  if (variant === 4) base.push(element(`${prefix}-diag`, "Accent block", "rectangle", 244, 0, 92, H, 2, { fillColor: accent, borderWidth: 0, rotation: 0 }));
  base.push(
    element(`${prefix}-logo`, "Logo placeholder", "image", variant === 1 ? 249 : 24, 22, 54, 54, 5, { imageUri: "", imageFit: "contain", borderColor: accent, borderWidth: 2, borderRadius: 10, accessibilityLabel: "{{Logo}}" }),
    element(`${prefix}-name`, "Person name", "text", 24, 88, variant === 1 ? 185 : 270, 28, 6, { text: "{{PersonName}}", fontSize: 23, fontWeight: "800", textColor: ink, textAlign: "left" }),
    element(`${prefix}-title`, "Job title", "text", 24, 117, variant === 1 ? 185 : 260, 20, 7, { text: "{{Title}}", fontSize: 11, fontWeight: "600", textColor: variant === 3 ? bg : accent, textAlign: "left", letterSpacing: 0.8 }),
    element(`${prefix}-company`, "Business name", "text", 24, 145, variant === 3 ? 210 : 250, 20, 8, { text: "{{BusinessName}}", fontSize: 11, fontWeight: "700", textColor: variant === 3 ? bg : ink, textAlign: "left" }),
  );
  return base;
}

function backElements(prefix: string, styleIndex: number, bg: string, accent: string, ink: string): PublisherElement[] {
  const lightText = bg !== "#FFFFFF" && bg !== "#F8F5F0" && bg !== "#EFF6FF" && bg !== "#F5F5F4";
  const text = lightText ? "#FFFFFF" : ink;
  return [
    element(`${prefix}-bg`, "Background", "rectangle", 0, 0, W, H, 1, { fillColor: bg, borderWidth: 0, locked: true }),
    element(`${prefix}-accent`, "Accent line", "rectangle", 24, 24, 5, 144, 2, { fillColor: accent, borderWidth: 0, borderRadius: 3 }),
    element(`${prefix}-phone-label`, "Phone label", "text", 45, 32, 48, 16, 3, { text: "PHONE", fontSize: 8, fontWeight: "800", textColor: accent, letterSpacing: 1 }),
    element(`${prefix}-phone`, "Phone", "text", 45, 48, 205, 18, 4, { text: "{{Phone}}", fontSize: 12, fontWeight: "600", textColor: text }),
    element(`${prefix}-email-label`, "Email label", "text", 45, 72, 48, 16, 5, { text: "EMAIL", fontSize: 8, fontWeight: "800", textColor: accent, letterSpacing: 1 }),
    element(`${prefix}-email`, "Email", "text", 45, 88, 205, 18, 6, { text: "{{Email}}", fontSize: 11, fontWeight: "600", textColor: text }),
    element(`${prefix}-web-label`, "Website label", "text", 45, 112, 60, 16, 7, { text: "WEBSITE", fontSize: 8, fontWeight: "800", textColor: accent, letterSpacing: 1 }),
    element(`${prefix}-web`, "Website", "text", 45, 128, 205, 18, 8, { text: "{{Website}}", fontSize: 11, fontWeight: "600", textColor: text }),
    element(`${prefix}-qr`, "QR placeholder", "rectangle", 264, 57, 52, 52, 9, { fillColor: "#FFFFFF", borderColor: accent, borderWidth: 2, borderRadius: 4, accessibilityLabel: "{{QR}}" }),
    element(`${prefix}-address`, "Address", "text", 205, 125, 111, 42, 10, { text: "{{Address}}", fontSize: 8, fontWeight: "500", textColor: text, textAlign: "right" }),
  ];
}

function makeTemplate(industryIndex: number, styleIndex: number, serial: number): ProfessionalTemplate {
  const [industry, industryTag] = industries[industryIndex];
  const [styleName, bg, accent, ink] = styles[styleIndex];
  const id = `business-card-${industryTag}-${styleName.toLowerCase()}-${String(serial).padStart(3, "0")}`;
  const pages: PublisherPage[] = [
    { id: `${id}-front`, name: "Front", width: W, height: H, orientation: "landscape", sizeKey: "business-card", backgroundColor: bg, margin: 18, bleed: DEFAULT_BLEED, elements: frontElements(`${id}-front`, styleIndex, bg, accent, ink) },
    { id: `${id}-back`, name: "Back", width: W, height: H, orientation: "landscape", sizeKey: "business-card", backgroundColor: bg, margin: 18, bleed: DEFAULT_BLEED, elements: backElements(`${id}-back`, styleIndex, bg, accent, ink) },
  ];
  return {
    metadata: {
      id, name: `${styleName} ${industry} Business Card`, category: "Business", subcategory: "Business Cards", industry,
      description: `Editable front-and-back ${styleName.toLowerCase()} business card for ${industry.toLowerCase()} professionals.`,
      tags: ["business card", industryTag, styleName.toLowerCase(), "front and back", "editable", "print"],
      pageSize: "Business Card 3.5 x 2 in", orientation: "landscape", previewColor: accent, author: "Yaposan",
      version: "24.2.1", editable: true, featured: serial <= 12, trending: serial % 9 === 0,
      access: serial % 5 === 0 ? "premium" : "free", createdAt: NOW, updatedAt: NOW,
      themeId: styleName.toLowerCase(), supportedThemeIds: ["corporate-blue", "modern-dark", "luxury-gold", "minimal-white"],
    },
    pages,
  };
}

export const BUSINESS_CARD_TEMPLATES: ProfessionalTemplate[] = Array.from({ length: 640 }, (_, index) => {
  const industryIndex = index % industries.length;
  const styleIndex = Math.floor(index / industries.length) % styles.length;
  return makeTemplate(industryIndex, styleIndex, index + 1);
});
export const BUSINESS_CARD_TEMPLATE_COUNT = BUSINESS_CARD_TEMPLATES.length;

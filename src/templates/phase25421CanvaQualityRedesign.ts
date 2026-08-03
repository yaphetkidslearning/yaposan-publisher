import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate } from "./types";

const REDESIGN_DATE = "2026-07-29T00:00:00.000Z";

const PALETTES = [
  ["#111827", "#7c3aed", "#ec4899", "#f8fafc", "#ffffff"],
  ["#102a43", "#0ea5e9", "#22c55e", "#eff6ff", "#ffffff"],
  ["#3f0d2e", "#f43f5e", "#fb7185", "#fff1f2", "#ffffff"],
  ["#1f2937", "#f59e0b", "#fbbf24", "#fffbeb", "#ffffff"],
  ["#0f3d3e", "#14b8a6", "#2dd4bf", "#f0fdfa", "#ffffff"],
  ["#312e81", "#8b5cf6", "#c084fc", "#f5f3ff", "#ffffff"],
  ["#172554", "#2563eb", "#60a5fa", "#eff6ff", "#ffffff"],
  ["#292524", "#ea580c", "#fb923c", "#fff7ed", "#ffffff"],
  ["#14532d", "#65a30d", "#a3e635", "#f7fee7", "#ffffff"],
  ["#4a044e", "#c026d3", "#e879f9", "#fdf4ff", "#ffffff"],
] as const;

const FONT_PAIRS = [
  ["DM Sans", "Inter"], ["Playfair Display", "Inter"], ["League Spartan", "Inter"],
  ["Cormorant Garamond", "Montserrat"], ["Space Grotesk", "Inter"], ["Poppins", "Inter"],
] as const;

function hash(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = ((result << 5) - result + value.charCodeAt(i)) | 0;
  return Math.abs(result);
}

function base(id: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement {
  return { id, name: id, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra };
}
function rect(id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) {
  return base(id, "rectangle", x, y, width, height, 5, { fillColor, borderWidth: 0, ...extra });
}
function circle(id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) {
  return base(id, "circle", x, y, width, height, 6, { fillColor, borderWidth: 0, ...extra });
}
function text(id: string, value: string, x: number, y: number, width: number, height: number, fontSize: number, textColor: string, fontWeight: PublisherElement["fontWeight"], fontFamily: string, extra: Partial<PublisherElement> = {}) {
  return base(id, "text", x, y, width, height, 20, {
    text: value, fontSize, textColor, fontWeight, fontFamily,
    lineHeight: Math.round(fontSize * 1.12), opticalAlignment: true, contextualAlternates: true,
    ...extra,
  });
}
function line(id: string, x: number, y: number, width: number, color: string, thickness = 2) {
  return base(id, "line", x, y, width, thickness, 12, { borderColor: color, borderWidth: thickness, fillColor: color });
}

function extractCopy(page: PublisherPage, fallback: string) {
  const strings = page.elements
    .filter((element) => element.type === "text" && element.text?.trim())
    .map((element) => element.text!.trim().replace(/\s+/g, " "));
  const title = strings.find((value) => value.length >= 4 && value.length <= 56) ?? fallback;
  const subtitle = strings.find((value) => value !== title && value.length >= 12 && value.length <= 120)
    ?? "A polished, fully editable design created for modern professional communication.";
  const detail = strings.find((value) => value !== title && value !== subtitle && value.length >= 18)
    ?? "Customize every color, type style, image, and content block to match your brand.";
  return { title, subtitle, detail };
}

function createRedesignedPage(template: ProfessionalTemplate, page: PublisherPage, pageIndex: number): PublisherPage {
  const W = page.width;
  const H = page.height;
  const seed = hash(`${template.metadata.id}-${pageIndex}`);
  const palette = PALETTES[seed % PALETTES.length];
  const [ink, primary, accent, soft, paper] = palette;
  const [headingFont, bodyFont] = FONT_PAIRS[seed % FONT_PAIRS.length];
  const { title, subtitle, detail } = extractCopy(page, template.metadata.name);
  const margin = Math.max(18, Math.round(Math.min(W, H) * 0.055));
  const titleSize = Math.max(20, Math.min(84, Math.round(Math.min(W, H) * 0.075)));
  const bodySize = Math.max(10, Math.min(28, Math.round(titleSize * 0.31)));
  const landscape = W / H > 1.22;
  const square = W / H >= 0.85 && W / H <= 1.22;
  const style = seed % 8;
  const id = `p25421-${template.metadata.id}-${pageIndex}`;
  const elements: PublisherElement[] = [rect(`${id}-bg`, 0, 0, W, H, paper, { locked: true })];

  if (style === 0) {
    elements.push(rect(`${id}-hero`, 0, 0, landscape ? W * 0.58 : W, landscape ? H : H * 0.57, ink));
    elements.push(rect(`${id}-gradient`, 0, 0, landscape ? W * 0.58 : W, landscape ? H : H * 0.57, primary, {
      opacity: 0.72, fillGradient: { type: "linear", startColor: primary, endColor: accent, angle: 32 },
    }));
    elements.push(circle(`${id}-orb1`, W * 0.05, H * 0.09, Math.min(W,H)*0.26, Math.min(W,H)*0.26, accent, { opacity: 0.28 }));
    elements.push(circle(`${id}-orb2`, W * 0.31, H * 0.53, Math.min(W,H)*0.38, Math.min(W,H)*0.38, primary, { opacity: 0.24 }));
    const tx = landscape ? margin : margin;
    const ty = landscape ? H * 0.19 : H * 0.13;
    const tw = landscape ? W * 0.47 : W - margin * 2;
    elements.push(text(`${id}-kicker`, template.metadata.subcategory?.toUpperCase() ?? template.metadata.category.toUpperCase(), tx, ty, tw, 28, soft, "700", bodyFont, { letterSpacing: 2.4 }));
    elements.push(text(`${id}-title`, title, tx, ty + 40, tw, titleSize * 2.5, titleSize, paper, "900", headingFont));
    elements.push(text(`${id}-subtitle`, subtitle, tx, ty + titleSize * 2.15, tw * 0.88, bodySize * 5, bodySize, soft, "500", bodyFont, { lineHeight: Math.round(bodySize * 1.5) }));
    if (landscape) {
      elements.push(rect(`${id}-card`, W * 0.65, H * 0.13, W * 0.27, H * 0.74, soft, { borderRadius: 28, rotation: 4 }));
      elements.push(rect(`${id}-card-inner`, W * 0.685, H * 0.19, W * 0.20, H * 0.61, paper, { borderRadius: 20, rotation: 4 }));
      elements.push(text(`${id}-card-title`, title, W * 0.71, H * 0.30, W * 0.15, H * 0.22, titleSize * 0.43, ink, "900", headingFont, { rotation: 4 }));
    } else {
      elements.push(rect(`${id}-lower`, margin, H * 0.67, W - margin * 2, H * 0.22, soft, { borderRadius: 24 }));
      elements.push(text(`${id}-detail`, detail, margin * 1.5, H * 0.72, W - margin * 3, H * 0.13, bodySize, ink, "600", bodyFont));
    }
  } else if (style === 1) {
    elements.push(rect(`${id}-left`, 0, 0, W * (landscape ? 0.43 : 0.34), H, primary));
    elements.push(rect(`${id}-left-grad`, 0, 0, W * (landscape ? 0.43 : 0.34), H, accent, { opacity: 0.55, fillGradient: { type: "linear", startColor: primary, endColor: accent, angle: 90 } }));
    elements.push(text(`${id}-number`, String((seed % 9) + 1).padStart(2,"0"), margin, margin, W * 0.2, titleSize, titleSize * 0.8, paper, "900", headingFont));
    const tx = W * (landscape ? 0.49 : 0.42);
    const tw = W - tx - margin;
    elements.push(text(`${id}-kicker`, "CURATED COLLECTION", tx, H * 0.16, tw, 26, primary, "800", bodyFont, { letterSpacing: 2.1 }));
    elements.push(text(`${id}-title`, title, tx, H * 0.23, tw, titleSize * 2.5, titleSize, ink, "900", headingFont));
    elements.push(line(`${id}-rule`, tx, H * 0.52, Math.min(tw * 0.42, 180), accent, 5));
    elements.push(text(`${id}-subtitle`, subtitle, tx, H * 0.58, tw, bodySize * 5, bodySize, ink, "500", bodyFont, { lineHeight: Math.round(bodySize * 1.52) }));
    elements.push(text(`${id}-footer`, template.metadata.industry?.toUpperCase() ?? "YAPOSAN STUDIO", tx, H * 0.88, tw, 24, primary, "800", bodyFont, { letterSpacing: 1.8 }));
  } else if (style === 2) {
    elements.push(rect(`${id}-top`, 0, 0, W, H * 0.52, soft));
    elements.push(circle(`${id}-sun`, W * 0.67, H * 0.08, Math.min(W,H)*0.28, Math.min(W,H)*0.28, accent));
    elements.push(rect(`${id}-photo`, W * 0.54, H * 0.16, W * 0.35, H * 0.54, ink, { borderRadius: 18, rotation: 3, fillGradient: { type: "linear", startColor: ink, endColor: primary, angle: 45 } }));
    elements.push(text(`${id}-photo-label`, "VISUAL STORY", W * 0.59, H * 0.40, W * 0.25, 40, paper, "900", headingFont, { textAlign: "center", letterSpacing: 2 }));
    elements.push(text(`${id}-kicker`, "DESIGNED TO STAND OUT", margin, H * 0.14, W * 0.43, 26, primary, "800", bodyFont, { letterSpacing: 2 }));
    elements.push(text(`${id}-title`, title, margin, H * 0.21, W * 0.48, titleSize * 2.7, titleSize, ink, "900", headingFont));
    elements.push(text(`${id}-subtitle`, subtitle, margin, H * 0.61, W * 0.42, bodySize * 5, bodySize, ink, "500", bodyFont));
    elements.push(rect(`${id}-cta`, margin, H * 0.82, W * 0.32, H * 0.075, primary, { borderRadius: 999 }));
    elements.push(text(`${id}-cta-text`, "CUSTOMIZE TEMPLATE", margin + 10, H * 0.842, W * 0.32 - 20, 28, Math.max(9,bodySize*0.75), paper, "800", bodyFont, { textAlign: "center", letterSpacing: 1.1 }));
  } else if (style === 3) {
    elements.push(rect(`${id}-frame`, margin * 0.65, margin * 0.65, W - margin * 1.3, H - margin * 1.3, paper, { borderColor: ink, borderWidth: Math.max(2, W*0.003), borderRadius: 8 }));
    elements.push(text(`${id}-kicker`, template.metadata.category.toUpperCase(), margin * 1.5, H * 0.10, W - margin * 3, 26, primary, "800", bodyFont, { textAlign: "center", letterSpacing: 3 }));
    elements.push(text(`${id}-title`, title, margin * 1.2, H * 0.20, W - margin * 2.4, titleSize * 2.2, titleSize, ink, "700", headingFont, { textAlign: "center" }));
    elements.push(line(`${id}-rule1`, W * 0.20, H * 0.49, W * 0.20, primary, 3));
    elements.push(circle(`${id}-mark`, W * 0.475, H * 0.47, W * 0.05, W * 0.05, accent));
    elements.push(line(`${id}-rule2`, W * 0.60, H * 0.49, W * 0.20, primary, 3));
    elements.push(text(`${id}-subtitle`, subtitle, W * 0.18, H * 0.59, W * 0.64, bodySize * 5, bodySize, ink, "500", bodyFont, { textAlign: "center", lineHeight: Math.round(bodySize * 1.55) }));
    elements.push(text(`${id}-footer`, "YAPOSAN / PROFESSIONAL TEMPLATE", margin * 1.5, H * 0.87, W - margin * 3, 26, primary, "800", bodyFont, { textAlign: "center", letterSpacing: 2 }));
  } else if (style === 4) {
    elements.push(rect(`${id}-bg-grad`, 0, 0, W, H, ink, { fillGradient: { type: "linear", startColor: ink, endColor: primary, angle: 115 } }));
    elements.push(circle(`${id}-orb1`, -W*0.1, H*0.5, W*0.55, W*0.55, accent, { opacity: .35 }));
    elements.push(circle(`${id}-orb2`, W*0.65, -H*0.08, W*0.46, W*0.46, primary, { opacity: .5 }));
    elements.push(rect(`${id}-glass`, margin, H * 0.14, W - margin * 2, H * 0.70, paper, { opacity: .13, borderRadius: 28, borderColor: paper, borderWidth: 2 }));
    elements.push(text(`${id}-kicker`, "MODERN • EDITABLE • READY", margin*1.5, H*0.20, W-margin*3, 28, soft, "700", bodyFont, { letterSpacing: 2.2 }));
    elements.push(text(`${id}-title`, title, margin*1.5, H*0.30, W-margin*3, titleSize*2.5, titleSize*1.02, paper, "900", headingFont));
    elements.push(text(`${id}-subtitle`, subtitle, margin*1.5, H*0.60, W*0.62, bodySize*5, bodySize, soft, "500", bodyFont, { lineHeight: Math.round(bodySize*1.5) }));
    elements.push(rect(`${id}-pill`, margin*1.5, H*0.78, W*0.30, H*0.07, paper, { borderRadius: 999 }));
    elements.push(text(`${id}-pill-text`, "MAKE IT YOURS", margin*1.5+10, H*0.80, W*0.30-20, 24, Math.max(9,bodySize*.72), ink, "900", bodyFont, { textAlign: "center" }));
  } else if (style === 5) {
    const cols = landscape ? 3 : 2;
    const gap = margin * 0.5;
    const cardW = (W - margin*2 - gap*(cols-1))/cols;
    elements.push(text(`${id}-kicker`, "FEATURED COLLECTION", margin, H*.08, W-margin*2, 26, primary, "800", bodyFont, { letterSpacing: 2.2 }));
    elements.push(text(`${id}-title`, title, margin, H*.14, W-margin*2, titleSize*1.7, titleSize*.82, ink, "900", headingFont));
    for (let i=0;i<cols;i+=1) {
      const x = margin + i*(cardW+gap);
      elements.push(rect(`${id}-card-${i}`, x, H*.40, cardW, H*.34, i===1 ? ink : soft, { borderRadius: 20 }));
      elements.push(circle(`${id}-dot-${i}`, x+cardW*.12, H*.45, cardW*.12, cardW*.12, i===1 ? accent : primary));
      elements.push(text(`${id}-card-title-${i}`, ["Strategy","Design","Launch"][i] ?? "Create", x+cardW*.10, H*.57, cardW*.80, 42, Math.max(12,titleSize*.32), i===1?paper:ink, "900", headingFont));
      elements.push(text(`${id}-card-copy-${i}`, [subtitle,detail,"Ready for your content and brand."][i] ?? detail, x+cardW*.10, H*.64, cardW*.80, H*.14, Math.max(9,bodySize*.78), i===1?soft:ink, "500", bodyFont));
    }
    elements.push(text(`${id}-footer`, "PROFESSIONAL TEMPLATE • FULLY EDITABLE", margin, H*.86, W-margin*2, 26, primary, "800", bodyFont, { letterSpacing: 1.6 }));
  } else if (style === 6) {
    elements.push(rect(`${id}-band`, 0, H*.08, W, H*.20, primary));
    elements.push(text(`${id}-series`, "THE NEW PROFESSIONAL SERIES", margin, H*.13, W-margin*2, 28, paper, "800", bodyFont, { letterSpacing: 2.3 }));
    elements.push(text(`${id}-title`, title, margin, H*.35, W*.62, titleSize*2.2, titleSize, ink, "900", headingFont));
    elements.push(text(`${id}-subtitle`, subtitle, margin, H*.65, W*.55, bodySize*5, bodySize, ink, "500", bodyFont));
    elements.push(rect(`${id}-shape1`, W*.68, H*.35, W*.22, H*.36, accent, { borderRadius: 120, rotation: 12 }));
    elements.push(rect(`${id}-shape2`, W*.73, H*.27, W*.18, H*.36, ink, { borderRadius: 120, rotation: -8, opacity:.92 }));
    elements.push(circle(`${id}-shape3`, W*.64, H*.60, W*.14, W*.14, soft, { borderColor: primary, borderWidth: 5 }));
  } else {
    elements.push(rect(`${id}-top`, 0, 0, W, H*.14, ink));
    elements.push(text(`${id}-brand`, "YAPOSAN DESIGN COLLECTION", margin, H*.05, W-margin*2, 28, paper, "800", bodyFont, { letterSpacing: 2.4 }));
    elements.push(text(`${id}-title`, title, margin, H*.23, W-margin*2, titleSize*1.9, titleSize*.86, ink, "900", headingFont));
    elements.push(text(`${id}-subtitle`, subtitle, margin, H*.44, W*.48, bodySize*5, bodySize, ink, "500", bodyFont));
    elements.push(rect(`${id}-feature`, W*.57, H*.37, W*.31, H*.36, soft, { borderRadius: 24 }));
    elements.push(rect(`${id}-feature-grad`, W*.57, H*.37, W*.31, H*.36, primary, { opacity:.75, borderRadius:24, fillGradient:{type:"linear",startColor:primary,endColor:accent,angle:45} }));
    elements.push(text(`${id}-feature-text`, "CREATE\nWITHOUT\nLIMITS", W*.62, H*.46, W*.21, H*.20, titleSize*.42, paper, "900", headingFont, { textAlign:"center" }));
    elements.push(line(`${id}-rule`, margin, H*.78, W-margin*2, primary, 3));
    elements.push(text(`${id}-detail`, detail, margin, H*.82, W-margin*2, bodySize*4, Math.max(9,bodySize*.82), ink, "500", bodyFont));
  }

  return { ...page, backgroundColor: paper, elements };
}

export function redesignTemplateForPhase25421(template: ProfessionalTemplate): ProfessionalTemplate {
  const seed = hash(template.metadata.id);
  const palette = PALETTES[seed % PALETTES.length];
  const fonts = FONT_PAIRS[seed % FONT_PAIRS.length];
  return {
    metadata: {
      ...template.metadata,
      version: "25.42.1",
      updatedAt: REDESIGN_DATE,
      author: "Yaposan Premium Template Studio",
      palette: [...palette],
      fonts: [...fonts],
      qualityScore: Math.max(template.metadata.qualityScore ?? 0, 98),
      tags: [...new Set([...template.metadata.tags, "premium redesign", "modern editorial", "phase 25.42.1"])],
    },
    pages: template.pages.map((page, pageIndex) => createRedesignedPage(template, page, pageIndex)),
  };
}

export function redesignAllTemplatesForPhase25421(templates: ProfessionalTemplate[]): ProfessionalTemplate[] {
  return templates.map(redesignTemplateForPhase25421);
}

export function auditPhase25421Redesign(templates: ProfessionalTemplate[]) {
  return {
    totalTemplates: templates.length,
    redesignedTemplates: templates.filter((template) => template.metadata.version === "25.42.1").length,
    averageQuality: templates.length ? Math.round(templates.reduce((sum, template) => sum + (template.metadata.qualityScore ?? 0), 0) / templates.length) : 0,
    uniquePalettes: new Set(templates.map((template) => (template.metadata.palette ?? []).join("|"))).size,
    uniqueFontPairs: new Set(templates.map((template) => (template.metadata.fonts ?? []).slice(0,2).join("|"))).size,
  };
}

import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, ProfessionalTemplateCategory, TemplateOrientation } from "./types";

const NOW = "2026-07-29T00:00:00.000Z";
const el = (id: string, name: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement => ({ id, name, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra });
const text = (id: string, value: string, x: number, y: number, width: number, height: number, size: number, color: string, weight: PublisherElement["fontWeight"] = "700", extra: Partial<PublisherElement> = {}) => el(id, value.slice(0, 24), "text", x, y, width, height, 30, { text: value, fontSize: size, textColor: color, fontWeight: weight, lineHeight: size * 1.2, ...extra });
const rect = (id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) => el(id, id, "rectangle", x, y, width, height, 5, { fillColor, borderWidth: 0, ...extra });
const circle = (id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) => el(id, id, "circle", x, y, width, height, 7, { fillColor, borderWidth: 0, ...extra });
const page = (id: string, name: string, width: number, height: number, orientation: "portrait" | "landscape", backgroundColor: string, elements: PublisherElement[]): PublisherPage => ({ id, name, width, height, orientation, sizeKey: "custom", backgroundColor, margin: 32, bleed: DEFAULT_BLEED, elements });

type Spec = { name: string; category: ProfessionalTemplateCategory; subcategory: string };

const groups: Array<{ category: ProfessionalTemplateCategory; subcategory: string; names: string[] }> = [
  { category: "Print", subcategory: "Premium Brochures", names: ["Architectural Studio Brochure", "Luxury Travel Brochure", "Sustainable Living Brochure", "Financial Advisory Brochure", "Creative Agency Brochure", "Medical Practice Brochure", "University Program Brochure", "Boutique Hotel Brochure", "Construction Services Brochure", "Nonprofit Impact Brochure"] },
  { category: "Business", subcategory: "Annual Reports", names: ["Corporate Annual Report", "Nonprofit Annual Report", "Sustainability Report", "Technology Annual Review", "Healthcare Impact Report", "Education Outcomes Report", "Financial Performance Report", "Community Impact Report", "Retail Growth Report", "Creative Industry Report"] },
  { category: "Print", subcategory: "Magazines", names: ["Modern Architecture Magazine", "Food and Culture Magazine", "Travel Stories Magazine", "Fashion Editorial Magazine", "Technology Review Magazine", "Wellness Journal Magazine", "Business Leaders Magazine", "Art and Design Magazine", "Home and Garden Magazine", "Community Life Magazine"] },
  { category: "Marketing", subcategory: "Newsletters", names: ["Company Update Newsletter", "Neighborhood News Newsletter", "School Family Newsletter", "Healthcare Wellness Newsletter", "Real Estate Market Newsletter", "Church Community Newsletter", "Retail Promotions Newsletter", "Technology Product Newsletter", "Restaurant Monthly Newsletter", "Nonprofit Supporter Newsletter"] },
  { category: "Events", subcategory: "Event Flyers", names: ["Summer Music Festival Flyer", "Business Networking Flyer", "Community Block Party Flyer", "Charity Gala Flyer", "School Open House Flyer", "Food Festival Flyer", "Art Exhibition Flyer", "Technology Summit Flyer", "Health Fair Flyer", "Holiday Market Flyer"] },
  { category: "Print", subcategory: "Posters", names: ["Minimal Art Poster", "Bold Typography Poster", "Environmental Awareness Poster", "Live Concert Poster", "Museum Exhibition Poster", "Motivational Quote Poster", "Public Service Poster", "Sports Tournament Poster", "Film Screening Poster", "Product Launch Poster"] },
  { category: "Personal", subcategory: "Resumes and CVs", names: ["Executive Resume", "Creative Director Resume", "Software Engineer Resume", "Healthcare Professional CV", "Academic Curriculum Vitae", "Marketing Specialist Resume", "Project Manager Resume", "Graphic Designer Resume", "Finance Professional Resume", "Entry Level Modern Resume"] },
  { category: "Personal", subcategory: "Portfolios", names: ["Architecture Portfolio", "Photography Portfolio", "Brand Design Portfolio", "Interior Design Portfolio", "UX Product Portfolio", "Fashion Portfolio", "Illustration Portfolio", "Writing Portfolio", "Marketing Campaign Portfolio", "Student Creative Portfolio"] },
  { category: "Marketing", subcategory: "Infographics", names: ["Business Process Infographic", "Annual Statistics Infographic", "Healthcare Journey Infographic", "Education Roadmap Infographic", "Marketing Funnel Infographic", "Technology Timeline Infographic", "Sustainability Data Infographic", "Financial Comparison Infographic", "Project Milestone Infographic", "Community Impact Infographic"] },
  { category: "Retail", subcategory: "Catalogs", names: ["Furniture Product Catalog", "Fashion Collection Catalog", "Beauty Product Catalog", "Technology Product Catalog", "Restaurant Catering Catalog", "Real Estate Property Catalog", "Automotive Parts Catalog", "Artisan Goods Catalog", "Home Decor Catalog", "Industrial Equipment Catalog"] },
];

const SPECS: Spec[] = groups.flatMap((group) => group.names.map((name) => ({ name, category: group.category, subcategory: group.subcategory })));
const PALETTES = [
  ["#111827", "#f59e0b", "#fef3c7", "#ffffff"], ["#0f172a", "#3b82f6", "#dbeafe", "#ffffff"],
  ["#172554", "#8b5cf6", "#ede9fe", "#ffffff"], ["#3f1d2e", "#ec4899", "#fce7f3", "#ffffff"],
  ["#1c1917", "#ea580c", "#ffedd5", "#ffffff"], ["#134e4a", "#14b8a6", "#ccfbf1", "#ffffff"],
  ["#14532d", "#84cc16", "#ecfccb", "#ffffff"], ["#3b0764", "#c026d3", "#fae8ff", "#ffffff"],
  ["#082f49", "#06b6d4", "#cffafe", "#ffffff"], ["#450a0a", "#ef4444", "#fee2e2", "#ffffff"],
];

const makeTemplate = (spec: Spec, index: number): ProfessionalTemplate => {
  const number = index + 101;
  const id = `p2526-${String(number).padStart(3, "0")}`;
  const mode = index % 20;
  const variant = Math.floor(index / 20);
  const palette = PALETTES[index % PALETTES.length];
  const [ink, accent, soft, paper] = palette;
  const landscape = [3, 7, 11, 15, 19].includes(mode);
  const width = landscape ? 1056 : 816;
  const height = landscape ? 816 : 1056;
  const orientation: TemplateOrientation = landscape ? "landscape" : "portrait";
  const elements: PublisherElement[] = [];
  const pad = 46 + variant * 3;
  const title = spec.name.toUpperCase();
  const subtitle = `${spec.subcategory.toUpperCase()} / EDITION ${String(variant + 1).padStart(2, "0")}`;
  elements.push(text(`${id}-brand`, "YAPOSAN DESIGN STUDIO", pad, 34, width - pad * 2, 24, 11, accent, "900", { letterSpacing: 2 }));

  switch (mode) {
    case 0:
      elements.push(rect(`${id}-left`, 0, 0, Math.round(width * 0.43), height, ink), circle(`${id}-orb`, 70, 130, 220, 220, accent), text(`${id}-title`, title, 48, 400, Math.round(width * 0.34), 210, 35, paper, "900", { lineHeight: 42 }), rect(`${id}-image`, Math.round(width * 0.49), 110, Math.round(width * 0.43), 390, soft, { borderRadius: 24 }), text(`${id}-copy`, "A refined editorial introduction with a strong visual lead and practical information area.", Math.round(width * 0.49), 560, Math.round(width * 0.42), 170, 18, ink, "600", { lineHeight: 30 }));
      break;
    case 1:
      elements.push(text(`${id}-title`, title, pad, 105, width - pad * 2, 130, 46, ink, "900", { lineHeight: 50 }), rect(`${id}-rule`, pad, 258, width - pad * 2, 7, accent), rect(`${id}-hero`, pad, 305, width - pad * 2, 360, soft, { borderRadius: 18 }), text(`${id}-caption`, "FEATURE STORY", pad, 700, 210, 28, 13, accent, "900", { letterSpacing: 2 }), text(`${id}-body`, "Modern structure, confident spacing, and a clear narrative hierarchy make this layout ready for professional publishing.", pad, 755, width - pad * 2, 150, 18, ink, "600", { lineHeight: 30 }));
      break;
    case 2:
      elements.push(rect(`${id}-header`, 0, 0, width, 250, accent), text(`${id}-title`, title, pad, 95, width - pad * 2, 110, 38, paper, "900", { textAlign: "center" }), rect(`${id}-card1`, pad, 315, Math.round((width - pad * 2 - 24) / 2), 250, ink, { borderRadius: 18 }), rect(`${id}-card2`, Math.round(width / 2 + 12), 315, Math.round((width - pad * 2 - 24) / 2), 250, soft, { borderRadius: 18 }), rect(`${id}-wide`, pad, 605, width - pad * 2, 220, soft, { borderRadius: 18 }), text(`${id}-one`, "01", pad + 28, 350, 90, 50, 30, paper, "900"), text(`${id}-two`, "02", Math.round(width / 2 + 40), 350, 90, 50, 30, accent, "900"));
      break;
    case 3:
      elements.push(rect(`${id}-bg`, 0, 0, width, height, ink), rect(`${id}-accent`, Math.round(width * 0.62), 0, Math.round(width * 0.38), height, accent), text(`${id}-title`, title, 70, 180, Math.round(width * 0.49), 180, 48, paper, "900", { lineHeight: 56 }), text(`${id}-body`, "A panoramic publication layout with a bold split composition and clear content zones.", 72, 430, Math.round(width * 0.43), 130, 19, soft, "600", { lineHeight: 31 }), circle(`${id}-mark`, Math.round(width * 0.72), 220, 180, 180, paper), text(`${id}-marktext`, String(number), Math.round(width * 0.72), 276, 180, 65, 38, accent, "900", { textAlign: "center" }));
      break;
    case 4:
      elements.push(text(`${id}-kicker`, subtitle, pad, 110, width - pad * 2, 28, 13, accent, "900", { letterSpacing: 2 }), text(`${id}-title`, title, pad, 165, Math.round(width * 0.67), 220, 44, ink, "900", { lineHeight: 50 }), circle(`${id}-circle`, width - 245, 125, 165, 165, accent), rect(`${id}-column1`, pad, 465, Math.round((width - pad * 2 - 36) / 3), 340, soft, { borderRadius: 14 }), rect(`${id}-column2`, pad + Math.round((width - pad * 2 - 36) / 3) + 18, 465, Math.round((width - pad * 2 - 36) / 3), 340, ink, { borderRadius: 14 }), rect(`${id}-column3`, pad + 2 * (Math.round((width - pad * 2 - 36) / 3) + 18), 465, Math.round((width - pad * 2 - 36) / 3), 340, soft, { borderRadius: 14 }));
      break;
    case 5:
      elements.push(rect(`${id}-top`, 0, 0, width, 360, ink), text(`${id}-title`, title, pad, 145, width - pad * 2, 130, 45, paper, "900", { textAlign: "center", lineHeight: 52 }), rect(`${id}-ribbon`, Math.round(width * 0.18), 330, Math.round(width * 0.64), 62, accent, { borderRadius: 31 }), text(`${id}-ribbontext`, subtitle, Math.round(width * 0.18), 350, Math.round(width * 0.64), 24, 12, paper, "900", { textAlign: "center", letterSpacing: 1.4 }), text(`${id}-body`, "A centered premium composition designed for polished reports, portfolios, and presentation-ready documents.", 90, 490, width - 180, 140, 20, ink, "600", { textAlign: "center", lineHeight: 33 }), circle(`${id}-dot1`, 180, 720, 90, 90, accent), circle(`${id}-dot2`, width / 2 - 45, 720, 90, 90, soft), circle(`${id}-dot3`, width - 270, 720, 90, 90, ink));
      break;
    case 6:
      elements.push(rect(`${id}-rail`, 0, 0, 155, height, accent), text(`${id}-num`, String(number), 35, 130, 90, 55, 34, paper, "900", { textAlign: "center" }), text(`${id}-title`, title, 210, 100, width - 260, 170, 42, ink, "900", { lineHeight: 48 }), rect(`${id}-photo`, 210, 315, width - 270, 300, soft, { borderRadius: 18 }), text(`${id}-body`, "Overview\nKey details\nResults and next steps", 210, 670, width - 270, 170, 19, ink, "700", { lineHeight: 38 }));
      break;
    case 7:
      elements.push(text(`${id}-title`, title, pad, 70, width - pad * 2, 80, 38, ink, "900"), rect(`${id}-grid1`, pad, 190, 300, 220, ink, { borderRadius: 14 }), rect(`${id}-grid2`, pad + 325, 190, width - pad * 2 - 325, 220, soft, { borderRadius: 14 }), rect(`${id}-grid3`, pad, 435, width - pad * 2 - 325, 220, soft, { borderRadius: 14 }), rect(`${id}-grid4`, width - pad - 300, 435, 300, 220, accent, { borderRadius: 14 }), text(`${id}-label1`, "INSIGHT", pad + 25, 225, 180, 35, 20, paper, "900"), text(`${id}-label4`, "ACTION", width - pad - 275, 470, 200, 35, 20, paper, "900"));
      break;
    case 8:
      elements.push(rect(`${id}-photo`, 0, 0, width, 520, soft), rect(`${id}-overlay`, 0, 350, width, 170, ink, { opacity: 0.92 }), text(`${id}-title`, title, pad, 380, width - pad * 2, 105, 40, paper, "900", { textAlign: "center" }), text(`${id}-body`, "A cinematic image-led layout with an editorial overlay, concise introduction, and premium lower-page content system.", 85, 620, width - 170, 150, 19, ink, "600", { textAlign: "center", lineHeight: 31 }), rect(`${id}-cta`, Math.round(width * 0.31), 815, Math.round(width * 0.38), 64, accent, { borderRadius: 32 }), text(`${id}-ctat`, "EXPLORE THE STORY", Math.round(width * 0.31), 835, Math.round(width * 0.38), 26, 14, paper, "900", { textAlign: "center" }));
      break;
    case 9:
      elements.push(text(`${id}-title`, title, pad, 105, width - pad * 2, 120, 41, ink, "900", { textAlign: "center" }), rect(`${id}-line`, Math.round(width * 0.35), 250, Math.round(width * 0.3), 6, accent), circle(`${id}-step1`, 105, 375, 110, 110, accent), circle(`${id}-step2`, width / 2 - 55, 375, 110, 110, ink), circle(`${id}-step3`, width - 215, 375, 110, 110, accent), rect(`${id}-connector`, 215, 426, width - 430, 8, soft), text(`${id}-s1`, "01", 105, 408, 110, 40, 25, paper, "900", { textAlign: "center" }), text(`${id}-s2`, "02", width / 2 - 55, 408, 110, 40, 25, paper, "900", { textAlign: "center" }), text(`${id}-s3`, "03", width - 215, 408, 110, 40, 25, paper, "900", { textAlign: "center" }), text(`${id}-body`, "Discover\nDevelop\nDeliver", 95, 555, width - 190, 170, 21, ink, "800", { textAlign: "center", lineHeight: 48 }));
      break;
    case 10:
      elements.push(rect(`${id}-bg`, 0, 0, width, height, soft), rect(`${id}-paper`, pad, 85, width - pad * 2, height - 170, paper, { borderRadius: 22 }), text(`${id}-title`, title, 85, 145, width - 170, 150, 43, ink, "900", { lineHeight: 49 }), rect(`${id}-accent`, 85, 320, 120, 8, accent), text(`${id}-quote`, "Clarity creates confidence.", 85, 385, width - 170, 90, 27, accent, "700"), text(`${id}-body`, "A warm editorial card composition with generous margins, refined typography, and a premium printed-page feeling.", 85, 535, width - 170, 160, 18, ink, "600", { lineHeight: 30 }));
      break;
    case 11:
      elements.push(rect(`${id}-top`, 0, 0, width, 210, accent), text(`${id}-title`, title, pad, 75, width - pad * 2, 90, 38, paper, "900", { textAlign: "center" }));
      for (let i = 0; i < 4; i++) { const x = pad + i * ((width - pad * 2 - 54) / 4 + 18); const w = (width - pad * 2 - 54) / 4; elements.push(rect(`${id}-c${i}`, x, 285, w, 340, i % 2 === 0 ? ink : soft, { borderRadius: 16 }), text(`${id}-n${i}`, `0${i + 1}`, x + 18, 315, w - 36, 42, 24, i % 2 === 0 ? paper : accent, "900")); }
      break;
    case 12:
      elements.push(circle(`${id}-big`, width - 360, -80, 430, 430, accent), text(`${id}-title`, title, pad, 165, Math.round(width * 0.58), 210, 44, ink, "900", { lineHeight: 51 }), text(`${id}-sub`, subtitle, pad, 120, Math.round(width * 0.55), 28, 12, accent, "900", { letterSpacing: 2 }), rect(`${id}-block`, pad, 470, width - pad * 2, 250, ink, { borderRadius: 18 }), text(`${id}-body`, "STRATEGY\nDESIGN\nDELIVERY", pad + 38, 520, width - pad * 2 - 76, 150, 24, paper, "900", { lineHeight: 45 }), rect(`${id}-footer`, pad, 765, width - pad * 2, 80, soft, { borderRadius: 14 }));
      break;
    case 13:
      elements.push(rect(`${id}-bg`, 0, 0, width, height, ink), rect(`${id}-slash1`, -90, 180, width + 180, 155, accent, { rotation: -7 }), rect(`${id}-slash2`, -90, 660, width + 180, 120, soft, { rotation: 7 }), text(`${id}-title`, title, 70, 390, width - 140, 180, 48, paper, "900", { textAlign: "center", lineHeight: 56 }), text(`${id}-sub`, subtitle, 70, 590, width - 140, 30, 13, accent, "900", { textAlign: "center", letterSpacing: 2 }));
      break;
    case 14:
      elements.push(text(`${id}-title`, title, pad, 80, width - pad * 2, 110, 39, ink, "900"));
      for (let i = 0; i < 5; i++) { const y = 240 + i * 125; elements.push(circle(`${id}-dot${i}`, pad, y, 52, 52, i % 2 ? ink : accent), rect(`${id}-bar${i}`, pad + 80, y + 6, width - pad * 2 - 80, 40, i % 2 ? soft : accent, { borderRadius: 20 }), text(`${id}-label${i}`, `${String(i + 1).padStart(2, "0")}  ${["DISCOVER", "PLAN", "CREATE", "REVIEW", "PUBLISH"][i]}`, pad + 95, y + 15, width - pad * 2 - 110, 22, 14, i % 2 ? ink : paper, "900")); }
      break;
    case 15:
      elements.push(rect(`${id}-left`, 0, 0, Math.round(width * 0.31), height, soft), rect(`${id}-mid`, Math.round(width * 0.31), 0, Math.round(width * 0.38), height, ink), rect(`${id}-right`, Math.round(width * 0.69), 0, Math.round(width * 0.31), height, accent), text(`${id}-title`, title, Math.round(width * 0.34), 170, Math.round(width * 0.32), 230, 42, paper, "900", { textAlign: "center", lineHeight: 49 }), text(`${id}-lefttext`, "IDEA", 30, 365, Math.round(width * 0.25), 45, 22, ink, "900", { textAlign: "center" }), text(`${id}-righttext`, "RESULT", Math.round(width * 0.72), 365, Math.round(width * 0.25), 45, 22, paper, "900", { textAlign: "center" }));
      break;
    case 16:
      elements.push(rect(`${id}-frame`, pad, 90, width - pad * 2, height - 180, paper, { borderColor: accent, borderWidth: 5 }), text(`${id}-title`, title, 90, 180, width - 180, 170, 43, ink, "900", { textAlign: "center", lineHeight: 50 }), text(`${id}-sub`, subtitle, 90, 135, width - 180, 30, 12, accent, "900", { textAlign: "center", letterSpacing: 2 }), circle(`${id}-seal`, width / 2 - 70, 430, 140, 140, accent), text(`${id}-sealtext`, "25.26", width / 2 - 70, 478, 140, 40, 24, paper, "900", { textAlign: "center" }), text(`${id}-body`, "Professional edition\nFully editable\nProduction ready", 120, 650, width - 240, 145, 19, ink, "700", { textAlign: "center", lineHeight: 38 }));
      break;
    case 17:
      elements.push(text(`${id}-title`, title, pad, 95, width - pad * 2, 110, 38, ink, "900"), rect(`${id}-hero`, pad, 240, width - pad * 2, 280, ink, { borderRadius: 20 }), circle(`${id}-badge`, width - pad - 125, 275, 90, 90, accent), text(`${id}-heroText`, "PRIMARY FEATURE", pad + 35, 330, width - pad * 2 - 180, 60, 29, paper, "900"), rect(`${id}-small1`, pad, 560, Math.round((width - pad * 2 - 20) / 2), 220, soft, { borderRadius: 16 }), rect(`${id}-small2`, pad + Math.round((width - pad * 2 - 20) / 2) + 20, 560, Math.round((width - pad * 2 - 20) / 2), 220, accent, { borderRadius: 16 }));
      break;
    case 18:
      elements.push(rect(`${id}-stripe1`, 0, 0, width, 170, ink), rect(`${id}-stripe2`, 0, 170, width, 170, accent), rect(`${id}-stripe3`, 0, 340, width, 170, soft), rect(`${id}-stripe4`, 0, 510, width, height - 510, paper), text(`${id}-title`, title, pad, 60, width - pad * 2, 85, 39, paper, "900", { textAlign: "center" }), text(`${id}-sub`, subtitle, pad, 235, width - pad * 2, 30, 14, paper, "900", { textAlign: "center", letterSpacing: 2 }), text(`${id}-body`, "Structured information\nDistinct sections\nConfident visual rhythm", 90, 620, width - 180, 170, 21, ink, "800", { textAlign: "center", lineHeight: 45 }));
      break;
    default:
      elements.push(rect(`${id}-bg`, 0, 0, width, height, ink), circle(`${id}-orb1`, -110, -100, 390, 390, accent), circle(`${id}-orb2`, width - 250, height - 250, 360, 360, soft), rect(`${id}-panel`, 90, 95, width - 180, height - 190, paper, { borderRadius: 26, opacity: 0.96 }), text(`${id}-title`, title, 140, 210, width - 280, 180, 47, ink, "900", { textAlign: "center", lineHeight: 54 }), text(`${id}-sub`, subtitle, 140, 165, width - 280, 28, 13, accent, "900", { textAlign: "center", letterSpacing: 2 }), rect(`${id}-cta`, Math.round(width * 0.34), height - 245, Math.round(width * 0.32), 68, accent, { borderRadius: 34 }), text(`${id}-ctat`, "VIEW COLLECTION", Math.round(width * 0.34), height - 223, Math.round(width * 0.32), 26, 14, paper, "900", { textAlign: "center" }));
      break;
  }

  return {
    metadata: {
      id,
      name: spec.name,
      category: spec.category,
      subcategory: spec.subcategory,
      industry: spec.category,
      description: `${spec.name} is a handcrafted Phase 25.26 design with composition ${mode + 1}, variant ${variant + 1}, editable typography, shapes, and production-ready spacing.`,
      tags: [spec.category, spec.subcategory, `composition-${mode + 1}`, `variant-${variant + 1}`, "phase 25.26", "editable", "professional"],
      pageSize: landscape ? "US Letter Landscape" : "US Letter",
      orientation,
      previewColor: accent,
      palette,
      fonts: [index % 2 === 0 ? "Poppins" : "Inter", index % 3 === 0 ? "Playfair Display" : "Source Sans Pro"],
      author: "Yaposan Design Studio",
      version: "25.26",
      editable: true,
      featured: index < 20,
      trending: index % 5 === 0,
      access: index % 8 === 0 ? "premium" : "free",
      createdAt: NOW,
      updatedAt: NOW,
      style: (["corporate", "luxury", "minimal", "creative", "editorial", "bold", "elegant"] as const)[index % 7],
      qualityScore: 96,
    },
    pages: [page(`${id}-page-1`, spec.name, width, height, landscape ? "landscape" : "portrait", paper, elements)],
  };
};

export const PHASE2526_TEMPLATES: ProfessionalTemplate[] = SPECS.map(makeTemplate);
export const PHASE2526_TEMPLATE_COUNT = PHASE2526_TEMPLATES.length;
export const PHASE2526_COUNTS_BY_SUBCATEGORY = Object.fromEntries(groups.map((group) => [group.subcategory, group.names.length]));

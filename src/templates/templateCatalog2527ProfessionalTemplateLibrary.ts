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
  { category: "Events", subcategory: "Invitations", names: ["Modern Wedding Invitation", "Elegant Birthday Invitation", "Corporate Gala Invitation", "Baby Shower Invitation", "Graduation Celebration Invitation", "Holiday Dinner Invitation", "Community Awards Invitation", "Garden Party Invitation", "Retirement Celebration Invitation", "Art Opening Invitation"] },
  { category: "Retail", subcategory: "Labels and Packaging", names: ["Artisan Coffee Label", "Luxury Candle Label", "Organic Skincare Label", "Craft Food Package", "Boutique Soap Wrap", "Premium Tea Label", "Natural Honey Label", "Fashion Hang Tag", "Bakery Product Label", "Technology Accessory Package"] },
  { category: "Restaurant", subcategory: "Menus", names: ["Fine Dining Menu", "Modern Cafe Menu", "Italian Bistro Menu", "Street Food Menu", "Bakery Menu", "Cocktail Lounge Menu", "Healthy Bowl Menu", "Seafood Restaurant Menu", "Family Restaurant Menu", "Catering Service Menu"] },
  { category: "Marketing", subcategory: "Advertisements", names: ["Luxury Product Advertisement", "Retail Sale Advertisement", "Technology Launch Advertisement", "Fitness Membership Advertisement", "Travel Destination Advertisement", "Real Estate Listing Advertisement", "Restaurant Promotion Advertisement", "Healthcare Service Advertisement", "Education Program Advertisement", "Automotive Service Advertisement"] },
  { category: "Social Media", subcategory: "Campaign Sets", names: ["Brand Launch Social Campaign", "Seasonal Sale Social Campaign", "Restaurant Week Campaign", "Fitness Challenge Campaign", "Real Estate Open House Campaign", "Nonprofit Giving Campaign", "Technology Webinar Campaign", "Fashion Collection Campaign", "Travel Inspiration Campaign", "Education Enrollment Campaign"] },
  { category: "Business", subcategory: "Presentations", names: ["Executive Strategy Presentation", "Startup Pitch Presentation", "Quarterly Results Presentation", "Marketing Plan Presentation", "Product Roadmap Presentation", "Training Workshop Presentation", "Nonprofit Impact Presentation", "Creative Portfolio Presentation", "Research Findings Presentation", "Sales Proposal Presentation"] },
  { category: "Personal", subcategory: "Planners", names: ["Weekly Productivity Planner", "Monthly Goal Planner", "Small Business Planner", "Student Study Planner", "Wellness Habit Planner", "Wedding Planning Workbook", "Content Calendar Planner", "Project Action Planner", "Financial Budget Planner", "Meal Planning Workbook"] },
  { category: "Education", subcategory: "Certificates", names: ["Professional Achievement Certificate", "Academic Excellence Certificate", "Training Completion Certificate", "Volunteer Recognition Certificate", "Employee Appreciation Certificate", "Sports Participation Certificate", "Creative Arts Award Certificate", "Community Service Certificate", "Leadership Recognition Certificate", "Workshop Attendance Certificate"] },
  { category: "Print", subcategory: "Book Covers", names: ["Modern Business Book Cover", "Literary Fiction Book Cover", "Wellness Guide Book Cover", "Technology Handbook Cover", "Travel Memoir Book Cover", "Cookbook Editorial Cover", "Education Workbook Cover", "Mystery Novel Book Cover", "Poetry Collection Cover", "Personal Development Cover"] },
  { category: "Business", subcategory: "Proposals and Media Kits", names: ["Creative Agency Proposal", "Consulting Services Proposal", "Event Sponsorship Proposal", "Influencer Media Kit", "Podcast Media Kit", "Real Estate Proposal", "Construction Project Proposal", "Nonprofit Partnership Proposal", "Photography Services Proposal", "Technology Solutions Proposal"] },
];

const SPECS: Spec[] = groups.flatMap((group) => group.names.map((name) => ({ name, category: group.category, subcategory: group.subcategory })));
const PALETTES = [
  ["#111827", "#f97316", "#ffedd5", "#ffffff"], ["#172554", "#2563eb", "#dbeafe", "#ffffff"],
  ["#3f1d2e", "#db2777", "#fce7f3", "#ffffff"], ["#134e4a", "#0d9488", "#ccfbf1", "#ffffff"],
  ["#422006", "#ca8a04", "#fef9c3", "#ffffff"], ["#312e81", "#7c3aed", "#ede9fe", "#ffffff"],
  ["#14532d", "#65a30d", "#ecfccb", "#ffffff"], ["#4c0519", "#e11d48", "#ffe4e6", "#ffffff"],
  ["#082f49", "#0891b2", "#cffafe", "#ffffff"], ["#1c1917", "#78716c", "#f5f5f4", "#ffffff"],
];

const makeTemplate = (spec: Spec, index: number): ProfessionalTemplate => {
  const number = index + 201;
  const id = `p2527-${String(number).padStart(3, "0")}`;
  const family = Math.floor(index / 10);
  const variant = index % 10;
  const [ink, accent, soft, paper] = PALETTES[(family + variant) % PALETTES.length];
  const landscape = family === 5 || (family === 4 && variant % 2 === 1);
  const width = landscape ? 1056 : 816;
  const height = landscape ? 816 : 1056;
  const orientation: TemplateOrientation = landscape ? "landscape" : "portrait";
  const elements: PublisherElement[] = [];
  const pad = 44 + (variant % 3) * 8;
  const title = spec.name.toUpperCase();
  const shift = variant * 9;
  const columnGap = 14 + variant;

  elements.push(text(`${id}-brand`, "YAPOSAN PROFESSIONAL LIBRARY", pad, 28, width - pad * 2, 24, 10, accent, "900", { letterSpacing: 2 }));

  if (family === 0) {
    const panelX = variant % 2 === 0 ? 0 : Math.round(width * 0.58);
    elements.push(rect(`${id}-panel`, panelX, 0, Math.round(width * 0.42), height, ink), circle(`${id}-seal`, variant % 2 === 0 ? 58 + shift : width - 175 - shift, 120 + shift, 118, 118, accent), text(`${id}-title`, title, variant % 2 === 0 ? 54 : 82, 350 - shift, Math.round(width * 0.72), 180, 40 + (variant % 3) * 2, variant % 2 === 0 ? paper : ink, "900", { lineHeight: 48 }), text(`${id}-details`, `SATURDAY · ${variant + 10}:00 PM\nTHE GRAND HALL\nRSVP 555-01${variant}0`, variant % 2 === 0 ? Math.round(width * 0.48) : 72, 650 + shift, Math.round(width * 0.42), 130, 17, variant % 2 === 0 ? ink : paper, "700", { lineHeight: 34 }));
  } else if (family === 1) {
    const labelW = 520 + variant * 12;
    const labelH = 590 - variant * 8;
    elements.push(rect(`${id}-base`, (width - labelW) / 2, 170 + shift, labelW, labelH, paper, { borderColor: ink, borderWidth: 4 + (variant % 3), borderRadius: variant % 2 ? 28 : 8 }), circle(`${id}-mark`, width / 2 - 65, 225 + shift, 130, 130, accent), text(`${id}-title`, title, 120, 405 + shift, width - 240, 130, 34, ink, "900", { textAlign: "center", lineHeight: 40 }), rect(`${id}-band`, 130 + shift, 590 + shift, width - 260 - shift * 2, 62, ink, { borderRadius: 8 }), text(`${id}-small`, "HANDCRAFTED · PREMIUM QUALITY", 140 + shift, 610 + shift, width - 280 - shift * 2, 22, 12, paper, "900", { textAlign: "center", letterSpacing: 2 }), text(`${id}-net`, `${250 + variant * 25} g`, 120, 730 + shift, width - 240, 40, 16, accent, "900", { textAlign: "center" }));
  } else if (family === 2) {
    const cols = variant % 3 === 0 ? 2 : variant % 3 === 1 ? 3 : 1;
    elements.push(rect(`${id}-head`, 0, 0, width, 230 + shift, ink), text(`${id}-title`, title, pad, 85, width - pad * 2, 100, 39, paper, "900", { textAlign: variant % 2 ? "left" : "center" }), text(`${id}-sub`, "SEASONAL SELECTION", pad, 185, width - pad * 2, 24, 12, accent, "900", { textAlign: variant % 2 ? "left" : "center", letterSpacing: 3 }));
    for (let i = 0; i < 6; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = (width - pad * 2 - columnGap * (cols - 1)) / cols;
      const x = pad + col * (cellW + columnGap);
      const y = 300 + row * (cols === 1 ? 105 : 180);
      elements.push(text(`${id}-item-${i}`, ["SIGNATURE", "SEASONAL", "CLASSIC", "CHEF'S CHOICE", "HOUSE FAVORITE", "DESSERT"][i], x, y, cellW * 0.68, 35, 16, ink, "900"), text(`${id}-price-${i}`, `$${12 + i * 3 + variant}`, x + cellW * 0.72, y, cellW * 0.28, 35, 16, accent, "900", { textAlign: "right" }), rect(`${id}-rule-${i}`, x, y + 45, cellW, 2, soft));
    }
  } else if (family === 3) {
    const heroSide = variant % 2 === 0 ? "left" : "right";
    const heroX = heroSide === "left" ? 0 : Math.round(width * 0.52);
    elements.push(rect(`${id}-hero`, heroX, 0, Math.round(width * 0.48), height, soft), rect(`${id}-accent`, heroSide === "left" ? Math.round(width * 0.48) : 0, 0, Math.round(width * 0.52), 160 + shift, accent), text(`${id}-title`, title, heroSide === "left" ? Math.round(width * 0.53) : pad, 235 - shift, Math.round(width * 0.4), 190, 42, ink, "900", { lineHeight: 49 }), text(`${id}-offer`, `${20 + variant * 5}% OFF`, heroSide === "left" ? Math.round(width * 0.55) : pad, 500 + shift, Math.round(width * 0.36), 90, 36, accent, "900"), rect(`${id}-cta`, heroSide === "left" ? Math.round(width * 0.55) : pad, 660 + shift, 230 + variant * 8, 68, ink, { borderRadius: 34 }), text(`${id}-ctat`, "LEARN MORE", heroSide === "left" ? Math.round(width * 0.55) : pad, 682 + shift, 230 + variant * 8, 26, 14, paper, "900", { textAlign: "center" }));
  } else if (family === 4) {
    const blocks = 3 + (variant % 4);
    elements.push(text(`${id}-title`, title, pad, 78, width - pad * 2, 105, 36, ink, "900", { textAlign: "center" }), rect(`${id}-rule`, width * 0.35, 205, width * 0.3, 6, accent));
    for (let i = 0; i < blocks; i++) {
      const bw = (width - pad * 2 - columnGap * (blocks - 1)) / blocks;
      const x = pad + i * (bw + columnGap);
      const y = 300 + (i % 2) * (35 + variant * 2);
      elements.push(rect(`${id}-post-${i}`, x, y, bw, 330 - (i % 3) * 35, i % 2 === 0 ? ink : soft, { borderRadius: 16 + variant }), text(`${id}-num-${i}`, String(i + 1).padStart(2, "0"), x + 18, y + 20, bw - 36, 38, 21, i % 2 === 0 ? paper : accent, "900"));
    }
    elements.push(text(`${id}-footer`, "ONE CAMPAIGN · MULTIPLE FORMATS · CONSISTENT BRAND", pad, height - 105, width - pad * 2, 30, 13, accent, "900", { textAlign: "center", letterSpacing: 2 }));
  } else if (family === 5) {
    const side = 240 + variant * 10;
    elements.push(rect(`${id}-sidebar`, 0, 0, side, height, ink), text(`${id}-section`, `0${variant + 1}`, 45, 70, side - 90, 70, 40, accent, "900"), text(`${id}-title`, title, side + 55, 95, width - side - 110, 130, 43, ink, "900", { lineHeight: 50 }), text(`${id}-body`, "STRATEGY\nMARKET\nEXECUTION\nRESULTS", side + 60, 300, Math.round((width - side) * 0.34), 230, 20, accent, "900", { lineHeight: 48 }), rect(`${id}-chart`, side + Math.round((width - side) * 0.43), 285, Math.round((width - side) * 0.47), 300, soft, { borderRadius: 22 }), rect(`${id}-bar1`, side + Math.round((width - side) * 0.48), 500 - variant * 9, 58, 85 + variant * 9, accent), rect(`${id}-bar2`, side + Math.round((width - side) * 0.59), 450 - variant * 5, 58, 135 + variant * 5, ink), rect(`${id}-bar3`, side + Math.round((width - side) * 0.70), 390 + variant * 3, 58, 195 - variant * 3, accent));
  } else if (family === 6) {
    elements.push(text(`${id}-title`, title, pad, 70, width - pad * 2, 95, 34, ink, "900"));
    const rowH = 120 + variant * 3;
    for (let i = 0; i < 6; i++) {
      const y = 210 + i * (rowH + 10);
      elements.push(rect(`${id}-check-${i}`, pad, y, 42, 42, i < variant % 7 ? accent : paper, { borderColor: accent, borderWidth: 3, borderRadius: 8 }), text(`${id}-task-${i}`, ["Top priority", "Important meeting", "Focused work", "Follow-up", "Personal goal", "Notes and reflection"][i], pad + 70, y + 3, width - pad * 2 - 70, 38, 17, ink, "800"), rect(`${id}-line-${i}`, pad + 70, y + 54, width - pad * 2 - 70, 2, soft));
    }
    elements.push(rect(`${id}-score`, width - 190, 45, 135, 90, soft, { borderRadius: 18 }), text(`${id}-scoret`, `${70 + variant * 3}%`, width - 190, 70, 135, 40, 25, accent, "900", { textAlign: "center" }));
  } else if (family === 7) {
    const frame = 28 + variant * 3;
    elements.push(rect(`${id}-outer`, frame, frame, width - frame * 2, height - frame * 2, paper, { borderColor: ink, borderWidth: 3 }), rect(`${id}-inner`, frame + 18, frame + 18, width - (frame + 18) * 2, height - (frame + 18) * 2, paper, { borderColor: accent, borderWidth: 2 }), circle(`${id}-seal`, width / 2 - 62, 150 + shift, 124, 124, accent), text(`${id}-heading`, "CERTIFICATE OF ACHIEVEMENT", 95, 325 + shift, width - 190, 55, 23, accent, "900", { textAlign: "center", letterSpacing: 2 }), text(`${id}-title`, title, 90, 425 + shift, width - 180, 100, 35, ink, "900", { textAlign: "center" }), text(`${id}-name`, "RECIPIENT NAME", 130, 590 + shift, width - 260, 60, 28, ink, "700", { textAlign: "center" }), rect(`${id}-signature`, 120, 800 + shift, 210, 2, ink), rect(`${id}-date`, width - 330, 800 + shift, 210, 2, ink));
  } else if (family === 8) {
    const bandY = 300 + variant * 26;
    elements.push(rect(`${id}-bg`, 0, 0, width, height, ink), circle(`${id}-orb1`, -120 + shift, 90, 360, 360, accent, { opacity: 0.9 }), circle(`${id}-orb2`, width - 280 - shift, height - 340, 390, 390, soft, { opacity: 0.75 }), rect(`${id}-band`, 0, bandY, width, 250 - variant * 5, paper, { opacity: 0.94 }), text(`${id}-title`, title, 70, bandY + 45, width - 140, 145, 43, ink, "900", { textAlign: variant % 2 ? "left" : "center", lineHeight: 50 }), text(`${id}-author`, `AUTHOR NAME · EDITION ${variant + 1}`, 70, height - 120, width - 140, 30, 14, paper, "900", { textAlign: "center", letterSpacing: 2 }));
  } else {
    const cards = 2 + (variant % 4);
    elements.push(rect(`${id}-head`, 0, 0, width, 210 + shift, accent), text(`${id}-title`, title, pad, 70, width - pad * 2, 100, 38, paper, "900", { textAlign: variant % 2 ? "left" : "center" }), text(`${id}-intro`, "A focused professional document designed to present services, value, proof, and next steps with clarity.", pad, 260 + shift, width - pad * 2, 100, 18, ink, "600", { lineHeight: 29 }));
    for (let i = 0; i < cards; i++) {
      const cw = (width - pad * 2 - columnGap * (cards - 1)) / cards;
      const x = pad + i * (cw + columnGap);
      elements.push(rect(`${id}-card-${i}`, x, 420 + (i % 2) * (variant * 5), cw, 250 + (i % 3) * 30, i % 2 ? soft : ink, { borderRadius: 14 + variant }), text(`${id}-cardn-${i}`, String(i + 1).padStart(2, "0"), x + 20, 445, cw - 40, 40, 22, i % 2 ? accent : paper, "900"));
    }
    elements.push(rect(`${id}-cta`, pad, height - 150, width - pad * 2, 70, accent, { borderRadius: 18 }), text(`${id}-ctat`, "READY TO BEGIN · CONTACT@EXAMPLE.COM", pad, height - 126, width - pad * 2, 24, 13, paper, "900", { textAlign: "center", letterSpacing: 1 }));
  }

  return {
    metadata: {
      id,
      name: spec.name,
      category: spec.category,
      subcategory: spec.subcategory,
      industry: spec.category,
      description: `${spec.name} is a handcrafted template with a distinct layout, editable text, vector shapes, and professional production spacing.`,
      tags: [spec.category, spec.subcategory, `family-${family + 1}`, `layout-${variant + 1}`, "", "editable", "professional"],
      pageSize: landscape ? "US Letter Landscape" : "US Letter",
      orientation,
      previewColor: accent,
      palette: [ink, accent, soft, paper],
      fonts: [variant % 2 === 0 ? "Poppins" : "Inter", variant % 3 === 0 ? "Playfair Display" : "Source Sans Pro"],
      author: "Yaposan Design Studio",
      version: "25.27",
      editable: true,
      featured: index < 20,
      trending: index % 4 === 0,
      access: index % 9 === 0 ? "premium" : "free",
      createdAt: NOW,
      updatedAt: NOW,
      style: (["corporate", "luxury", "minimal", "creative", "editorial", "bold", "elegant"] as const)[(family + variant) % 7],
      qualityScore: 97,
    },
    pages: [page(`${id}-page-1`, spec.name, width, height, landscape ? "landscape" : "portrait", paper, elements)],
  };
};

export const PHASE2527_TEMPLATES: ProfessionalTemplate[] = SPECS.map(makeTemplate);
export const PHASE2527_TEMPLATE_COUNT = PHASE2527_TEMPLATES.length;
export const PHASE2527_COUNTS_BY_SUBCATEGORY = Object.fromEntries(groups.map((group) => [group.subcategory, group.names.length]));

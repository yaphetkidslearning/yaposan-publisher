import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, ProfessionalTemplateCategory, TemplateOrientation } from "./types";

const NOW = "2026-07-28T00:00:00.000Z";
const el = (id: string, name: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement => ({ id, name, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra });
const text = (id: string, value: string, x: number, y: number, width: number, height: number, size: number, color: string, weight: PublisherElement["fontWeight"] = "700", extra: Partial<PublisherElement> = {}) => el(id, value.slice(0, 24), "text", x, y, width, height, 20, { text: value, fontSize: size, textColor: color, fontWeight: weight, lineHeight: size * 1.2, ...extra });
const rect = (id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) => el(id, id, "rectangle", x, y, width, height, 5, { fillColor, borderWidth: 0, ...extra });
const circle = (id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) => el(id, id, "circle", x, y, width, height, 6, { fillColor, borderWidth: 0, ...extra });
const page = (id: string, name: string, width: number, height: number, orientation: "portrait" | "landscape", backgroundColor: string, elements: PublisherElement[]): PublisherPage => ({ id, name, width, height, orientation, sizeKey: "custom", backgroundColor, margin: 32, bleed: DEFAULT_BLEED, elements });

const makeTemplate = (index: number, name: string, category: ProfessionalTemplateCategory, subcategory: string, layout: string, palette: string[]): ProfessionalTemplate => {
  const [ink, accent, soft, paper] = palette;
  const id = `p2525-${String(index).padStart(3, "0")}`;
  const portrait = layout !== "poster" || index % 2 === 0;
  const width = portrait ? 816 : 1056;
  const height = portrait ? 1056 : 816;
  const orientation: TemplateOrientation = portrait ? "portrait" : "landscape";
  const elements: PublisherElement[] = [];
  const addBase = () => { elements.push(text(`${id}-brand`, "YAPOSAN STUDIO", 54, 42, width - 108, 28, 13, accent, "900", { letterSpacing: 2 })); };
  addBase();
  if (layout === "split") {
    elements.push(rect(`${id}-panel`, 0, 0, Math.round(width * 0.38), height, ink), text(`${id}-title`, name.toUpperCase(), 48, 170, Math.round(width * 0.3), 230, 34, paper, "900", { lineHeight: 42 }), text(`${id}-kicker`, subcategory.toUpperCase(), 48, 120, Math.round(width * 0.28), 30, 13, accent, "900", { letterSpacing: 2 }), rect(`${id}-photo`, Math.round(width * 0.44), 90, Math.round(width * 0.48), Math.round(height * 0.42), soft, { borderRadius: 18 }), text(`${id}-body`, "A polished, fully editable professional layout with clear hierarchy, practical content zones, and production-ready spacing.", Math.round(width * 0.44), Math.round(height * 0.58), Math.round(width * 0.48), 160, 17, ink, "600", { lineHeight: 29 }));
  } else if (layout === "hero") {
    elements.push(rect(`${id}-hero`, 0, 0, width, Math.round(height * 0.46), ink), circle(`${id}-orb`, width - 260, -70, 320, 320, accent, { opacity: 0.85 }), text(`${id}-title`, name.toUpperCase(), 58, 150, Math.round(width * 0.68), 150, 42, paper, "900", { lineHeight: 49 }), text(`${id}-sub`, "DESIGNED FOR IMPACT", 60, 115, 360, 28, 14, accent, "900", { letterSpacing: 3 }), rect(`${id}-card1`, 58, Math.round(height * 0.56), Math.round(width * 0.26), 180, soft, { borderRadius: 16 }), rect(`${id}-card2`, Math.round(width * 0.37), Math.round(height * 0.56), Math.round(width * 0.26), 180, soft, { borderRadius: 16 }), rect(`${id}-card3`, Math.round(width * 0.68), Math.round(height * 0.56), Math.round(width * 0.26), 180, soft, { borderRadius: 16 }));
  } else if (layout === "sidebar") {
    elements.push(rect(`${id}-side`, 0, 0, 190, height, accent), text(`${id}-title`, name.toUpperCase(), 240, 110, width - 300, 120, 38, ink, "900", { lineHeight: 45 }), rect(`${id}-line`, 240, 255, width - 300, 5, accent), text(`${id}-body`, "Professional overview\nKey services and benefits\nContact and call to action", 240, 310, width - 300, 240, 19, ink, "700", { lineHeight: 42 }), circle(`${id}-mark`, 50, 90, 90, 90, paper), text(`${id}-num`, String(index).padStart(2, "0"), 66, 115, 58, 35, 24, accent, "900", { textAlign: "center" }));
  } else if (layout === "bands") {
    elements.push(rect(`${id}-top`, 0, 0, width, 190, ink), rect(`${id}-accent`, 0, 190, width, 18, accent), text(`${id}-title`, name.toUpperCase(), 54, 78, width - 108, 75, 34, paper, "900", { textAlign: "center" }), text(`${id}-intro`, "A structured publication with strong horizontal rhythm and clearly separated information sections.", 80, 280, width - 160, 90, 18, ink, "600", { textAlign: "center", lineHeight: 29 }), rect(`${id}-band1`, 70, 420, width - 140, 100, soft, { borderRadius: 14 }), rect(`${id}-band2`, 70, 555, width - 140, 100, soft, { borderRadius: 14 }), rect(`${id}-band3`, 70, 690, width - 140, 100, soft, { borderRadius: 14 }));
  } else if (layout === "cards") {
    elements.push(text(`${id}-title`, name.toUpperCase(), 55, 100, width - 110, 80, 36, ink, "900"), text(`${id}-sub`, "MODULAR PROFESSIONAL EDITION", 58, 190, width - 116, 26, 13, accent, "900", { letterSpacing: 2 }), rect(`${id}-card1`, 55, 270, Math.round((width - 135) / 2), 260, ink, { borderRadius: 18 }), rect(`${id}-card2`, 80 + Math.round((width - 135) / 2), 270, Math.round((width - 135) / 2), 260, soft, { borderRadius: 18 }), rect(`${id}-card3`, 55, 560, width - 110, 250, accent, { borderRadius: 18 }), text(`${id}-c1`, "01\nOVERVIEW", 85, 320, 220, 90, 23, paper, "900", { lineHeight: 34 }), text(`${id}-c2`, "02\nDETAILS", width / 2 + 40, 320, 220, 90, 23, ink, "900", { lineHeight: 34 }), text(`${id}-c3`, "03  CALL TO ACTION", 90, 650, width - 180, 50, 24, paper, "900", { textAlign: "center" }));
  } else if (layout === "editorial") {
    elements.push(text(`${id}-issue`, "ISSUE 01 / 2026", 55, 70, 260, 24, 12, accent, "900", { letterSpacing: 2 }), text(`${id}-title`, name.toUpperCase(), 55, 120, width - 110, 145, 48, ink, "900", { lineHeight: 51 }), rect(`${id}-photo`, 55, 310, Math.round(width * 0.55), 430, soft), text(`${id}-quote`, "Design is clarity made visible.", Math.round(width * 0.66), 335, Math.round(width * 0.27), 150, 25, accent, "700", { lineHeight: 36 }), text(`${id}-copy`, "Editorial storytelling with balanced image space, refined typography, and a contemporary magazine-inspired composition.", Math.round(width * 0.66), 520, Math.round(width * 0.27), 210, 16, ink, "600", { lineHeight: 28 }));
  } else if (layout === "diagonal") {
    elements.push(rect(`${id}-bg`, 0, 0, width, height, ink), rect(`${id}-slash`, Math.round(width * 0.58), -80, 180, height + 160, accent, { rotation: 12 }), text(`${id}-title`, name.toUpperCase(), 60, 180, Math.round(width * 0.52), 200, 43, paper, "900", { lineHeight: 50 }), text(`${id}-sub`, "BOLD / MODERN / EDITABLE", 62, 140, 430, 28, 14, accent, "900", { letterSpacing: 2 }), rect(`${id}-info`, 60, Math.round(height * 0.67), Math.round(width * 0.45), 150, soft, { borderRadius: 16 }), text(`${id}-info-text`, "Professional content\nClear call to action", 90, Math.round(height * 0.72), Math.round(width * 0.38), 80, 18, ink, "800", { lineHeight: 30 }));
  } else if (layout === "grid") {
    elements.push(text(`${id}-title`, name.toUpperCase(), 55, 80, width - 110, 70, 34, ink, "900", { textAlign: "center" }));
    for (let r=0;r<2;r++) for (let c=0;c<3;c++) { const n=r*3+c; const cw=(width-150)/3; elements.push(rect(`${id}-g${n}`, 55+c*(cw+20), 205+r*250, cw, 210, n%2===0?soft:ink, { borderRadius: 14 }), text(`${id}-gt${n}`, `0${n+1}`, 75+c*(cw+20), 235+r*250, cw-40, 45, 24, n%2===0?accent:paper, "900")); }
  } else if (layout === "minimal") {
    elements.push(rect(`${id}-rule`, 55, 160, 140, 6, accent), text(`${id}-title`, name.toUpperCase(), 55, 205, width - 110, 160, 46, ink, "700", { lineHeight: 52 }), text(`${id}-body`, "Quiet typography, generous whitespace, and a precise professional structure create a premium minimalist document.", 55, 430, Math.round(width * 0.58), 170, 19, ink, "500", { lineHeight: 32 }), circle(`${id}-dot`, width - 180, height - 220, 95, 95, accent), text(`${id}-footer`, subcategory.toUpperCase(), 55, height - 90, width - 110, 25, 12, ink, "900", { letterSpacing: 2 }));
  } else {
    elements.push(rect(`${id}-poster-bg`, 0, 0, width, height, ink), circle(`${id}-poster-orb1`, -80, -50, 360, 360, accent), circle(`${id}-poster-orb2`, width - 280, height - 280, 380, 380, soft), text(`${id}-title`, name.toUpperCase(), 70, Math.round(height * 0.27), width - 140, 220, 50, paper, "900", { textAlign: "center", lineHeight: 58 }), text(`${id}-date`, "JULY 28 • 6:00 PM", 70, Math.round(height * 0.62), width - 140, 36, 18, accent, "900", { textAlign: "center", letterSpacing: 2 }), rect(`${id}-cta`, Math.round(width * 0.31), Math.round(height * 0.72), Math.round(width * 0.38), 68, accent, { borderRadius: 34 }), text(`${id}-cta-text`, "LEARN MORE", Math.round(width * 0.31), Math.round(height * 0.735), Math.round(width * 0.38), 35, 18, paper, "900", { textAlign: "center" }));
  }
  return { metadata: { id, name, category, subcategory, industry: category, description: `${name} — a distinct handcrafted template with a unique ${layout} composition.`, tags: [category, subcategory, layout, "handcrafted", "", "unique layout"], pageSize: portrait ? "US Letter" : "US Letter Landscape", orientation, previewColor: accent, palette, fonts: [index % 2 ? "Inter" : "Poppins", index % 3 ? "Source Sans Pro" : "Playfair Display"], author: "Yaposan Design Studio", version: "25.25", editable: true, featured: index <= 20, trending: index % 4 === 0, access: index % 7 === 0 ? "premium" : "free", createdAt: NOW, updatedAt: NOW, style: (["corporate","luxury","minimal","creative","editorial","bold","elegant"] as const)[index % 7], qualityScore: 100, masterTemplateId: id }, pages: [page(`${id}-page`, name, width, height, portrait ? "portrait" : "landscape", paper, elements)] };
};

export const PHASE2525_TEMPLATES: ProfessionalTemplate[] = [
  makeTemplate(1, "Executive Annual Report", "Business", "Business Documents", "split", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(2, "Modern Company Profile", "Business", "Business Documents", "hero", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(3, "Professional Proposal", "Business", "Business Documents", "sidebar", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(4, "Corporate Letterhead", "Business", "Business Documents", "bands", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(5, "Consulting Invoice", "Business", "Business Documents", "cards", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(6, "Startup Business Plan", "Business", "Business Documents", "editorial", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(7, "Leadership One-Sheet", "Business", "Business Documents", "diagonal", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(8, "Quarterly Report", "Business", "Business Documents", "grid", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(9, "Service Estimate", "Business", "Business Documents", "minimal", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(10, "Project Brief", "Business", "Business Documents", "poster", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(11, "Product Launch Flyer", "Marketing", "Marketing Campaigns", "hero", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(12, "Creative Agency Brochure", "Marketing", "Marketing Campaigns", "sidebar", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(13, "Summer Sale Poster", "Marketing", "Marketing Campaigns", "bands", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(14, "Brand Campaign One-Sheet", "Marketing", "Marketing Campaigns", "cards", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(15, "Event Promotion Flyer", "Marketing", "Marketing Campaigns", "editorial", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(16, "Digital Services Brochure", "Marketing", "Marketing Campaigns", "diagonal", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(17, "Retail Grand Opening", "Marketing", "Marketing Campaigns", "grid", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(18, "Email Campaign Guide", "Marketing", "Marketing Campaigns", "minimal", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(19, "Conference Promo Sheet", "Marketing", "Marketing Campaigns", "poster", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(20, "Membership Campaign", "Marketing", "Marketing Campaigns", "split", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(21, "Instagram Product Post", "Social Media", "Social Media Posts", "sidebar", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(22, "LinkedIn Announcement", "Social Media", "Social Media Posts", "bands", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(23, "Facebook Event Graphic", "Social Media", "Social Media Posts", "cards", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(24, "Square Quote Card", "Social Media", "Social Media Posts", "editorial", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(25, "YouTube Community Post", "Social Media", "Social Media Posts", "diagonal", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(26, "Story Sale Promotion", "Social Media", "Social Media Posts", "grid", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(27, "Podcast Episode Card", "Social Media", "Social Media Posts", "minimal", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(28, "Social Testimonial Card", "Social Media", "Social Media Posts", "poster", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(29, "New Arrival Post", "Social Media", "Social Media Posts", "split", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(30, "Webinar Promotion", "Social Media", "Social Media Posts", "hero", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(31, "Editorial Magazine Cover", "Print", "Print Publications", "bands", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(32, "Community Newsletter", "Print", "Print Publications", "cards", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(33, "Achievement Certificate", "Print", "Print Publications", "editorial", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(34, "Monthly Wall Calendar", "Print", "Print Publications", "diagonal", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(35, "Tri-Fold Information Guide", "Print", "Print Publications", "grid", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(36, "Wedding Invitation", "Print", "Print Publications", "minimal", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(37, "Restaurant Table Tent", "Print", "Print Publications", "poster", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(38, "Product Price List", "Print", "Print Publications", "split", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(39, "Event Program", "Print", "Print Publications", "hero", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(40, "Photo Collage Poster", "Print", "Print Publications", "sidebar", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(41, "School Newsletter", "Education", "Education Materials", "cards", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(42, "Classroom Poster", "Education", "Education Materials", "editorial", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(43, "Course Syllabus", "Education", "Education Materials", "diagonal", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(44, "Student Certificate", "Education", "Education Materials", "grid", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(45, "Open House Flyer", "Education", "Education Materials", "minimal", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(46, "Parent Information Guide", "Education", "Education Materials", "poster", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(47, "Science Fair Poster", "Education", "Education Materials", "split", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(48, "Tutoring Brochure", "Education", "Education Materials", "hero", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(49, "Graduation Program", "Education", "Education Materials", "sidebar", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(50, "Academic Calendar", "Education", "Education Materials", "bands", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(51, "Clinic Services Brochure", "Healthcare", "Healthcare Publications", "editorial", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(52, "Wellness Newsletter", "Healthcare", "Healthcare Publications", "diagonal", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(53, "Appointment Reminder", "Healthcare", "Healthcare Publications", "grid", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(54, "Dental Care Flyer", "Healthcare", "Healthcare Publications", "minimal", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(55, "Patient Welcome Guide", "Healthcare", "Healthcare Publications", "poster", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(56, "Mental Wellness Poster", "Healthcare", "Healthcare Publications", "split", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(57, "Pediatric Information Sheet", "Healthcare", "Healthcare Publications", "hero", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(58, "Health Screening Flyer", "Healthcare", "Healthcare Publications", "sidebar", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(59, "Medical Conference Poster", "Healthcare", "Healthcare Publications", "bands", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(60, "Nutrition One-Sheet", "Healthcare", "Healthcare Publications", "cards", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(61, "Luxury Property Flyer", "Real Estate", "Real Estate Marketing", "diagonal", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(62, "Open House Postcard", "Real Estate", "Real Estate Marketing", "grid", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(63, "Agent Business Card", "Real Estate", "Real Estate Marketing", "minimal", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(64, "Property Listing Sheet", "Real Estate", "Real Estate Marketing", "poster", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(65, "Neighborhood Guide", "Real Estate", "Real Estate Marketing", "split", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(66, "Commercial Property Brochure", "Real Estate", "Real Estate Marketing", "hero", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(67, "Just Sold Announcement", "Real Estate", "Real Estate Marketing", "sidebar", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(68, "Rental Information Sheet", "Real Estate", "Real Estate Marketing", "bands", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(69, "Real Estate Newsletter", "Real Estate", "Real Estate Marketing", "cards", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(70, "Home Buyer Checklist", "Real Estate", "Real Estate Marketing", "editorial", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(71, "Fine Dining Menu", "Restaurant", "Restaurant Publications", "grid", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(72, "Cafe Takeout Menu", "Restaurant", "Restaurant Publications", "minimal", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(73, "Food Truck Flyer", "Restaurant", "Restaurant Publications", "poster", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(74, "Seasonal Specials Card", "Restaurant", "Restaurant Publications", "split", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(75, "Restaurant Grand Opening", "Restaurant", "Restaurant Publications", "hero", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(76, "Cocktail Menu", "Restaurant", "Restaurant Publications", "sidebar", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(77, "Bakery Price List", "Restaurant", "Restaurant Publications", "bands", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(78, "Catering Brochure", "Restaurant", "Restaurant Publications", "cards", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(79, "Chef Tasting Menu", "Restaurant", "Restaurant Publications", "editorial", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(80, "Table Reservation Card", "Restaurant", "Restaurant Publications", "diagonal", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(81, "Sunday Worship Program", "Church", "Church Publications", "minimal", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(82, "Church Event Flyer", "Church", "Church Publications", "poster", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(83, "Youth Ministry Poster", "Church", "Church Publications", "split", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"]),
  makeTemplate(84, "Bible Study Guide", "Church", "Church Publications", "hero", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(85, "Community Outreach Brochure", "Church", "Church Publications", "sidebar", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(86, "Holiday Service Program", "Church", "Church Publications", "bands", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(87, "Prayer Meeting Card", "Church", "Church Publications", "cards", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(88, "Church Newsletter", "Church", "Church Publications", "editorial", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(89, "Volunteer Invitation", "Church", "Church Publications", "diagonal", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(90, "Faith Conference Poster", "Church", "Church Publications", "grid", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(91, "AI Startup Pitch Deck", "Technology", "Technology Publications", "poster", ["#1f2937","#ef4444","#fee2e2","#ffffff"]),
  makeTemplate(92, "SaaS Product One-Sheet", "Technology", "Technology Publications", "split", ["#173f35","#84cc16","#ecfccb","#ffffff"]),
  makeTemplate(93, "Cybersecurity Brochure", "Technology", "Technology Publications", "hero", ["#0b132b","#5bc0be","#e0fbfc","#ffffff"]),
  makeTemplate(94, "App Launch Poster", "Technology", "Technology Publications", "sidebar", ["#0f172a","#2563eb","#e0f2fe","#ffffff"]),
  makeTemplate(95, "Technology Conference Flyer", "Technology", "Technology Publications", "bands", ["#111827","#d4a017","#f7f3e8","#ffffff"]),
  makeTemplate(96, "Software Feature Sheet", "Technology", "Technology Publications", "cards", ["#16324f","#2a9d8f","#e9f5f2","#ffffff"]),
  makeTemplate(97, "Cloud Services Brochure", "Technology", "Technology Publications", "editorial", ["#3f1d5b","#ec4899","#fae8ff","#ffffff"]),
  makeTemplate(98, "Developer Meetup Poster", "Technology", "Technology Publications", "diagonal", ["#3b2416","#c96f3b","#fff7ed","#ffffff"]),
  makeTemplate(99, "Innovation Report", "Technology", "Technology Publications", "grid", ["#102a43","#00a6a6","#e6fffb","#ffffff"]),
  makeTemplate(100, "Digital Transformation Guide", "Technology", "Technology Publications", "minimal", ["#201a23","#8b5cf6","#f3e8ff","#ffffff"])
];
export const PHASE2525_TEMPLATE_COUNT = PHASE2525_TEMPLATES.length;

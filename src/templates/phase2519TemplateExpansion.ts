import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, ProfessionalTemplateCategory, TemplateOrientation } from "./types";

const NOW = "2026-07-28T12:00:00.000Z";

export type Phase2519CategoryGroup = {
  id: "business" | "marketing" | "social-media" | "print" | "office";
  label: string;
  icon: string;
  items: readonly string[];
};

export const PHASE2519_CATEGORY_GROUPS: readonly Phase2519CategoryGroup[] = [
  { id: "business", label: "Business", icon: "briefcase-outline", items: ["Business Cards", "Letterheads", "Invoices", "Quotes", "Receipts", "Envelopes", "Reports", "Proposals"] },
  { id: "marketing", label: "Marketing", icon: "megaphone-outline", items: ["Flyers", "Posters", "Brochures", "Banners", "Coupons", "Catalogs", "Rack Cards", "Menus"] },
  { id: "social-media", label: "Social Media", icon: "phone-portrait-outline", items: ["Instagram Posts", "Instagram Stories", "Facebook Posts", "Facebook Covers", "LinkedIn Posts", "X (Twitter)", "Pinterest", "TikTok", "YouTube Thumbnails"] },
  { id: "print", label: "Print", icon: "print-outline", items: ["Labels", "Stickers", "Invitations", "Greeting Cards", "Calendars", "Certificates", "Tickets", "Book Covers"] },
  { id: "office", label: "Office", icon: "folder-open-outline", items: ["Resumes", "Newsletters", "Forms", "Checklists", "Planners", "Schedules"] },
] as const;

export const PHASE2519_COLLECTION_TARGETS = [
  { label: "Business Cards", count: 640, icon: "card-outline" },
  { label: "Letterheads", count: 500, icon: "document-text-outline" },
  { label: "Invoices", count: 400, icon: "receipt-outline" },
  { label: "Brochures", count: 300, icon: "book-outline" },
  { label: "Flyers", count: 400, icon: "megaphone-outline" },
  { label: "Certificates", count: 300, icon: "ribbon-outline" },
  { label: "Postcards", count: 250, icon: "mail-outline" },
  { label: "Calendars", count: 200, icon: "calendar-outline" },
  { label: "Newsletters", count: 250, icon: "newspaper-outline" },
  { label: "Social Media Templates", count: 800, icon: "phone-portrait-outline" },
  { label: "Marketing Templates", count: 600, icon: "color-palette-outline" },
  { label: "Corporate Templates", count: 500, icon: "business-outline" },
] as const;

type Format = { width: number; height: number; orientation: TemplateOrientation; pageSize: string; pages?: number };
type SubcategorySpec = { group: Phase2519CategoryGroup["id"]; subcategory: string; category: ProfessionalTemplateCategory; format: Format; industry: string };

const FORMAT = {
  card: { width: 336, height: 192, orientation: "landscape", pageSize: "Business Card", pages: 2 },
  letter: { width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter" },
  landscapeLetter: { width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter" },
  square: { width: 1080, height: 1080, orientation: "square", pageSize: "1080 x 1080" },
  story: { width: 1080, height: 1920, orientation: "portrait", pageSize: "1080 x 1920" },
  cover: { width: 1640, height: 624, orientation: "landscape", pageSize: "1640 x 624" },
  banner: { width: 1200, height: 400, orientation: "landscape", pageSize: "1200 x 400" },
  postcard: { width: 576, height: 384, orientation: "landscape", pageSize: "6 x 4 in", pages: 2 },
} as const satisfies Record<string, Format>;

const SPECS: readonly SubcategorySpec[] = [
  { group:"business", subcategory:"Business Cards", category:"Business", format:FORMAT.card, industry:"Corporate" },
  { group:"business", subcategory:"Letterheads", category:"Business", format:FORMAT.letter, industry:"Corporate" },
  { group:"business", subcategory:"Invoices", category:"Business", format:FORMAT.letter, industry:"Finance" },
  { group:"business", subcategory:"Quotes", category:"Business", format:FORMAT.letter, industry:"Sales" },
  { group:"business", subcategory:"Receipts", category:"Business", format:FORMAT.letter, industry:"Retail" },
  { group:"business", subcategory:"Envelopes", category:"Business", format:{width:912,height:396,orientation:"landscape",pageSize:"DL Envelope"}, industry:"Corporate" },
  { group:"business", subcategory:"Reports", category:"Business", format:{...FORMAT.letter,pages:4}, industry:"Corporate" },
  { group:"business", subcategory:"Proposals", category:"Business", format:{...FORMAT.letter,pages:5}, industry:"Consulting" },
  { group:"marketing", subcategory:"Flyers", category:"Marketing", format:FORMAT.letter, industry:"Marketing" },
  { group:"marketing", subcategory:"Posters", category:"Marketing", format:{width:1152,height:1728,orientation:"portrait",pageSize:"12 x 18 in"}, industry:"Events" },
  { group:"marketing", subcategory:"Brochures", category:"Marketing", format:{...FORMAT.landscapeLetter,pages:2}, industry:"Corporate" },
  { group:"marketing", subcategory:"Banners", category:"Marketing", format:FORMAT.banner, industry:"Marketing" },
  { group:"marketing", subcategory:"Coupons", category:"Marketing", format:{width:672,height:288,orientation:"landscape",pageSize:"7 x 3 in"}, industry:"Retail" },
  { group:"marketing", subcategory:"Catalogs", category:"Marketing", format:{...FORMAT.letter,pages:6}, industry:"Retail" },
  { group:"marketing", subcategory:"Rack Cards", category:"Marketing", format:{width:384,height:864,orientation:"portrait",pageSize:"4 x 9 in",pages:2}, industry:"Travel" },
  { group:"marketing", subcategory:"Menus", category:"Restaurant", format:{...FORMAT.letter,pages:2}, industry:"Restaurant" },
  { group:"social-media", subcategory:"Instagram Posts", category:"Social Media", format:FORMAT.square, industry:"Multi-platform" },
  { group:"social-media", subcategory:"Instagram Stories", category:"Social Media", format:FORMAT.story, industry:"Multi-platform" },
  { group:"social-media", subcategory:"Facebook Posts", category:"Social Media", format:{width:1200,height:630,orientation:"landscape",pageSize:"1200 x 630"}, industry:"Multi-platform" },
  { group:"social-media", subcategory:"Facebook Covers", category:"Social Media", format:FORMAT.cover, industry:"Multi-platform" },
  { group:"social-media", subcategory:"LinkedIn Posts", category:"Social Media", format:FORMAT.square, industry:"Corporate" },
  { group:"social-media", subcategory:"X (Twitter)", category:"Social Media", format:{width:1600,height:900,orientation:"landscape",pageSize:"1600 x 900"}, industry:"Multi-platform" },
  { group:"social-media", subcategory:"Pinterest", category:"Social Media", format:{width:1000,height:1500,orientation:"portrait",pageSize:"1000 x 1500"}, industry:"Multi-platform" },
  { group:"social-media", subcategory:"TikTok", category:"Social Media", format:FORMAT.story, industry:"Multi-platform" },
  { group:"social-media", subcategory:"YouTube Thumbnails", category:"YouTube", format:{width:1280,height:720,orientation:"landscape",pageSize:"1280 x 720"}, industry:"Creator" },
  { group:"print", subcategory:"Labels", category:"Print", format:{width:384,height:240,orientation:"landscape",pageSize:"4 x 2.5 in"}, industry:"Retail" },
  { group:"print", subcategory:"Stickers", category:"Print", format:{width:480,height:480,orientation:"square",pageSize:"5 x 5 in"}, industry:"Retail" },
  { group:"print", subcategory:"Invitations", category:"Events", format:{width:480,height:672,orientation:"portrait",pageSize:"5 x 7 in",pages:2}, industry:"Events" },
  { group:"print", subcategory:"Greeting Cards", category:"Personal", format:{width:960,height:672,orientation:"landscape",pageSize:"10 x 7 in",pages:2}, industry:"Personal" },
  { group:"print", subcategory:"Calendars", category:"Print", format:{...FORMAT.landscapeLetter,pages:12}, industry:"Office" },
  { group:"print", subcategory:"Certificates", category:"Print", format:FORMAT.landscapeLetter, industry:"Education" },
  { group:"print", subcategory:"Tickets", category:"Events", format:{width:768,height:256,orientation:"landscape",pageSize:"8 x 2.67 in"}, industry:"Events" },
  { group:"print", subcategory:"Book Covers", category:"Print", format:{width:1600,height:2560,orientation:"portrait",pageSize:"1600 x 2560"}, industry:"Publishing" },
  { group:"office", subcategory:"Resumes", category:"Business", format:FORMAT.letter, industry:"Career" },
  { group:"office", subcategory:"Newsletters", category:"Business", format:{...FORMAT.letter,pages:4}, industry:"Corporate" },
  { group:"office", subcategory:"Forms", category:"Business", format:FORMAT.letter, industry:"Office" },
  { group:"office", subcategory:"Checklists", category:"Business", format:FORMAT.letter, industry:"Office" },
  { group:"office", subcategory:"Planners", category:"Personal", format:{...FORMAT.letter,pages:4}, industry:"Productivity" },
  { group:"office", subcategory:"Schedules", category:"Business", format:FORMAT.landscapeLetter, industry:"Office" },
] as const;

const PALETTES = [
  { name:"Midnight Cyan", bg:"#071A2B", surface:"#F4FBFF", accent:"#00A7C4", ink:"#0B2239", soft:"#D9F5FA" },
  { name:"Royal Plum", bg:"#2B123C", surface:"#FFF8FF", accent:"#A855F7", ink:"#2A1235", soft:"#F3E8FF" },
  { name:"Forest Gold", bg:"#14281D", surface:"#FFFCF4", accent:"#D4A017", ink:"#1C2B21", soft:"#F7EDC9" },
  { name:"Coral Studio", bg:"#3D1718", surface:"#FFF8F7", accent:"#F25F5C", ink:"#3A1718", soft:"#FFE0DE" },
  { name:"Indigo Signal", bg:"#151A45", surface:"#F8F9FF", accent:"#6366F1", ink:"#171B3C", soft:"#E0E7FF" },
  { name:"Emerald Ledger", bg:"#092C23", surface:"#F6FFFB", accent:"#10B981", ink:"#123128", soft:"#D1FAE5" },
  { name:"Ruby Editorial", bg:"#3B0A18", surface:"#FFF8FA", accent:"#E11D48", ink:"#3A101B", soft:"#FFE4E6" },
  { name:"Amber Workshop", bg:"#3A2205", surface:"#FFFBF2", accent:"#F59E0B", ink:"#332108", soft:"#FEF3C7" },
  { name:"Ice Blue", bg:"#0B2840", surface:"#F5FBFF", accent:"#38BDF8", ink:"#123149", soft:"#E0F2FE" },
  { name:"Graphite Red", bg:"#1C1C1F", surface:"#FAFAFA", accent:"#EF4444", ink:"#18181B", soft:"#FEE2E2" },
  { name:"Violet Future", bg:"#241044", surface:"#FCF9FF", accent:"#8B5CF6", ink:"#281541", soft:"#EDE9FE" },
  { name:"Olive Natural", bg:"#283016", surface:"#FBFDF5", accent:"#84A22B", ink:"#283019", soft:"#EEF3D5" },
  { name:"Azure Commerce", bg:"#082F49", surface:"#F7FCFF", accent:"#0284C7", ink:"#0C324A", soft:"#E0F2FE" },
] as const;

const safe = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const el = (id:string,name:string,type:PublisherElement["type"],x:number,y:number,width:number,height:number,zIndex:number,extra:Partial<PublisherElement>={}):PublisherElement => ({id,name,type,x,y,width,height,rotation:0,zIndex,opacity:1,...extra});

function contentFor(subcategory:string, pageIndex:number) {
  const common = { title:"BUILD A STRONGER BRAND", subtitle:"A polished, editable design created for modern organizations.", cta:"LEARN MORE" };
  if (subcategory === "Business Cards") return { title:"ALEX MORGAN", subtitle:"Creative Director\n+1 (555) 123-4567\nhello@example.com", cta:"YOUR COMPANY" };
  if (subcategory === "Invoices") return { title:"INVOICE", subtitle:"Invoice #1001  ·  Due August 30, 2026", cta:"TOTAL  $1,250.00" };
  if (subcategory === "Quotes") return { title:"SERVICE QUOTE", subtitle:"Prepared for Client Name\nValid for 30 days", cta:"ESTIMATE  $2,400.00" };
  if (subcategory === "Receipts") return { title:"PAYMENT RECEIPT", subtitle:"Thank you for your business.\nReceipt #R-2026-001", cta:"PAID  $250.00" };
  if (subcategory === "Certificates") return { title:"CERTIFICATE OF ACHIEVEMENT", subtitle:"Proudly presented to\nALEX MORGAN\nfor outstanding excellence", cta:"AWARDED 2026" };
  if (subcategory === "Menus") return { title:"SIGNATURE MENU", subtitle:"STARTERS  ·  MAINS  ·  DESSERTS\nSeasonal ingredients. Thoughtful preparation.", cta:"CHEF'S SPECIAL" };
  if (subcategory === "Resumes") return { title:"ALEX MORGAN", subtitle:"CREATIVE DIRECTOR\nProfile  ·  Experience  ·  Education  ·  Skills", cta:"PORTFOLIO" };
  if (subcategory === "Calendars") return { title:`MONTH ${pageIndex + 1}`, subtitle:"MON  TUE  WED  THU  FRI  SAT  SUN\nPlan important dates, goals, and appointments.", cta:"2026" };
  if (subcategory === "Checklists") return { title:"PROJECT CHECKLIST", subtitle:"□ Define goals\n□ Assign responsibilities\n□ Review milestones\n□ Approve final delivery", cta:"STAY ON TRACK" };
  if (subcategory === "Schedules") return { title:"WEEKLY SCHEDULE", subtitle:"MONDAY  ·  TUESDAY  ·  WEDNESDAY  ·  THURSDAY  ·  FRIDAY", cta:"PLAN YOUR WEEK" };
  if (subcategory.includes("Instagram") || subcategory.includes("Facebook") || subcategory.includes("LinkedIn") || subcategory === "X (Twitter)" || subcategory === "Pinterest" || subcategory === "TikTok") return { title:"YOUR NEXT BIG IDEA", subtitle:"Share a clear message with bold typography and brand-ready graphics.", cta:"FOLLOW · SAVE · SHARE" };
  if (subcategory === "YouTube Thumbnails") return { title:"5 IDEAS THAT WORK", subtitle:"A bold thumbnail built for high-impact visual storytelling.", cta:"WATCH NOW" };
  return common;
}

function createPage(spec:SubcategorySpec, variant:number, pageIndex:number, id:string):PublisherPage {
  const p = PALETTES[variant % PALETTES.length];
  const layout = (variant + 3) % 6;
  const { width:W, height:H } = spec.format;
  const copy = contentFor(spec.subcategory, pageIndex);
  const margin = Math.max(20, Math.round(Math.min(W,H) * 0.055));
  const headerH = Math.max(24, H * 0.075);
  const footerH = Math.max(26, H * 0.08);
  const titleSize = Math.max(18, Math.min(64, W / (spec.format.orientation === "portrait" ? 13 : 18)));
  const elements:PublisherElement[] = [
    el(`${id}-background`,"Background","rectangle",0,0,W,H,1,{fillColor:(layout===1||layout===4)?p.surface:p.bg,borderWidth:0,locked:true}),
    el(`${id}-accent-bar`,"Accent Bar","rectangle",0,0,(layout===2||layout===5)?Math.max(18,W*.025):W,(layout===2||layout===5)?H:headerH,2,{fillColor:p.accent,borderWidth:0}),
    el(`${id}-brand-mark`,"Brand Mark","circle",margin,margin,Math.max(28,Math.min(W,H)*.07),Math.max(28,Math.min(W,H)*.07),3,{fillColor:p.accent,borderWidth:0}),
    el(`${id}-brand-name`,"Business Name","text",margin+Math.max(38,Math.min(W,H)*.085),margin,W-margin*2,42,4,{text:"YOUR COMPANY",fontFamily:"Arial",fontSize:Math.max(11,titleSize*.34),fontWeight:"900",letterSpacing:1.4,textColor:(layout===1||layout===4)?p.ink:p.surface}),
    el(`${id}-title`,"Headline","text",margin,H*.23,W-margin*2,H*.2,5,{text:copy.title,fontFamily:"Arial",fontSize:titleSize,fontWeight:"900",letterSpacing:(layout===1||layout===4)?.2:1.1,textColor:(layout===1||layout===4)?p.ink:p.surface,textAlign:spec.subcategory==="Certificates"?"center":"left",verticalJustification:"center"}),
    el(`${id}-rule`,"Divider","rectangle",margin,H*.46,Math.min(W*.28,300),Math.max(5,H*.008),6,{fillColor:p.accent,borderWidth:0,borderRadius:4}),
    el(`${id}-subtitle`,"Editable Content","text",margin,H*.5,W-margin*2,H*.25,7,{text:copy.subtitle,fontFamily:"Arial",fontSize:Math.max(10,Math.min(25,W/42)),fontWeight:"500",lineHeight:1.35,textColor:(layout===1||layout===4)?p.ink:p.surface,textAlign:spec.subcategory==="Certificates"?"center":"left"}),
    el(`${id}-cta-bg`,"Call To Action","rectangle",margin,H-footerH-margin,Math.min(W-margin*2,Math.max(150,W*.32)),footerH,8,{fillColor:p.accent,borderWidth:0,borderRadius:Math.min(14,footerH*.2)}),
    el(`${id}-cta`,"Call To Action Text","text",margin+10,H-footerH-margin+footerH*.24,Math.min(W-margin*2-20,Math.max(130,W*.32-20)),footerH*.55,9,{text:copy.cta,fontFamily:"Arial",fontSize:Math.max(9,Math.min(18,W/60)),fontWeight:"900",letterSpacing:.7,textColor:"#FFFFFF",textAlign:"center"}),
    el(`${id}-contact`,"Contact Details","text",W*.52,H-footerH-margin+footerH*.22,W*.43-margin,footerH*.55,10,{text:"hello@example.com  ·  www.example.com",fontFamily:"Arial",fontSize:Math.max(8,Math.min(14,W/80)),fontWeight:"700",textColor:(layout===1||layout===4)?p.ink:p.surface,textAlign:"right"}),
  ];
  if (["Invoices","Quotes","Receipts"].includes(spec.subcategory)) elements.push(el(`${id}-table`,"Financial Table","table",margin,H*.38,W-margin*2,H*.34,11,{fillColor:p.surface,borderColor:p.accent,borderWidth:1,tableCells:[["DESCRIPTION","QTY","RATE","AMOUNT"],["Professional service","1","$1,000","$1,000"],["Additional service","1","$250","$250"]]}));
  if (spec.subcategory === "Brochures") elements.push(el(`${id}-fold-a`,"Fold Guide","line",W/3,10,1,H-20,12,{borderColor:p.accent,borderWidth:1,opacity:.3}),el(`${id}-fold-b`,"Fold Guide","line",W*2/3,10,1,H-20,13,{borderColor:p.accent,borderWidth:1,opacity:.3}));
  if (["Forms","Planners"].includes(spec.subcategory)) for(let row=0;row<5;row++) elements.push(el(`${id}-field-${row}`,`Editable Field ${row+1}`,"rectangle",margin,H*.38+row*H*.085,W-margin*2,H*.055,12+row,{fillColor:p.soft,borderColor:p.accent,borderWidth:1,borderRadius:6}));
  if (layout === 3) elements.push(el(`${id}-decor-circle`,"Decorative Circle","circle",W*.72,H*.08,Math.min(W,H)*.22,Math.min(W,H)*.22,2,{fillColor:p.accent,opacity:.18,borderWidth:0}));
  if (layout === 4) elements.push(el(`${id}-side-panel`,"Side Panel","rectangle",0,0,W*.18,H,2,{fillColor:p.accent,opacity:.92,borderWidth:0}));
  if (layout === 5) elements.push(el(`${id}-corner-block`,"Corner Block","rectangle",W*.76,H*.72,W*.24,H*.28,2,{fillColor:p.accent,opacity:.28,borderWidth:0,rotation:-8}));
  return { id, name: spec.format.pages && spec.format.pages>1 ? `Page ${pageIndex+1}` : spec.subcategory, width:W, height:H, orientation:spec.format.orientation==="landscape"?"landscape":"portrait", sizeKey:"custom", backgroundColor:(layout===1||layout===4)?p.surface:p.bg, margin, bleed:DEFAULT_BLEED, elements };
}

function createTemplate(spec:SubcategorySpec, variant:number):ProfessionalTemplate {
  const slug=safe(spec.subcategory); const id=`phase2519-${slug}-${variant+1}`; const palette=PALETTES[variant];
  const pageCount=spec.format.pages??1;
  return {
    metadata:{ id, name:`${palette.name} ${spec.subcategory.replace(/s$/,"")}`, category:spec.category, subcategory:spec.subcategory, industry:spec.industry, description:`A professional ${spec.subcategory.toLowerCase()} design with fully editable text, shapes, colors, tables, and layout. No person photography is included.`, tags:[spec.group,slug,"phase 25.19","editable","professional","no people",palette.name.toLowerCase()], pageSize:spec.format.pageSize, orientation:spec.format.orientation, previewColor:palette.accent, author:"Yaposan", version:"25.19", editable:true, featured:variant===0, trending:variant===2, access:variant===2?"premium":"free", createdAt:NOW, updatedAt:NOW, style:variant===0?"corporate":variant===1?"luxury":"creative", palette:[palette.bg,palette.surface,palette.accent,palette.ink], fonts:["Arial"], qualityScore:94+variant },
    pages:Array.from({length:pageCount},(_,pageIndex)=>createPage(spec,variant,pageIndex,`${id}-page-${pageIndex+1}`)),
  };
}

export const PHASE2519_TEMPLATES:ProfessionalTemplate[] = SPECS.flatMap(spec=>PALETTES.map((_,variant)=>createTemplate(spec,variant)));
export const PHASE2519_TEMPLATE_COUNT = PHASE2519_TEMPLATES.length;
export const PHASE2519_SUBCATEGORY_COUNT = SPECS.length;
export const PHASE2519_COUNTS_BY_SUBCATEGORY = Object.fromEntries(SPECS.map(spec=>[spec.subcategory,PHASE2519_TEMPLATES.filter(template=>template.metadata.subcategory===spec.subcategory).length]));

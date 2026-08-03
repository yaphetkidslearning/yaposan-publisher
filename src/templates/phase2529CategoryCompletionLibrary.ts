import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, ProfessionalTemplateCategory, TemplateOrientation } from "./types";

const NOW = "2026-07-29T00:00:00.000Z";
const TARGET_PER_SUBCATEGORY = 20;

type Format = { width: number; height: number; orientation: TemplateOrientation; pageSize: string };
type CoverageSpec = { category: ProfessionalTemplateCategory; subcategory: string; industry: string; format: Format };

const F = {
  card: { width: 336, height: 192, orientation: "landscape", pageSize: "Business Card" },
  letter: { width: 816, height: 1056, orientation: "portrait", pageSize: "US Letter" },
  landscapeLetter: { width: 1056, height: 816, orientation: "landscape", pageSize: "US Letter Landscape" },
  square: { width: 1080, height: 1080, orientation: "square", pageSize: "1080 x 1080" },
  story: { width: 1080, height: 1920, orientation: "portrait", pageSize: "1080 x 1920" },
  cover: { width: 1640, height: 624, orientation: "landscape", pageSize: "1640 x 624" },
  banner: { width: 1200, height: 400, orientation: "landscape", pageSize: "1200 x 400" },
} as const satisfies Record<string, Format>;

const SPECS: readonly CoverageSpec[] = [
  { category:"Business", subcategory:"Business Cards", industry:"Corporate", format:F.card },
  { category:"Business", subcategory:"Letterheads", industry:"Corporate", format:F.letter },
  { category:"Business", subcategory:"Invoices", industry:"Finance", format:F.letter },
  { category:"Business", subcategory:"Quotes", industry:"Sales", format:F.letter },
  { category:"Business", subcategory:"Receipts", industry:"Retail", format:F.letter },
  { category:"Business", subcategory:"Envelopes", industry:"Corporate", format:{width:912,height:396,orientation:"landscape",pageSize:"DL Envelope"} },
  { category:"Business", subcategory:"Reports", industry:"Corporate", format:F.letter },
  { category:"Business", subcategory:"Proposals", industry:"Consulting", format:F.letter },
  { category:"Marketing", subcategory:"Flyers", industry:"Marketing", format:F.letter },
  { category:"Marketing", subcategory:"Posters", industry:"Events", format:{width:1152,height:1728,orientation:"portrait",pageSize:"12 x 18 in"} },
  { category:"Marketing", subcategory:"Brochures", industry:"Corporate", format:F.landscapeLetter },
  { category:"Marketing", subcategory:"Banners", industry:"Marketing", format:F.banner },
  { category:"Marketing", subcategory:"Coupons", industry:"Retail", format:{width:672,height:288,orientation:"landscape",pageSize:"7 x 3 in"} },
  { category:"Marketing", subcategory:"Catalogs", industry:"Retail", format:F.letter },
  { category:"Marketing", subcategory:"Rack Cards", industry:"Travel", format:{width:384,height:864,orientation:"portrait",pageSize:"4 x 9 in"} },
  { category:"Restaurant", subcategory:"Menus", industry:"Restaurant", format:F.letter },
  { category:"Social Media", subcategory:"Instagram Posts", industry:"Social Media", format:F.square },
  { category:"Social Media", subcategory:"Instagram Stories", industry:"Social Media", format:F.story },
  { category:"Social Media", subcategory:"Facebook Posts", industry:"Social Media", format:{width:1200,height:630,orientation:"landscape",pageSize:"1200 x 630"} },
  { category:"Social Media", subcategory:"Facebook Covers", industry:"Social Media", format:F.cover },
  { category:"Social Media", subcategory:"LinkedIn Posts", industry:"Corporate", format:F.square },
  { category:"Social Media", subcategory:"X (Twitter)", industry:"Social Media", format:{width:1600,height:900,orientation:"landscape",pageSize:"1600 x 900"} },
  { category:"Social Media", subcategory:"Pinterest", industry:"Social Media", format:{width:1000,height:1500,orientation:"portrait",pageSize:"1000 x 1500"} },
  { category:"Social Media", subcategory:"TikTok", industry:"Social Media", format:F.story },
  { category:"YouTube", subcategory:"YouTube Thumbnails", industry:"Creator", format:{width:1280,height:720,orientation:"landscape",pageSize:"1280 x 720"} },
  { category:"Print", subcategory:"Labels", industry:"Retail", format:{width:384,height:240,orientation:"landscape",pageSize:"4 x 2.5 in"} },
  { category:"Print", subcategory:"Stickers", industry:"Retail", format:{width:480,height:480,orientation:"square",pageSize:"5 x 5 in"} },
  { category:"Events", subcategory:"Invitations", industry:"Events", format:{width:480,height:672,orientation:"portrait",pageSize:"5 x 7 in"} },
  { category:"Personal", subcategory:"Greeting Cards", industry:"Personal", format:{width:960,height:672,orientation:"landscape",pageSize:"10 x 7 in"} },
  { category:"Print", subcategory:"Calendars", industry:"Office", format:F.landscapeLetter },
  { category:"Print", subcategory:"Certificates", industry:"Education", format:F.landscapeLetter },
  { category:"Events", subcategory:"Tickets", industry:"Events", format:{width:768,height:256,orientation:"landscape",pageSize:"8 x 2.67 in"} },
  { category:"Print", subcategory:"Book Covers", industry:"Publishing", format:{width:1600,height:2560,orientation:"portrait",pageSize:"1600 x 2560"} },
  { category:"Business", subcategory:"Resumes", industry:"Career", format:F.letter },
  { category:"Business", subcategory:"Newsletters", industry:"Corporate", format:F.letter },
  { category:"Business", subcategory:"Forms", industry:"Office", format:F.letter },
  { category:"Business", subcategory:"Checklists", industry:"Office", format:F.letter },
  { category:"Personal", subcategory:"Planners", industry:"Productivity", format:F.letter },
  { category:"Business", subcategory:"Schedules", industry:"Office", format:F.landscapeLetter },
] as const;

const PALETTES = [
  ["#0f172a", "#0ea5e9", "#e0f2fe", "#ffffff"], ["#171717", "#d4a72c", "#f8f1dc", "#fffdf7"],
  ["#134e4a", "#14b8a6", "#ccfbf1", "#f7fffc"], ["#4c1d95", "#a855f7", "#f3e8ff", "#ffffff"],
  ["#7f1d1d", "#ef4444", "#fee2e2", "#fffafa"], ["#1e3a8a", "#3b82f6", "#dbeafe", "#ffffff"],
  ["#3f3f46", "#f97316", "#ffedd5", "#ffffff"], ["#14532d", "#84cc16", "#ecfccb", "#ffffff"],
  ["#831843", "#ec4899", "#fce7f3", "#ffffff"], ["#082f49", "#06b6d4", "#cffafe", "#ffffff"],
] as const;

const safe = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const el = (id:string,name:string,type:PublisherElement["type"],x:number,y:number,width:number,height:number,zIndex:number,extra:Partial<PublisherElement>={}):PublisherElement => ({id,name,type,x,y,width,height,rotation:0,zIndex,opacity:1,...extra});
const rect = (id:string,x:number,y:number,width:number,height:number,fillColor:string,extra:Partial<PublisherElement>={}) => el(id,id,"rectangle",x,y,width,height,5,{fillColor,borderWidth:0,...extra});
const circle = (id:string,x:number,y:number,width:number,height:number,fillColor:string,extra:Partial<PublisherElement>={}) => el(id,id,"circle",x,y,width,height,7,{fillColor,borderWidth:0,...extra});
const text = (id:string,value:string,x:number,y:number,width:number,height:number,size:number,color:string,weight:PublisherElement["fontWeight"]="700",extra:Partial<PublisherElement>={}) => el(id,value.slice(0,30),"text",x,y,width,height,20,{text:value,fontFamily:"Inter",fontSize:size,textColor:color,fontWeight:weight,lineHeight:size*1.22,...extra});

function copyFor(subcategory:string, variant:number) {
  const n = String(variant + 1).padStart(2, "0");
  if (subcategory === "Business Cards") return { title:"ALEX MORGAN", body:"CREATIVE DIRECTOR\nhello@example.com\n+1 555 123 4567", cta:`IDENTITY ${n}` };
  if (subcategory === "Letterheads") return { title:"YOUR COMPANY", body:"Professional correspondence designed for clear, credible communication.", cta:"BALTIMORE · MARYLAND" };
  if (subcategory === "Invoices") return { title:"INVOICE", body:`Invoice #25${n}\nProfessional Services\nSubtotal $1,250.00`, cta:"TOTAL $1,250.00" };
  if (subcategory === "Quotes") return { title:"SERVICE QUOTE", body:"Prepared for Client Name\nValid for 30 days\nScope · Timeline · Investment", cta:"ESTIMATE $2,400" };
  if (subcategory === "Receipts") return { title:"PAYMENT RECEIPT", body:"Receipt number · Date · Payment method\nThank you for your business.", cta:"PAID IN FULL" };
  if (subcategory === "Envelopes") return { title:"YOUR COMPANY", body:"123 Business Avenue\nBaltimore, MD 21201", cta:"PROFESSIONAL MAIL" };
  if (subcategory === "Reports") return { title:"ANNUAL REPORT", body:"Performance · Impact · Strategy\nA clear review of progress and priorities.", cta:"2026 EDITION" };
  if (subcategory === "Proposals") return { title:"PROJECT PROPOSAL", body:"Prepared for Client Name\nStrategy · Deliverables · Timeline · Investment", cta:"LET'S BUILD TOGETHER" };
  if (subcategory === "Menus") return { title:"SIGNATURE MENU", body:"STARTERS · MAINS · DESSERTS\nSeasonal ingredients and thoughtful preparation.", cta:"CHEF'S SELECTION" };
  if (subcategory === "Certificates") return { title:"CERTIFICATE OF ACHIEVEMENT", body:"Proudly presented to\nALEX MORGAN\nfor outstanding excellence", cta:"AWARDED 2026" };
  if (subcategory === "Resumes") return { title:"ALEX MORGAN", body:"CREATIVE DIRECTOR\nProfile · Experience · Education · Skills", cta:"PORTFOLIO" };
  if (subcategory === "Checklists") return { title:"PROJECT CHECKLIST", body:"□ Define goals\n□ Assign responsibilities\n□ Review milestones\n□ Approve delivery", cta:"STAY ON TRACK" };
  if (subcategory === "Schedules") return { title:"WEEKLY SCHEDULE", body:"MON · TUE · WED · THU · FRI\nPlan meetings, priorities, and deadlines.", cta:"PLAN YOUR WEEK" };
  if (subcategory === "Forms") return { title:"CLIENT INTAKE FORM", body:"Contact information\nProject requirements\nGoals and timeline\nApproval", cta:"COMPLETE ALL FIELDS" };
  if (subcategory === "Planners") return { title:"PRODUCTIVITY PLANNER", body:"Top priorities\nAppointments\nNotes\nDaily reflection", cta:"FOCUS · PLAN · ACHIEVE" };
  if (subcategory === "Calendars") return { title:"MONTHLY CALENDAR", body:"MON  TUE  WED  THU  FRI  SAT  SUN\nPlan important dates and goals.", cta:"2026" };
  if (subcategory === "YouTube Thumbnails") return { title:"5 IDEAS THAT WORK", body:"Clear visual hierarchy built for high-impact content.", cta:"WATCH NOW" };
  if (["Instagram Posts","Instagram Stories","Facebook Posts","Facebook Covers","LinkedIn Posts","X (Twitter)","Pinterest","TikTok"].includes(subcategory)) return { title:"YOUR NEXT BIG IDEA", body:"Bold, platform-ready content with editable brand messaging.", cta:"FOLLOW · SAVE · SHARE" };
  return { title:subcategory.toUpperCase(), body:"A polished, fully editable design built for professional publishing and clear communication.", cta:`COLLECTION ${n}` };
}

function imageFrame(id:string,x:number,y:number,width:number,height:number,fillColor:string,label:string,accent:string): PublisherElement[] {
  return [
    rect(`${id}-frame`,x,y,width,height,fillColor,{borderRadius:18}),
    rect(`${id}-accent`,x,y,width,Math.max(5,height*.035),accent,{borderRadius:18}),
    text(`${id}-label`,label.toUpperCase(),x+18,y+height*.43,width-36,32,Math.max(10,Math.min(18,width/18)),accent,"900",{textAlign:"center",letterSpacing:2}),
  ];
}

function detailRow(id:string,label:string,value:string,x:number,y:number,width:number,color:string,accent:string,size:number): PublisherElement[] {
  return [
    text(`${id}-label`,label.toUpperCase(),x,y,width*.34,24,size*.72,accent,"900",{letterSpacing:1.2}),
    text(`${id}-value`,value,x+width*.36,y,width*.64,28,size,color,"700"),
    rect(`${id}-rule`,x,y+34,width,1,"#dbe3ea"),
  ];
}

function createPage(spec:CoverageSpec, variant:number, id:string): PublisherPage {
  const { width:W, height:H, orientation } = spec.format;
  const [ink, accent, soft, paper] = PALETTES[(variant + SPECS.indexOf(spec)) % PALETTES.length];
  const copy = copyFor(spec.subcategory, variant);
  const margin = Math.max(18, Math.round(Math.min(W,H) * 0.055));
  const titleSize = Math.max(18, Math.min(68, W / (orientation === "portrait" ? 12 : 17)));
  const mode = variant % 10;
  const elements: PublisherElement[] = [rect(`${id}-bg`,0,0,W,H,paper,{locked:true})];
  const sub = spec.subcategory;

  if (["Invoices","Quotes","Receipts"].includes(sub)) {
    elements.push(rect(`${id}-header`,0,0,W,H*.18,ink),text(`${id}-brand`,"NORTHSTAR STUDIO",margin,H*.055,W*.42,32,Math.max(12,titleSize*.28),paper,"900",{letterSpacing:2}),text(`${id}-doc`,copy.title,W*.58,H*.05,W*.32,50,titleSize*.72,paper,"900",{textAlign:"right"}));
    elements.push(...detailRow(`${id}-r1`,"Bill to","Alex Morgan",margin,H*.25,W*.42,ink,accent,Math.max(11,titleSize*.28)));
    elements.push(...detailRow(`${id}-r2`,"Document",`#25${String(variant+1).padStart(2,"0")}`,margin,H*.34,W*.42,ink,accent,Math.max(11,titleSize*.28)));
    elements.push(...detailRow(`${id}-r3`,"Issued","July 29, 2026",margin,H*.43,W*.42,ink,accent,Math.max(11,titleSize*.28)));
    const tx=margin, tw=W-margin*2, rowY=H*.56;
    elements.push(rect(`${id}-table-head`,tx,rowY,tw,H*.055,accent),text(`${id}-th1`,"DESCRIPTION",tx+16,rowY+12,tw*.5,25,Math.max(10,titleSize*.22),paper,"900"),text(`${id}-th2`,"QTY",tx+tw*.58,rowY+12,tw*.12,25,Math.max(10,titleSize*.22),paper,"900"),text(`${id}-th3`,"AMOUNT",tx+tw*.74,rowY+12,tw*.22,25,Math.max(10,titleSize*.22),paper,"900",{textAlign:"right"}));
    [0,1,2].forEach((r)=>{ const y=rowY+H*.065+r*H*.075; elements.push(text(`${id}-item-${r}`,['Brand strategy','Design system','Production support'][r],tx+16,y,tw*.5,28,Math.max(10,titleSize*.24),ink,"700"),text(`${id}-qty-${r}`,String(r+1),tx+tw*.6,y,tw*.1,28,Math.max(10,titleSize*.24),ink,"700"),text(`${id}-amt-${r}`,['$750.00','$300.00','$200.00'][r],tx+tw*.76,y,tw*.2,28,Math.max(10,titleSize*.24),ink,"700",{textAlign:"right"}),rect(`${id}-line-${r}`,tx,y+34,tw,1,"#dbe3ea")); });
    elements.push(rect(`${id}-totalbox`,W*.58,H*.83,W*.32,H*.09,soft,{borderRadius:12}),text(`${id}-total-label`,"TOTAL",W*.61,H*.855,W*.1,26,Math.max(10,titleSize*.23),accent,"900"),text(`${id}-total`,"$1,250.00",W*.7,H*.846,W*.16,34,Math.max(14,titleSize*.36),ink,"900",{textAlign:"right"}));
  } else if (["Letterheads","Reports","Proposals","Newsletters","Forms","Checklists","Resumes"].includes(sub)) {
    elements.push(rect(`${id}-mast`,0,0,W,H*.12,ink),text(`${id}-brand`,"NORTHSTAR / STUDIO",margin,H*.04,W*.48,30,Math.max(11,titleSize*.24),paper,"900",{letterSpacing:2.4}),text(`${id}-folio`,String(variant+1).padStart(2,"0"),W-margin-60,H*.04,60,30,Math.max(11,titleSize*.24),accent,"900",{textAlign:"right"}));
    elements.push(text(`${id}-title`,copy.title,margin,H*.18,W-margin*2,H*.12,titleSize,ink,"900"),rect(`${id}-rule`,margin,H*.33,W*.16,6,accent));
    elements.push(...imageFrame(`${id}-photo`,margin,H*.39,W*.42,H*.28,soft,"Editorial image",accent));
    elements.push(text(`${id}-intro`,copy.body,W*.52,H*.39,W*.39,H*.18,Math.max(12,titleSize*.31),ink,"700",{lineHeight:Math.max(18,titleSize*.48)}));
    elements.push(text(`${id}-body1`,"A clear hierarchy, measured spacing, and editorial structure create a document that is easy to scan and ready to customize.",margin,H*.73,W*.42,H*.13,Math.max(10,titleSize*.25),ink,"500",{lineHeight:Math.max(16,titleSize*.39)}));
    elements.push(text(`${id}-body2`,"Use this area for supporting details, milestones, contact information, or a concise call to action.",W*.52,H*.73,W*.39,H*.13,Math.max(10,titleSize*.25),ink,"500",{lineHeight:Math.max(16,titleSize*.39)}),text(`${id}-cta`,copy.cta,margin,H*.91,W-margin*2,24,Math.max(10,titleSize*.21),accent,"900",{letterSpacing:2}));
  } else if (["Flyers","Posters","Rack Cards","Book Covers","Invitations","Greeting Cards"].includes(sub)) {
    elements.push(...imageFrame(`${id}-hero`,0,0,W,H*.56,ink,"Hero photography",accent));
    elements.push(rect(`${id}-overlay`,0,H*.38,W,H*.18,ink,{opacity:.88}),text(`${id}-kicker`,spec.category.toUpperCase(),margin,H*.405,W-margin*2,26,Math.max(10,titleSize*.2),accent,"900",{letterSpacing:3}),text(`${id}-title`,copy.title,margin,H*.455,W-margin*2,H*.13,titleSize,paper,"900"));
    elements.push(text(`${id}-body`,copy.body,margin,H*.64,W-margin*2,H*.13,Math.max(11,titleSize*.3),ink,"600",{lineHeight:Math.max(18,titleSize*.44)}),rect(`${id}-cta-bg`,margin,H*.83,W*.42,H*.075,accent,{borderRadius:14}),text(`${id}-cta`,copy.cta,margin+14,H*.85,W*.42-28,28,Math.max(10,titleSize*.22),paper,"900",{textAlign:"center",letterSpacing:1.6}),text(`${id}-meta`,"DATE  /  LOCATION  /  DETAILS",W*.55,H*.855,W*.34,28,Math.max(9,titleSize*.19),ink,"800",{textAlign:"right",letterSpacing:1.4}));
  } else if (["Brochures","Catalogs","Menus","Calendars","Schedules","Planners"].includes(sub)) {
    const cols=3, gap=Math.max(10,W*.018), col=(W-margin*2-gap*(cols-1))/cols;
    elements.push(text(`${id}-brand`,"THE PROFESSIONAL COLLECTION",margin,H*.055,W-margin*2,26,Math.max(10,titleSize*.2),accent,"900",{letterSpacing:2.5}),text(`${id}-title`,copy.title,margin,H*.12,W-margin*2,H*.12,titleSize,ink,"900"));
    for(let c=0;c<cols;c++){ const x=margin+c*(col+gap); elements.push(...imageFrame(`${id}-img-${c}`,x,H*.29,col,H*.25,c===1?ink:soft,["Feature","Detail","Collection"][c],accent)); elements.push(text(`${id}-head-${c}`,["Overview","Highlights","Details"][c],x,H*.59,col,28,Math.max(11,titleSize*.26),ink,"900"),text(`${id}-copy-${c}`,["A strong opening section with clear visual priority.","Balanced content blocks for services, products, or menu items.","A polished finish with space for pricing and contact details."][c],x,H*.64,col,H*.16,Math.max(9,titleSize*.21),ink,"500",{lineHeight:Math.max(14,titleSize*.33)})); }
    elements.push(rect(`${id}-footer`,0,H*.9,W,H*.1,ink),text(`${id}-cta`,copy.cta,margin,H*.935,W-margin*2,28,Math.max(10,titleSize*.21),paper,"900",{textAlign:"center",letterSpacing:2}));
  } else if (["Instagram Posts","Instagram Stories","Facebook Posts","Facebook Covers","LinkedIn Posts","X (Twitter)","Pinterest","TikTok","YouTube Thumbnails"].includes(sub)) {
    elements.push(...imageFrame(`${id}-social-hero`,0,0,W,H,ink,"Campaign visual",accent));
    elements.push(rect(`${id}-shade`,0,0,W,H,ink,{opacity:.42}),rect(`${id}-tag`,margin,margin,W*.28,H*.055,accent,{borderRadius:999}),text(`${id}-tagtext`,spec.subcategory.toUpperCase(),margin+12,margin+H*.014,W*.28-24,H*.03,Math.max(9,titleSize*.18),paper,"900",{textAlign:"center",letterSpacing:1.4}));
    elements.push(text(`${id}-title`,copy.title,margin,H*.22,W-margin*2,H*.26,titleSize*1.08,paper,"900",{lineHeight:titleSize*1.02}),text(`${id}-body`,copy.body,margin,H*.55,W*.7,H*.14,Math.max(12,titleSize*.29),paper,"600",{lineHeight:Math.max(18,titleSize*.42)}),rect(`${id}-cta-bg`,margin,H*.79,W*.36,H*.075,paper,{borderRadius:999}),text(`${id}-cta`,copy.cta,margin+14,H*.81,W*.36-28,28,Math.max(10,titleSize*.2),ink,"900",{textAlign:"center"}));
  } else if (["Business Cards","Envelopes","Labels","Stickers","Tickets","Coupons","Banners"].includes(sub)) {
    elements.push(rect(`${id}-panel`,0,0,W*.34,H,ink),text(`${id}-mono`,"NS",margin,H*.12,W*.2,60,titleSize*1.15,accent,"900"),text(`${id}-title`,copy.title,W*.42,H*.19,W*.48,H*.2,titleSize,ink,"900"),rect(`${id}-rule`,W*.42,H*.45,W*.18,5,accent),text(`${id}-body`,copy.body,W*.42,H*.53,W*.48,H*.22,Math.max(10,titleSize*.29),ink,"600",{lineHeight:Math.max(16,titleSize*.42)}),text(`${id}-cta`,copy.cta,W*.42,H*.83,W*.48,28,Math.max(9,titleSize*.2),accent,"900",{letterSpacing:2}));
  } else {
    elements.push(rect(`${id}-hero`,0,0,W,H*.38,ink),text(`${id}-title`,copy.title,margin,H*.12,W-margin*2,H*.17,titleSize,paper,"900"),text(`${id}-body`,copy.body,margin,H*.49,W-margin*2,H*.2,Math.max(11,titleSize*.31),ink,"600"),rect(`${id}-cta-bg`,margin,H*.8,W*.38,H*.08,accent,{borderRadius:14}),text(`${id}-cta`,copy.cta,margin+12,H*.825,W*.38-24,26,Math.max(10,titleSize*.21),paper,"900",{textAlign:"center"}));
  }

  if (mode % 2 === 1) {
    elements.push(rect(`${id}-variant-rule`,W-margin-8,H*.16,4,H*.68,accent,{opacity:.55}));
  }

  return { id:`${id}-page-1`, name:spec.subcategory, width:W, height:H, orientation, sizeKey:"custom", backgroundColor:paper, margin, bleed:DEFAULT_BLEED, elements };
}

function makeTemplate(spec:CoverageSpec, specIndex:number, variant:number): ProfessionalTemplate {
  const id = `p2529-${safe(spec.subcategory)}-${String(variant+1).padStart(2,"0")}`;
  const [ink, accent, soft, paper] = PALETTES[(specIndex + variant) % PALETTES.length];
  const names = ["Modern","Executive","Bold","Minimal","Editorial","Studio","Premium","Classic","Geometric","Elegant","Dynamic","Clean","Creative","Professional","Contemporary","Refined","Impact","Signature","Smart","Distinct"];
  return {
    metadata: {
      id,
      name:`${names[variant]} ${spec.subcategory} ${String(variant+1).padStart(2,"0")}`,
      category:spec.category,
      subcategory:spec.subcategory,
      industry:spec.industry,
      description:`A Phase 25.29 ${spec.subcategory} design with a distinct composition, editable typography, vector shapes, and production-ready spacing.`,
      tags:[spec.category,spec.subcategory,spec.industry,`layout-${variant+1}`,"phase 25.29","editable","category completion"],
      pageSize:spec.format.pageSize,
      orientation:spec.format.orientation,
      previewColor:accent,
      palette:[ink,accent,soft,paper],
      fonts:[variant%2===0?"Inter":"Poppins",variant%3===0?"Playfair Display":"Source Sans Pro"],
      author:"Yaposan Design Studio",
      version:"25.29",
      editable:true,
      featured:variant<3,
      trending:variant%5===0,
      access:variant%10===9?"premium":"free",
      createdAt:NOW,
      updatedAt:NOW,
      style:(["corporate","luxury","minimal","creative","editorial","bold","elegant"] as const)[(specIndex+variant)%7],
      qualityScore:97,
    },
    pages:[createPage(spec,variant,id)],
  };
}

export const PHASE2529_TEMPLATES: ProfessionalTemplate[] = SPECS.flatMap((spec,specIndex) => Array.from({length:TARGET_PER_SUBCATEGORY},(_,variant) => makeTemplate(spec,specIndex,variant)));
export const PHASE2529_TEMPLATE_COUNT = PHASE2529_TEMPLATES.length;
export const PHASE2529_TARGET_PER_SUBCATEGORY = TARGET_PER_SUBCATEGORY;
export const PHASE2529_COUNTS_BY_SUBCATEGORY = Object.fromEntries(SPECS.map(spec => [spec.subcategory,TARGET_PER_SUBCATEGORY]));
export const PHASE2529_SUBCATEGORY_COUNT = SPECS.length;

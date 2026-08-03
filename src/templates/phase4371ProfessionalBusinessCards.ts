import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate } from "./types";

const W = 336;
const H = 192;
const NOW = "2026-07-30T00:00:00.000Z";

const el = (id: string, name: string, type: PublisherElement["type"], x: number, y: number, width: number, height: number, zIndex: number, extra: Partial<PublisherElement> = {}): PublisherElement => ({
  id, name, type, x, y, width, height, rotation: 0, zIndex, opacity: 1, ...extra,
});
const rect = (id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) => el(id, id, "rectangle", x, y, width, height, 5, { fillColor, borderWidth: 0, ...extra });
const circle = (id: string, x: number, y: number, width: number, height: number, fillColor: string, extra: Partial<PublisherElement> = {}) => el(id, id, "ellipse", x, y, width, height, 6, { fillColor, borderWidth: 0, ...extra });
const text = (id: string, value: string, x: number, y: number, width: number, height: number, size: number, color: string, weight: PublisherElement["fontWeight"] = "700", extra: Partial<PublisherElement> = {}) => el(id, value.slice(0, 24), "text", x, y, width, height, 20, { text: value, fontSize: size, textColor: color, fontWeight: weight, lineHeight: size * 1.16, ...extra });
const image = (id: string, uri: string, x: number, y: number, width: number, height: number, extra: Partial<PublisherElement> = {}) => el(id, id, "image", x, y, width, height, 8, { imageUri: uri, imageFit: "cover", ...extra });
const page = (id: string, name: string, backgroundColor: string, elements: PublisherElement[]): PublisherPage => ({ id, name, width: W, height: H, orientation: "landscape", sizeKey: "business-card", backgroundColor, margin: 18, bleed: DEFAULT_BLEED, elements });

const PHOTOS = {
  architecture: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=90",
  property: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90",
  medical: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=90",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=90",
  construction: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=90",
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=90",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=90",
  fashion: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=90",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=90",
  finance: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=90",
};

type Spec = {
  id: string;
  name: string;
  industry: string;
  style: NonNullable<ProfessionalTemplate["metadata"]["style"]>;
  palette: [string, string, string, string];
  fonts: [string, string];
  layout: number;
  photo: string;
  description: string;
};

const specs: Spec[] = [
  { id:"modern-corporate", name:"Modern Corporate Business Card", industry:"Corporate", style:"corporate", palette:["#0f172a","#2563eb","#f8fafc","#94a3b8"], fonts:["Montserrat","Inter"], layout:1, photo:PHOTOS.architecture, description:"A precise corporate card with a disciplined left rail, strong name hierarchy, and architectural photo panel." },
  { id:"executive-black", name:"Executive Black Business Card", industry:"Executive", style:"luxury", palette:["#09090b","#d4af37","#fafafa","#3f3f46"], fonts:["Cormorant Garamond","Inter"], layout:2, photo:PHOTOS.architecture, description:"A premium black-and-gold executive card with refined serif typography and restrained geometric accents." },
  { id:"blue-professional", name:"Blue Professional Business Card", industry:"Consulting", style:"corporate", palette:["#0b3c5d","#00a6a6","#ffffff","#dbeafe"], fonts:["Avenir Next","Inter"], layout:3, photo:PHOTOS.architecture, description:"A polished consulting card built around a blue diagonal system and clear contact hierarchy." },
  { id:"minimal-white", name:"Minimal White Business Card", industry:"Professional Services", style:"minimal", palette:["#ffffff","#111827","#ef4444","#e5e7eb"], fonts:["Helvetica Neue","Inter"], layout:4, photo:PHOTOS.architecture, description:"A highly minimal white card with crisp alignment, fine rules, and a single energetic accent." },
  { id:"premium-navy", name:"Premium Navy Business Card", industry:"Leadership", style:"elegant", palette:["#102a43","#d9b44a","#f0f4f8","#486581"], fonts:["Libre Baskerville","Source Sans Pro"], layout:5, photo:PHOTOS.architecture, description:"A sophisticated navy leadership card with framed typography and a luminous gold monogram." },
  { id:"creative-agency", name:"Creative Agency Business Card", industry:"Creative Agency", style:"creative", palette:["#5b21b6","#f97316","#ffffff","#1f2937"], fonts:["Poppins","Inter"], layout:6, photo:PHOTOS.camera, description:"A bold agency card with layered color blocks, playful geometry, and confident creative typography." },
  { id:"photographer", name:"Photographer Business Card", industry:"Photography", style:"editorial", palette:["#18181b","#f5f5f4","#a3e635","#52525b"], fonts:["Bebas Neue","Inter"], layout:7, photo:PHOTOS.camera, description:"An editorial photography card with a cinematic image crop, oversized type, and compact contact strip." },
  { id:"designer-studio", name:"Designer Studio Business Card", industry:"Design", style:"creative", palette:["#f7fee7","#365314","#84cc16","#1a2e05"], fonts:["DM Sans","Space Grotesk"], layout:8, photo:PHOTOS.architecture, description:"A contemporary design-studio card using offset frames, modular spacing, and a fresh green palette." },
  { id:"modern-gradient", name:"Modern Gradient Business Card", industry:"Digital", style:"bold", palette:["#111827","#7c3aed","#ec4899","#ffffff"], fonts:["Sora","Inter"], layout:9, photo:PHOTOS.technology, description:"A high-energy digital card with layered gradient geometry, luminous accents, and concise contact details." },
  { id:"portfolio-card", name:"Portfolio Business Card", industry:"Portfolio", style:"editorial", palette:["#fff7ed","#9a3412","#1c1917","#fdba74"], fonts:["Playfair Display","Inter"], layout:10, photo:PHOTOS.architecture, description:"An editorial portfolio card with a warm gallery-inspired palette and asymmetric typography." },
  { id:"real-estate", name:"Luxury Real Estate Business Card", industry:"Real Estate", style:"luxury", palette:["#111827","#b08d57","#f8fafc","#d6d3d1"], fonts:["Playfair Display","Inter"], layout:11, photo:PHOTOS.property, description:"A luxury property card with a refined photo crop, gold divider, and strong advisor credentials." },
  { id:"law-firm", name:"Law Firm Business Card", industry:"Legal", style:"elegant", palette:["#1e293b","#c9a24c","#ffffff","#64748b"], fonts:["Cormorant Garamond","Source Sans Pro"], layout:12, photo:PHOTOS.architecture, description:"A dignified legal card with formal serif typography, balanced rules, and a shield-style monogram." },
  { id:"medical-clinic", name:"Medical Clinic Business Card", industry:"Healthcare", style:"minimal", palette:["#ffffff","#0f766e","#ccfbf1","#134e4a"], fonts:["Nunito Sans","Inter"], layout:13, photo:PHOTOS.medical, description:"A clean healthcare card with accessible typography, calm spacing, and a modern medical symbol." },
  { id:"restaurant", name:"Restaurant Business Card", industry:"Restaurant", style:"elegant", palette:["#2b2118","#c75b39","#fff7ed","#8b5e3c"], fonts:["Cormorant Garamond","Montserrat"], layout:14, photo:PHOTOS.restaurant, description:"A warm restaurant card with a refined dining image, menu-inspired typography, and reservation details." },
  { id:"construction", name:"Construction Business Card", industry:"Construction", style:"bold", palette:["#111827","#f59e0b","#ffffff","#4b5563"], fonts:["Oswald","Inter"], layout:15, photo:PHOTOS.construction, description:"A rugged construction card with strong industrial bands, bold typography, and project-ready contact information." },
  { id:"black-gold", name:"Black and Gold Luxury Business Card", industry:"Luxury Services", style:"luxury", palette:["#0a0a0a","#d4af37","#fffdf5","#262626"], fonts:["Cinzel","Montserrat"], layout:16, photo:PHOTOS.architecture, description:"A dramatic luxury card with fine gold framing, centered monogram, and premium high-contrast typography." },
  { id:"elegant-serif", name:"Elegant Serif Business Card", industry:"Boutique Consulting", style:"elegant", palette:["#f8f3e8","#6d4c7d","#c6a15b","#3f3348"], fonts:["Cormorant Garamond","Source Sans Pro"], layout:17, photo:PHOTOS.fashion, description:"A graceful boutique card featuring editorial serif typography, delicate linework, and muted jewel tones." },
  { id:"luxury-marble", name:"Luxury Marble Business Card", industry:"Interior Design", style:"luxury", palette:["#f5f5f4","#78716c","#b08d57","#292524"], fonts:["Didot","Inter"], layout:18, photo:PHOTOS.architecture, description:"An interior-design card with a marble-inspired photo field, refined neutral palette, and spacious composition." },
  { id:"premium-dark", name:"Premium Dark Business Card", industry:"Technology", style:"corporate", palette:["#020617","#22d3ee","#f8fafc","#164e63"], fonts:["Space Grotesk","Inter"], layout:19, photo:PHOTOS.technology, description:"A premium technology card with a dark interface aesthetic, cyan grid accents, and precise information blocks." },
  { id:"modern-geometric", name:"Modern Geometric Business Card", industry:"Architecture", style:"bold", palette:["#f8fafc","#0f172a","#ef4444","#cbd5e1"], fonts:["Montserrat","Inter"], layout:20, photo:PHOTOS.architecture, description:"An architecture card built from clean geometric forms, red structural accents, and a disciplined grid." },
];

function commonBack(prefix: string, spec: Spec, variant: number): PublisherElement[] {
  const [bg, accent, paper, muted] = spec.palette;
  const dark = bg !== "#ffffff" && bg !== "#f8fafc" && bg !== "#f7fee7" && bg !== "#fff7ed" && bg !== "#f8f3e8" && bg !== "#f5f5f4";
  const ink = dark ? paper : spec.palette[1];
  const elements: PublisherElement[] = [rect(`${prefix}-bg`,0,0,W,H,bg)];
  if (variant % 4 === 0) elements.push(rect(`${prefix}-photo`,236,0,100,H,muted), image(`${prefix}-image`,spec.photo,238,2,96,H-4,{borderRadius:2}));
  if (variant % 4 === 1) elements.push(circle(`${prefix}-orb`,245,46,70,70,accent,{opacity:.95}), text(`${prefix}-qr-label`,"SCAN",254,71,52,18,9,bg,"900",{textAlign:"center",letterSpacing:1.3}));
  if (variant % 4 === 2) elements.push(rect(`${prefix}-corner`,252,0,84,84,accent), rect(`${prefix}-corner2`,290,84,46,108,muted));
  if (variant % 4 === 3) elements.push(rect(`${prefix}-bar`,0,148,W,44,accent));
  elements.push(
    text(`${prefix}-contact-title`,"CONTACT",24,24,130,18,10,accent,"900",{letterSpacing:1.8,fontFamily:spec.fonts[1]}),
    text(`${prefix}-phone`,"+1 555 014 8200",24,53,190,19,12,ink,"700",{fontFamily:spec.fonts[1]}),
    text(`${prefix}-email`,"hello@yourcompany.com",24,80,205,19,11,ink,"600",{fontFamily:spec.fonts[1]}),
    text(`${prefix}-web`,"www.yourcompany.com",24,107,190,19,11,ink,"600",{fontFamily:spec.fonts[1]}),
    text(`${prefix}-address`,"1200 Market Street · Baltimore, MD",24,136,205,32,9,dark?paper:muted,"600",{fontFamily:spec.fonts[1],lineHeight:13})
  );
  if (variant % 4 !== 1) elements.push(rect(`${prefix}-qr`,264,108,48,48,paper,{borderColor:accent,borderWidth:2,borderRadius:4}), text(`${prefix}-qr-text`,"QR",274,122,28,18,10,accent,"900",{textAlign:"center"}));
  return elements;
}

function front(prefix: string, spec: Spec): PublisherElement[] {
  const [bg, accent, paper, muted] = spec.palette;
  const dark = bg !== "#ffffff" && bg !== "#f8fafc" && bg !== "#f7fee7" && bg !== "#fff7ed" && bg !== "#f8f3e8" && bg !== "#f5f5f4";
  const ink = dark ? paper : (bg === "#ffffff" ? "#111827" : spec.palette[1]);
  const sub = dark ? paper : muted;
  const base: PublisherElement[] = [rect(`${prefix}-bg`,0,0,W,H,bg)];
  switch (spec.layout) {
    case 1: base.push(rect(`${prefix}-rail`,0,0,18,H,accent), image(`${prefix}-photo`,spec.photo,238,0,98,H,{opacity:.9}), rect(`${prefix}-wash`,238,0,98,H,bg,{opacity:.22})); break;
    case 2: base.push(rect(`${prefix}-frame`,10,10,W-20,H-20,"transparent",{borderColor:accent,borderWidth:1}), circle(`${prefix}-seal`,258,44,52,52,accent)); break;
    case 3: base.push(rect(`${prefix}-diag`,236,-28,138,248,accent,{rotation:12}), rect(`${prefix}-mini`,221,0,8,H,paper,{opacity:.75})); break;
    case 4: base.push(rect(`${prefix}-rule`,24,34,286,1,muted), rect(`${prefix}-accent`,24,146,72,5,accent)); break;
    case 5: base.push(rect(`${prefix}-frame`,18,18,300,156,"transparent",{borderColor:accent,borderWidth:2}), circle(`${prefix}-mono`,252,58,54,54,accent)); break;
    case 6: base.push(rect(`${prefix}-block1`,0,0,118,H,accent), rect(`${prefix}-block2`,118,0,38,H,paper), circle(`${prefix}-dot`,278,28,32,32,accent)); break;
    case 7: base.push(image(`${prefix}-photo`,spec.photo,0,0,142,H), rect(`${prefix}-shade`,0,0,142,H,"#000000",{opacity:.22}), rect(`${prefix}-line`,142,0,4,H,accent)); break;
    case 8: base.push(rect(`${prefix}-offset`,210,20,98,152,accent), rect(`${prefix}-window`,228,38,98,116,paper), image(`${prefix}-photo`,spec.photo,232,42,90,108)); break;
    case 9: base.push(circle(`${prefix}-g1`,210,-38,150,150,accent,{opacity:.85}), circle(`${prefix}-g2`,248,72,120,120,spec.palette[2],{opacity:.55}), rect(`${prefix}-slash`,232,0,8,H,paper,{rotation:-9,opacity:.7})); break;
    case 10: base.push(image(`${prefix}-photo`,spec.photo,214,0,122,H), rect(`${prefix}-caption`,196,132,140,60,accent), rect(`${prefix}-top`,24,24,84,4,accent)); break;
    case 11: base.push(image(`${prefix}-photo`,spec.photo,0,0,152,H), rect(`${prefix}-overlay`,0,0,152,H,"#000000",{opacity:.25}), rect(`${prefix}-gold`,152,0,6,H,accent)); break;
    case 12: base.push(rect(`${prefix}-crest`,246,38,62,76,accent,{borderRadius:3}), text(`${prefix}-crest-text`,"LAW",255,64,44,24,14,bg,"900",{textAlign:"center",fontFamily:spec.fonts[0]}), rect(`${prefix}-rule`,24,128,190,1,accent)); break;
    case 13: base.push(circle(`${prefix}-medical`,248,38,62,62,accent), text(`${prefix}-plus`,"+",262,49,34,34,24,paper,"900",{textAlign:"center"}), rect(`${prefix}-band`,0,158,W,34,spec.palette[2])); break;
    case 14: base.push(image(`${prefix}-photo`,spec.photo,0,0,W,72), rect(`${prefix}-shade`,0,0,W,72,"#000000",{opacity:.28}), rect(`${prefix}-line`,24,118,160,2,accent)); break;
    case 15: base.push(rect(`${prefix}-bar`,0,0,W,28,accent), rect(`${prefix}-angle`,236,28,100,164,muted), image(`${prefix}-photo`,spec.photo,242,34,88,152)); break;
    case 16: base.push(rect(`${prefix}-frame`,12,12,W-24,H-24,"transparent",{borderColor:accent,borderWidth:1}), rect(`${prefix}-frame2`,18,18,W-36,H-36,"transparent",{borderColor:accent,borderWidth:.5}), circle(`${prefix}-seal`,142,40,52,52,accent)); break;
    case 17: base.push(circle(`${prefix}-halo`,236,24,84,84,spec.palette[2]), image(`${prefix}-photo`,spec.photo,244,32,68,68,{borderRadius:34}), rect(`${prefix}-rule`,24,132,286,1,accent)); break;
    case 18: base.push(image(`${prefix}-photo`,spec.photo,0,0,W,H,{opacity:.35}), rect(`${prefix}-panel`,26,22,284,148,paper,{opacity:.92}), rect(`${prefix}-line`,44,42,4,108,accent)); break;
    case 19: base.push(rect(`${prefix}-grid1`,228,0,1,H,accent,{opacity:.45}), rect(`${prefix}-grid2`,266,0,1,H,accent,{opacity:.45}), rect(`${prefix}-grid3`,304,0,1,H,accent,{opacity:.45}), circle(`${prefix}-node`,247,48,12,12,accent), circle(`${prefix}-node2`,285,116,12,12,accent)); break;
    case 20: base.push(rect(`${prefix}-shape1`,218,0,118,62,accent), rect(`${prefix}-shape2`,256,62,80,130,muted), rect(`${prefix}-shape3`,218,124,38,68,ink), image(`${prefix}-photo`,spec.photo,228,16,92,92,{opacity:.72})); break;
  }
  const nameX = [6,7,11,14].includes(spec.layout) ? 166 : 24;
  const nameW = [6,7,11,14].includes(spec.layout) ? 148 : ([1,8,10,15,18,20].includes(spec.layout) ? 188 : 205);
  const nameY = spec.layout === 14 ? 88 : 72;
  base.push(
    text(`${prefix}-brand`,`YOUR COMPANY`,nameX,24,nameW,18,9,accent,"900",{letterSpacing:1.8,fontFamily:spec.fonts[1]}),
    text(`${prefix}-name`,`ALEX MORGAN`,nameX,nameY,nameW,34,spec.layout===7?22:24,ink,"900",{fontFamily:spec.fonts[0],letterSpacing:.2}),
    text(`${prefix}-role`,`${spec.industry.toUpperCase()} PROFESSIONAL`,nameX,nameY+37,nameW,18,9,sub,"800",{fontFamily:spec.fonts[1],letterSpacing:1.2}),
    text(`${prefix}-contact`,`+1 555 014 8200\nhello@yourcompany.com`,nameX,145,nameW,34,9,ink,"600",{fontFamily:spec.fonts[1],lineHeight:14})
  );
  return base;
}

function make(spec: Spec, index: number): ProfessionalTemplate {
  const id = `phase4371-${spec.id}`;
  return {
    metadata: {
      id,
      name: spec.name,
      category: "Business",
      subcategory: "Business Cards",
      industry: spec.industry,
      description: spec.description,
      tags: ["business card", "front and back", "phase 24.3D", "handcrafted", "editable", spec.industry.toLowerCase(), spec.style],
      pageSize: "Business Card 3.5 x 2 in",
      orientation: "landscape",
      previewColor: spec.palette[1],
      palette: [...spec.palette],
      fonts: [...spec.fonts],
      author: "Yaposan Design Studio",
      version: "43.7.1",
      editable: true,
      featured: true,
      trending: index < 8,
      access: index % 4 === 0 ? "premium" : "free",
      createdAt: NOW,
      updatedAt: NOW,
      style: spec.style,
      qualityScore: 100,
      masterTemplateId: id,
    },
    pages: [
      page(`${id}-front`, "Front", spec.palette[0], front(`${id}-front`, spec)),
      page(`${id}-back`, "Back", spec.palette[0], commonBack(`${id}-back`, spec, index)),
    ],
  };
}

export const PHASE4371_PROFESSIONAL_BUSINESS_CARDS: ProfessionalTemplate[] = specs.map(make);
export const PHASE4371_BUSINESS_CARD_COUNT = PHASE4371_PROFESSIONAL_BUSINESS_CARDS.length;

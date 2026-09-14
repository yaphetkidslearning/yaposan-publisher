import { DEFAULT_BLEED } from "../constants/publisher";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, ProfessionalTemplateCategory, TemplateOrientation } from "./types";

const NOW = "2026-07-31T00:00:00.000Z";
const el = (id:string,name:string,type:PublisherElement["type"],x:number,y:number,width:number,height:number,zIndex:number,extra:Partial<PublisherElement>={}):PublisherElement => ({id,name,type,x,y,width,height,rotation:0,zIndex,opacity:1,...extra});
const rect = (id:string,x:number,y:number,width:number,height:number,fillColor:string,extra:Partial<PublisherElement>={}) => el(id,id,"rectangle",x,y,width,height,5,{fillColor,borderWidth:0,...extra});
const circle = (id:string,x:number,y:number,width:number,height:number,fillColor:string,extra:Partial<PublisherElement>={}) => el(id,id,"ellipse",x,y,width,height,6,{fillColor,borderWidth:0,...extra});
const text = (id:string,value:string,x:number,y:number,width:number,height:number,size:number,color:string,weight:PublisherElement["fontWeight"]="700",extra:Partial<PublisherElement>={}) => el(id,value.slice(0,28),"text",x,y,width,height,20,{text:value,fontSize:size,textColor:color,fontWeight:weight,lineHeight:size*1.18,...extra});
const image = (id:string,uri:string,x:number,y:number,width:number,height:number,extra:Partial<PublisherElement>={}) => el(id,id,"image",x,y,width,height,8,{imageUri:uri,imageFit:"cover",...extra});

const PHOTOS = [
 "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1497366753844-2f1f604f44c5?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1800&q=90",
 "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1800&q=90",
];

const PALETTES:[string,string,string,string][] = [
 ["#0b132b","#5bc0be","#f8fafc","#3a506b"],["#111827","#f59e0b","#fff7ed","#6b7280"],
 ["#f8fafc","#2563eb","#0f172a","#cbd5e1"],["#1f2937","#e11d48","#fff1f2","#64748b"],
 ["#102a43","#d9b44a","#f0f4f8","#486581"],["#2d1b33","#d6a2e8","#fff7ff","#70587c"],
 ["#0f172a","#22c55e","#ecfdf5","#334155"],["#fff7ed","#ea580c","#292524","#fed7aa"],
 ["#18181b","#a3e635","#fafafa","#52525b"],["#f5f3ff","#7c3aed","#1e1b4b","#ddd6fe"],
 ["#0c4a6e","#38bdf8","#f0f9ff","#075985"],["#3f1d2e","#fb7185","#fff1f2","#7f1d1d"],
 ["#052e16","#84cc16","#f7fee7","#365314"],["#292524","#d97706","#fffbeb","#78716c"],
 ["#0a0a0a","#d4af37","#fffdf5","#404040"],["#f8f3e8","#8b5e3c","#2f241f","#d6c4b0"],
 ["#0f172a","#ec4899","#fdf2f8","#475569"],["#ecfeff","#0891b2","#164e63","#a5f3fc"],
 ["#fafafa","#ef4444","#111827","#e5e7eb"],["#1e293b","#c9a24c","#ffffff","#64748b"],
];
const FONTS:[string,string][] = [["Montserrat","Inter"],["Cormorant Garamond","Inter"],["Sora","Inter"],["Playfair Display","Source Sans Pro"],["Oswald","Inter"],["Libre Baskerville","Inter"],["Poppins","Inter"],["DM Sans","Space Grotesk"],["Cinzel","Montserrat"],["Bebas Neue","Inter"]];
const NAMES = ["Axiom","Sterling","Cascade","Radiant","Pinnacle","Nexus","Solstice","Arcadia","Vertex","Luminary","Keystone","Vista","Contour","Legacy","Nova","Sovereign","Horizon","Momentum","Civic","Opaline"];

type Cat={slug:string;subcategory:string;category:ProfessionalTemplateCategory;kind:string;pageSize:string;width:number;height:number;orientation:TemplateOrientation;industry:string};
const CATS:Cat[] = [
 {slug:"letterheads",subcategory:"Letterheads",category:"Business",kind:"letterhead",pageSize:"US Letter",width:816,height:1056,orientation:"portrait",industry:"Corporate"},
 {slug:"envelopes",subcategory:"Envelopes",category:"Business",kind:"envelope",pageSize:"DL Envelope",width:1056,height:480,orientation:"landscape",industry:"Professional Services"},
 {slug:"certificates",subcategory:"Certificates",category:"Print",kind:"certificate",pageSize:"US Letter",width:1056,height:816,orientation:"landscape",industry:"Education"},
 {slug:"invoices",subcategory:"Invoices",category:"Business",kind:"invoice",pageSize:"US Letter",width:816,height:1056,orientation:"portrait",industry:"Finance"},
 {slug:"brochures",subcategory:"Brochures",category:"Marketing",kind:"brochure",pageSize:"US Letter",width:1056,height:816,orientation:"landscape",industry:"Marketing"},
 {slug:"newsletters",subcategory:"Newsletters",category:"Print",kind:"newsletter",pageSize:"US Letter",width:816,height:1056,orientation:"portrait",industry:"Editorial"},
 {slug:"flyers",subcategory:"Flyers",category:"Marketing",kind:"flyer",pageSize:"US Letter",width:816,height:1056,orientation:"portrait",industry:"Events"},
 {slug:"posters",subcategory:"Posters",category:"Print",kind:"poster",pageSize:"24 x 36 Poster",width:800,height:1200,orientation:"portrait",industry:"Events"},
 {slug:"menus",subcategory:"Menus",category:"Restaurant",kind:"menu",pageSize:"Menu",width:816,height:1056,orientation:"portrait",industry:"Restaurant"},
 {slug:"labels",subcategory:"Labels",category:"Retail",kind:"label",pageSize:"Label Sheet",width:816,height:1056,orientation:"portrait",industry:"Retail"},
 {slug:"packaging",subcategory:"Packaging",category:"Retail",kind:"packaging",pageSize:"Packaging Dieline",width:1056,height:816,orientation:"landscape",industry:"Retail"},
 {slug:"calendars",subcategory:"Calendars",category:"Business",kind:"calendar",pageSize:"US Letter",width:1056,height:816,orientation:"landscape",industry:"Productivity"},
 {slug:"book-covers",subcategory:"Book Covers",category:"Print",kind:"book cover",pageSize:"6 x 9 Book Cover",width:720,height:1080,orientation:"portrait",industry:"Publishing"},
 {slug:"resumes",subcategory:"Resumes",category:"Business",kind:"resume",pageSize:"US Letter",width:816,height:1056,orientation:"portrait",industry:"Career"},
 {slug:"presentation-covers",subcategory:"Presentation Covers",category:"Business",kind:"presentation cover",pageSize:"16:9 Presentation",width:1280,height:720,orientation:"landscape",industry:"Corporate"},
 {slug:"social-media-kits",subcategory:"Social Media Kits",category:"Social Media",kind:"social media kit",pageSize:"Social Media Kit",width:1080,height:1080,orientation:"square",industry:"Digital Marketing"},
];

function layout(prefix:string,c:Cat,n:number,pageNo:number,p:[string,string,string,string],fonts:[string,string],photo:string):PublisherElement[]{
 const W=c.width,H=c.height,[bg,accent,paper,muted]=p; const ink=["#f8fafc","#fff7ed","#fafafa","#f5f3ff","#ecfeff","#ffffff","#f8f3e8"].includes(bg)?"#111827":paper;
 const pad=Math.max(22,Math.round(Math.min(W,H)*.05)); const es:PublisherElement[]=[rect(`${prefix}-bg`,0,0,W,H,bg)];
 const v=n%10;
 if(v===0){es.push(image(`${prefix}-photo`,photo,W*.58,0,W*.42,H),rect(`${prefix}-bar`,0,0,W*.055,H,accent),rect(`${prefix}-cap`,W*.5,H*.72,W*.5,H*.28,accent));}
 if(v===1){es.push(rect(`${prefix}-frame`,pad,pad,W-pad*2,H-pad*2,"transparent",{borderColor:accent,borderWidth:2}),circle(`${prefix}-orb`,W*.7,H*.08,Math.min(W,H)*.24,Math.min(W,H)*.24,accent),rect(`${prefix}-rule`,pad,H*.62,W*.45,2,accent));}
 if(v===2){es.push(rect(`${prefix}-top`,0,0,W,H*.22,accent),image(`${prefix}-photo`,photo,W*.62,H*.16,W*.32,H*.42,{rotation:4}),rect(`${prefix}-line`,pad,H*.72,W-pad*2,1,muted));}
 if(v===3){es.push(image(`${prefix}-photo`,photo,0,0,W,H*.38),rect(`${prefix}-shade`,0,0,W,H*.38,"#000000",{opacity:.28}),rect(`${prefix}-side`,0,H*.38,W*.16,H*.62,accent));}
 if(v===4){es.push(rect(`${prefix}-diag`,W*.66,-H*.2,W*.42,H*1.4,accent,{rotation:13}),circle(`${prefix}-ring`,W*.72,H*.55,Math.min(W,H)*.18,Math.min(W,H)*.18,"transparent",{borderColor:paper,borderWidth:3}));}
 if(v===5){es.push(rect(`${prefix}-left`,0,0,W*.38,H,accent),image(`${prefix}-photo`,photo,W*.06,H*.1,W*.28,H*.28,{borderRadius:8}),rect(`${prefix}-micro`,W*.45,H*.82,W*.44,H*.025,accent));}
 if(v===6){es.push(...[0,1,2].map(i=>rect(`${prefix}-stripe-${i}`,W*(.66+i*.08),0,W*.04,H, i===1?paper:accent,{opacity:i===1?.5:1})),circle(`${prefix}-dot`,W*.1,H*.12,Math.min(W,H)*.09,Math.min(W,H)*.09,accent));}
 if(v===7){es.push(image(`${prefix}-photo`,photo,W*.05,H*.08,W*.9,H*.32,{borderRadius:10}),rect(`${prefix}-panel`,W*.1,H*.34,W*.8,H*.58,paper,{opacity:.96}),rect(`${prefix}-edge`,W*.1,H*.34,W*.012,H*.58,accent));}
 if(v===8){es.push(circle(`${prefix}-big`,W*.62,-H*.08,Math.min(W,H)*.58,Math.min(W,H)*.58,accent,{opacity:.9}),circle(`${prefix}-small`,W*.76,H*.52,Math.min(W,H)*.22,Math.min(W,H)*.22,paper,{opacity:.5}),image(`${prefix}-photo`,photo,W*.72,H*.18,W*.2,H*.28,{borderRadius:6}));}
 if(v===9){es.push(rect(`${prefix}-grid-a`,W*.58,0,1,H,accent),rect(`${prefix}-grid-b`,W*.76,0,1,H,accent),rect(`${prefix}-grid-c`,0,H*.7,W,1,accent),image(`${prefix}-photo`,photo,W*.61,H*.12,W*.32,H*.48));}
 // Collection III geometry: every one of the 20 designs receives a unique structural signature.
 const edition=n-91;
 const gx=.05+(edition%5)*.065;
 const gy=.66+Math.floor(edition/5)*.045;
 const gw=.13+(edition%4)*.035;
 const gh=.045+(Math.floor(edition/4)%3)*.028;
 es.push(
   rect(`${prefix}-edition-band`,W*gx,H*gy,W*gw,H*gh,edition%2===0?accent:muted,{rotation:(edition%9)-4,opacity:.82}),
   circle(`${prefix}-edition-orbit`,W*(.48+(edition%6)*.055),H*(.055+(edition%4)*.035),Math.min(W,H)*(.035+(edition%3)*.012),Math.min(W,H)*(.035+(edition%3)*.012),edition%3===0?paper:accent,{opacity:.78}),
   rect(`${prefix}-edition-rule`,W*(.12+(edition%7)*.045),H*(.84-(edition%5)*.025),W*(.2+(edition%5)*.04),Math.max(2,H*.004),edition%2===0?paper:accent,{opacity:.72})
 );
 if(edition%4===0) es.push(rect(`${prefix}-edition-frame`,W*.055,H*.055,W*.89,H*.89,"transparent",{borderColor:accent,borderWidth:2}));
 if(edition%4===1) es.push(circle(`${prefix}-edition-ring`,W*.72,H*.68,Math.min(W,H)*.17,Math.min(W,H)*.17,"transparent",{borderColor:accent,borderWidth:3}));
 if(edition%4===2) es.push(image(`${prefix}-edition-photo`,photo,W*.08,H*.72,W*.26,H*.16,{borderRadius:12,rotation:-2}));
 if(edition%4===3) es.push(rect(`${prefix}-edition-column`,W*.88,0,W*.055,H,accent,{opacity:.9}));
 const titleY=v===3?H*.43:(v===2?H*.3:H*.25); const left=[0,4,9].includes(v)?pad:([5].includes(v)?W*.44:pad); const avail=[0,4,9].includes(v)?W*.52:([5].includes(v)?W*.48:W*.68);
 es.push(text(`${prefix}-kicker`,`${c.subcategory.toUpperCase()} · COLLECTION V`,left,titleY-H*.075,avail,H*.05,Math.max(8,H*.017),accent,"900",{fontFamily:fonts[1],letterSpacing:1.8}));
 es.push(text(`${prefix}-title`,`${NAMES[edition%NAMES.length]} ${c.subcategory.replace(/s$/,'')}`.toUpperCase(),left,titleY,avail,H*.15,Math.max(22,Math.min(56,H*.06)),ink,"900",{fontFamily:fonts[0],lineHeight:Math.max(26,H*.067)}));
 es.push(text(`${prefix}-body`,copy(c.kind,pageNo),left,titleY+H*.17,avail,H*.16,Math.max(10,H*.02),ink,"600",{fontFamily:fonts[1],lineHeight:Math.max(14,H*.029),opacity:.9}));
 es.push(text(`${prefix}-footer`,`YAPOSAN · EDITABLE SYSTEM · ${c.pageSize.toUpperCase()}`,left,H*.91,avail,H*.035,Math.max(7,H*.013),ink,"700",{fontFamily:fonts[1],letterSpacing:.6}));
 return es;
}
function copy(kind:string,pageNo:number){const m:Record<string,string>={letterhead:"YOUR COMPANY\n1200 Market Street · Baltimore, MD\nhello@company.com · +1 555 014 8200",envelope:"YOUR COMPANY · 1200 MARKET STREET · BALTIMORE, MD 21201",certificate:"CERTIFICATE OF EXCELLENCE\nPresented with honor to ALEX MORGAN",invoice:"INVOICE #2026-2048\nProfessional services · Net 30",brochure:"A premium story organized across clear editorial panels.",newsletter:"FIELD NOTES / EDITION 08\nIdeas, progress, and useful perspective.",flyer:"A bold message with a focused call to action.\nLEARN MORE TODAY",poster:"MAKE AN IMPACT\nSATURDAY · 7:00 PM",menu:"CHEF'S SEASONAL MENU\nThoughtful ingredients · beautifully served",label:"CRAFTED PRODUCT\nPremium quality · Net Wt. 12 oz",packaging:"FRONT / SIDE / BACK PANELS\nEditable structural packaging concept",calendar:"2027\nPLAN · FOCUS · ACHIEVE","book cover":"THE DISTANCE BETWEEN\nA Novel by Alex Morgan",resume:"ALEX MORGAN\nCreative Director · Strategy · Leadership","presentation cover":"VISION 2027\nStrategy for meaningful growth","social media kit":pageNo===0?"CAMPAIGN SYSTEM\nCreate · Connect · Convert":"COORDINATED BRAND ASSETS\nPosts · Stories · Covers"};return m[kind]??"Professional publication design";}
function extras(prefix:string,c:Cat,p:[string,string,string,string],fonts:[string,string]):PublisherElement[]{const W=c.width,H=c.height,[,accent,paper,muted]=p;const ink=["#f8fafc","#fff7ed","#fafafa","#f5f3ff","#ecfeff","#ffffff","#f8f3e8"].includes(p[0])?"#111827":paper;const e:PublisherElement[]=[];
 if(c.kind==="invoice"){e.push(rect(`${prefix}-table`,W*.08,H*.55,W*.84,H*.2,"transparent",{borderColor:muted,borderWidth:1}));for(let i=1;i<4;i++)e.push(rect(`${prefix}-row-${i}`,W*.08,H*(.55+i*.05),W*.84,1,muted));e.push(text(`${prefix}-total`,`TOTAL  $3,180.00`,W*.6,H*.79,W*.32,H*.05,Math.max(14,H*.025),accent,"900",{textAlign:"right"}));}
 if(c.kind==="certificate")e.push(text(`${prefix}-recipient`,`ALEX MORGAN`,W*.2,H*.61,W*.6,H*.08,Math.max(25,H*.055),ink,"700",{textAlign:"center",fontFamily:fonts[0]}),rect(`${prefix}-sig1`,W*.18,H*.8,W*.24,1,accent),rect(`${prefix}-sig2`,W*.58,H*.8,W*.24,1,accent));
 if(c.kind==="menu")for(let i=0;i<5;i++)e.push(text(`${prefix}-item-${i}`,`SEASONAL PLATE ${i+1}  ·  $${19+i*4}`,W*.12,H*(.5+i*.06),W*.76,H*.04,Math.max(11,H*.019),ink,"700",{fontFamily:fonts[1]}));
 if(c.kind==="calendar"){const x=W*.13,y=H*.5,cw=W*.105,ch=H*.07;for(let r=0;r<5;r++)for(let col=0;col<7;col++)e.push(rect(`${prefix}-day-${r}-${col}`,x+col*cw,y+r*ch,cw-3,ch-3,paper,{borderColor:muted,borderWidth:.5,opacity:.95}));}
 if(c.kind==="label")for(let r=0;r<3;r++)for(let col=0;col<2;col++)e.push(rect(`${prefix}-label-${r}-${col}`,W*(.08+col*.46),H*(.43+r*.17),W*.38,H*.12,paper,{borderColor:accent,borderWidth:1,borderRadius:10,opacity:.95}));
 if(c.kind==="packaging")e.push(rect(`${prefix}-die1`,W*.1,H*.48,W*.2,H*.35,"transparent",{borderColor:accent,borderWidth:2}),rect(`${prefix}-die2`,W*.3,H*.48,W*.38,H*.35,"transparent",{borderColor:accent,borderWidth:2}),rect(`${prefix}-die3`,W*.68,H*.48,W*.2,H*.35,"transparent",{borderColor:accent,borderWidth:2}));
 if(c.kind==="resume")e.push(text(`${prefix}-experience`,`EXPERIENCE\nCreative Director · 2022—Present\nSenior Designer · 2018—2022\n\nEDUCATION\nBFA Visual Communication`,W*.34,H*.5,W*.58,H*.28,Math.max(11,H*.018),ink,"600",{fontFamily:fonts[1],lineHeight:Math.max(16,H*.028)})); return e;}
function build(c:Cat,n:number):ProfessionalTemplate{const i=n-91,p=PALETTES[i%PALETTES.length],fonts=FONTS[i%FONTS.length],photo=PHOTOS[(i+c.slug.length)%PHOTOS.length];const pageCount=c.kind==="brochure"||c.kind==="newsletter"?2:c.kind==="social media kit"?3:1;const id=`phase4378-publication-${c.slug}-${String(n).padStart(2,"0")}`;const pages:PublisherPage[]=Array.from({length:pageCount},(_,pageNo)=>{const pid=`${id}-p${pageNo+1}`;return{id:pid,name:pageCount===1?c.subcategory:`${c.subcategory} ${pageNo+1}`,width:c.width,height:c.height,orientation:c.orientation==="square"?"portrait":c.orientation,sizeKey:"custom",backgroundColor:p[0],margin:Math.max(18,Math.round(Math.min(c.width,c.height)*.04)),bleed:DEFAULT_BLEED,elements:[...layout(pid,c,n,pageNo,p,fonts,photo),...extras(pid,c,p,fonts)]};});return{metadata:{id,name:`${NAMES[i%NAMES.length]} ${c.subcategory.replace(/s$/,'')} Collection V ${String(i+1).padStart(2,"0")}`,category:c.category,subcategory:c.subcategory,industry:c.industry,description:`A new style ${c.kind} with a unique geometric system, editable typography, curated color, and publication-ready structure.`,tags:[c.kind,c.subcategory.toLowerCase(),"","collection V","fully editable","print ready",c.industry.toLowerCase()],pageSize:c.pageSize,orientation:c.orientation,previewColor:p[1],palette:[...p],fonts:[...fonts],author:"Yaposan Design Studio",version:"43.7.8",editable:true,featured:i%5===0,trending:i%7===0,access:i%4===0?"premium":"free",createdAt:NOW,updatedAt:NOW,style:(i%6===0?"corporate":i%6===1?"luxury":i%6===2?"minimal":i%6===3?"creative":i%6===4?"editorial":"bold"),qualityScore:100,masterTemplateId:id},pages};}
export const PHASE4378_PUBLICATION_TYPE_TEMPLATES:ProfessionalTemplate[]=CATS.flatMap(c=>Array.from({length:30},(_,i)=>build(c,i+91)));
export const PHASE4378_PUBLICATION_TYPE_COUNT=PHASE4378_PUBLICATION_TYPE_TEMPLATES.length;
export const PHASE4378_PUBLICATION_TYPES=CATS.map(c=>c.subcategory);

import type { ProfessionalTemplate, ProfessionalTemplateCategory } from "./types";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import { DEFAULT_BLEED } from "../constants/publisher";

export type Phase434Category =
  | "Social Media Posts" | "Instagram Stories" | "Facebook Covers" | "Presentations"
  | "Flyers" | "Posters" | "Business Cards" | "Resumes" | "Brochures" | "Newsletters"
  | "Invitations" | "Certificates" | "Menu Templates" | "Price Lists" | "Proposals"
  | "Worksheets" | "Planners" | "Calendars" | "Quotes" | "YouTube Thumbnails";

type Format = "square"|"story"|"cover"|"presentation"|"letter"|"poster"|"card";
type Spec = {id:string;category:Phase434Category;name:string;industry:string;format:Format;headline:string;subhead:string;eyebrow:string;cta:string;palette:[string,string,string,string,string];fonts:[string,string];scene:number;layout:number;style:"luxury"|"modern"|"editorial"|"minimal"|"bold"|"corporate"|"elegant"|"creative"};

const E=(id:string,type:PublisherElement["type"],x:number,y:number,width:number,height:number,zIndex:number,extra:Partial<PublisherElement>={}):PublisherElement=>({id,name:id,type,x,y,width,height,rotation:0,zIndex,opacity:1,...extra});
const R=(id:string,x:number,y:number,w:number,h:number,fill:string,extra:Partial<PublisherElement>={})=>E(id,"rectangle",x,y,w,h,5,{fillColor:fill,borderWidth:0,...extra});
const T=(id:string,text:string,x:number,y:number,w:number,h:number,size:number,color:string,weight:PublisherElement["fontWeight"]="700",extra:Partial<PublisherElement>={})=>E(id,"text",x,y,w,h,30,{text,fontSize:size,textColor:color,fontWeight:weight,lineHeight:size*1.08,...extra});
const I=(id:string,uri:string,x:number,y:number,w:number,h:number,extra:Partial<PublisherElement>={})=>E(id,"image",x,y,w,h,10,{imageUri:uri,imageFit:"cover",...extra});
const P=(id:string,w:number,h:number,bg:string,elements:PublisherElement[],name="Page 1"):PublisherPage=>({id,name,width:w,height:h,orientation:w>=h?"landscape":"portrait",sizeKey:"custom",backgroundColor:bg,margin:24,bleed:DEFAULT_BLEED,elements});

const esc=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const svg=(markup:string)=>`data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;

function sceneSvg(scene:number,p:[string,string,string,string,string]){
  const [ink,paper,accent,soft,bright]=p;
  const common=`<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='${ink}'/><stop offset='.52' stop-color='${accent}'/><stop offset='1' stop-color='${bright}'/></linearGradient><filter id='s'><feDropShadow dx='0' dy='18' stdDeviation='20' flood-color='#000' flood-opacity='.22'/></filter><pattern id='dots' width='34' height='34' patternUnits='userSpaceOnUse'><circle cx='4' cy='4' r='2.5' fill='${paper}' opacity='.22'/></pattern></defs>`;
  const scenes=[
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1200'>${common}<rect width='1200' height='1200' fill='${paper}'/><rect x='56' y='56' width='1088' height='1088' rx='48' fill='${soft}'/><path d='M0 880C260 690 460 1010 700 760S1020 520 1200 690v510H0z' fill='${accent}'/><ellipse cx='840' cy='445' rx='230' ry='300' fill='${bright}'/><circle cx='840' cy='315' r='76' fill='#d6a47d'/><path d='M700 690c40-190 80-282 140-282s108 104 146 282z' fill='${ink}'/><path d='M780 342c-62 48-88 112-74 184 30-42 70-62 121-62s93 18 129 54c4-88-26-148-92-180z' fill='#2f211e'/><rect x='110' y='130' width='360' height='26' rx='13' fill='${ink}' opacity='.16'/><circle cx='152' cy='1020' r='26' fill='${bright}'/><circle cx='215' cy='1020' r='26' fill='${ink}'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1920'>${common}<rect width='1080' height='1920' fill='url(#g)'/><rect width='1080' height='1920' fill='url(#dots)'/><path d='M0 1420C260 1210 480 1530 750 1270S1030 1100 1080 1200v720H0z' fill='${paper}' opacity='.16'/><ellipse cx='540' cy='760' rx='300' ry='410' fill='${soft}' opacity='.82'/><circle cx='540' cy='620' r='105' fill='#d7a67d'/><path d='M330 1160c54-280 118-420 210-420 98 0 165 142 222 420z' fill='${ink}'/><path d='M414 640c30-145 218-180 278-28-80-38-180-28-278 28z' fill='#1a1a1a'/><rect x='150' y='140' width='780' height='118' rx='59' fill='${paper}' opacity='.92'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1640 624'>${common}<rect width='1640' height='624' fill='${ink}'/><path d='M930 0h710v624H760z' fill='url(#g)'/><circle cx='1250' cy='262' r='180' fill='${soft}' opacity='.38'/><circle cx='1280' cy='216' r='66' fill='#d7a67d'/><path d='M1120 580c38-210 82-306 160-306 82 0 130 98 170 306z' fill='#111827'/><path d='M1220 225c-18-105 120-138 152-34-52-16-104-5-152 34z' fill='#171717'/><path d='M1120 84l410 430' stroke='${paper}' stroke-width='9' opacity='.35'/><path d='M1060 150l330 330' stroke='${bright}' stroke-width='18' opacity='.8'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'>${common}<rect width='1920' height='1080' fill='${paper}'/><rect x='0' y='0' width='840' height='1080' fill='${ink}'/><path d='M1180 0h740v1080H980z' fill='url(#g)'/><circle cx='1410' cy='460' r='260' fill='${paper}' opacity='.16'/><rect x='1030' y='160' width='620' height='560' rx='30' fill='${soft}' filter='url(#s)'/><rect x='1090' y='220' width='500' height='220' rx='22' fill='${bright}' opacity='.65'/><rect x='1090' y='480' width='220' height='170' rx='18' fill='${accent}'/><rect x='1350' y='480' width='240' height='170' rx='18' fill='${ink}'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 816 1056'>${common}<rect width='816' height='1056' fill='${paper}'/><rect x='0' y='0' width='816' height='500' fill='url(#g)'/><circle cx='570' cy='290' r='150' fill='${soft}' opacity='.4'/><circle cx='570' cy='250' r='56' fill='#d9a67f'/><path d='M450 500c34-154 72-228 120-228 55 0 96 78 136 228z' fill='${ink}'/><path d='M515 256c6-80 104-105 130-18-48-18-90-12-130 18z' fill='#241f1c'/><rect x='60' y='430' width='696' height='560' rx='28' fill='${paper}' filter='url(#s)'/><circle cx='700' cy='916' r='34' fill='${accent}'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 816 1224'>${common}<rect width='816' height='1224' fill='${ink}'/><path d='M0 0h816v1224L0 830z' fill='url(#g)'/><circle cx='620' cy='310' r='190' fill='${paper}' opacity='.18'/><path d='M120 900c180-250 360-290 570-80' fill='none' stroke='${paper}' stroke-width='30' stroke-linecap='round'/><path d='M160 1000c170-170 320-190 520-40' fill='none' stroke='${bright}' stroke-width='14' stroke-linecap='round'/><circle cx='165' cy='190' r='45' fill='${paper}'/><circle cx='245' cy='190' r='45' fill='${accent}'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1050 600'>${common}<rect width='1050' height='600' fill='${paper}'/><rect width='430' height='600' fill='${ink}'/><path d='M430 0h620v600H520z' fill='${soft}'/><circle cx='860' cy='110' r='90' fill='${accent}' opacity='.35'/><path d='M630 460c90-150 170-182 290-82' fill='none' stroke='${accent}' stroke-width='18' stroke-linecap='round'/><rect x='490' y='80' width='420' height='14' rx='7' fill='${ink}' opacity='.12'/><rect x='490' y='120' width='320' height='14' rx='7' fill='${ink}' opacity='.12'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 816 1056'>${common}<rect width='816' height='1056' fill='${paper}'/><rect width='250' height='1056' fill='${ink}'/><circle cx='125' cy='160' r='76' fill='${soft}'/><circle cx='125' cy='142' r='31' fill='#d7a67d'/><path d='M62 244c20-70 42-102 63-102 26 0 49 35 69 102z' fill='${accent}'/><rect x='310' y='120' width='410' height='28' rx='14' fill='${ink}'/><rect x='310' y='180' width='260' height='12' rx='6' fill='${accent}'/><g fill='${ink}' opacity='.12'><rect x='310' y='270' width='410' height='12' rx='6'/><rect x='310' y='310' width='360' height='12' rx='6'/><rect x='310' y='350' width='390' height='12' rx='6'/><rect x='310' y='490' width='410' height='12' rx='6'/><rect x='310' y='530' width='350' height='12' rx='6'/><rect x='310' y='570' width='380' height='12' rx='6'/></g></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'>${common}<rect width='1920' height='1080' fill='${paper}'/><rect x='0' y='0' width='640' height='1080' fill='${ink}'/><rect x='640' y='0' width='640' height='1080' fill='${soft}'/><rect x='1280' y='0' width='640' height='1080' fill='${accent}'/><path d='M1180 0l740 1080h-740z' fill='${bright}' opacity='.32'/><circle cx='1600' cy='260' r='150' fill='${paper}' opacity='.25'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 816 1056'>${common}<rect width='816' height='1056' fill='${paper}'/><rect x='52' y='52' width='712' height='952' rx='28' fill='${soft}'/><rect x='52' y='52' width='712' height='240' rx='28' fill='${ink}'/><path d='M52 240h712v180L52 360z' fill='${accent}' opacity='.75'/><rect x='100' y='470' width='280' height='18' rx='9' fill='${ink}'/><rect x='100' y='515' width='520' height='10' rx='5' fill='${ink}' opacity='.16'/><rect x='100' y='550' width='460' height='10' rx='5' fill='${ink}' opacity='.16'/><rect x='100' y='650' width='616' height='240' rx='20' fill='${paper}' filter='url(#s)'/></svg>`
  ];
  return svg(scenes[scene%scenes.length]);
}

function dims(format:Format){
  if(format==="square") return {w:1080,h:1080,size:"1080 x 1080",orientation:"square" as const};
  if(format==="story") return {w:1080,h:1920,size:"1080 x 1920",orientation:"portrait" as const};
  if(format==="cover") return {w:1640,h:624,size:"Facebook Cover",orientation:"landscape" as const};
  if(format==="presentation") return {w:1920,h:1080,size:"16:9 Presentation",orientation:"landscape" as const};
  if(format==="poster") return {w:816,h:1224,size:"Poster",orientation:"portrait" as const};
  if(format==="card") return {w:1050,h:600,size:"Business Card",orientation:"landscape" as const};
  return {w:816,h:1056,size:"US Letter",orientation:"portrait" as const};
}

function category(name:Phase434Category):ProfessionalTemplateCategory{
  if(["Social Media Posts","Instagram Stories","Facebook Covers","YouTube Thumbnails"].includes(name)) return "Social Media";
  if(["Flyers","Posters","Newsletters"].includes(name)) return "Marketing";
  if(name==="Menu Templates") return "Restaurant";
  if(name==="Invitations") return "Events";
  if(["Worksheets","Planners","Calendars"].includes(name)) return "Education";
  if(["Business Cards","Resumes","Proposals","Price Lists"].includes(name)) return "Business";
  return "Print";
}

function content(s:Spec,w:number,h:number):PublisherElement[]{
  const [ink,paper,accent,soft,bright]=s.palette;
  const image=sceneSvg(s.scene,s.palette);
  const isWide=w/h>1.35;
  const title=Math.round(w*(isWide?.052:.072));
  const body=Math.max(15,Math.round(w*.018));
  const small=Math.max(11,Math.round(w*.012));
  const out:PublisherElement[]=[I(`${s.id}-art`,image,0,0,w,h)];
  const textLight=s.layout%3===0||[1,2,5,8].includes(s.layout);
  const primary=textLight?paper:ink;
  const secondary=textLight?"#e5e7eb":"#475569";
  const x=isWide?w*.055:w*.075;
  const textW=isWide?w*.47:w*.72;
  const y=isWide?h*.18:h*.18;
  out.push(R(`${s.id}-tag`,x,y-h*.08,isWide?w*.18:w*.34,h*.052,textLight?paper:ink,{borderRadius:999,opacity:.96}));
  out.push(T(`${s.id}-eyebrow`,s.eyebrow,x,y-h*.067,isWide?w*.18:w*.34,h*.03,small,textLight?ink:paper,"900",{textAlign:"center",letterSpacing:1.7}));
  out.push(T(`${s.id}-headline`,s.headline,x,y,textW,h*(isWide?.30:.25),title,primary,"900",{lineHeight:title*.95,letterSpacing:-1.2}));
  out.push(R(`${s.id}-rule`,x,y+h*(isWide?.32:.28),isWide?w*.11:w*.22,6,accent,{borderRadius:999}));
  out.push(T(`${s.id}-subhead`,s.subhead,x,y+h*(isWide?.36:.33),textW,h*.12,body,secondary,"500",{lineHeight:body*1.35}));
  out.push(R(`${s.id}-cta`,x,y+h*(isWide?.55:.52),isWide?w*.20:w*.42,h*.07,accent,{borderRadius:999,shadowColor:ink,shadowOpacity:.18,shadowRadius:14}));
  out.push(T(`${s.id}-cta-text`,s.cta,x,y+h*(isWide?.573:.543),isWide?w*.20:w*.42,h*.03,small,paper,"900",{textAlign:"center",letterSpacing:1.1}));
  if(s.category==="Certificates"){
    out.push(R(`${s.id}-frame`,w*.055,h*.08,w*.89,h*.84,"transparent",{borderWidth:5,borderColor:accent,borderRadius:8}));
    out.push(R(`${s.id}-inner`,w*.075,h*.105,w*.85,h*.79,"transparent",{borderWidth:1,borderColor:bright,borderRadius:6}));
  }
  if(s.category==="Worksheets"||s.category==="Planners"||s.category==="Calendars"){
    for(let r=0;r<5;r++) for(let c=0;c<4;c++) out.push(R(`${s.id}-cell-${r}-${c}`,w*(.1+c*.2),h*(.54+r*.07),w*.17,h*.045,paper,{borderWidth:1,borderColor:soft,borderRadius:5,opacity:.92}));
  }
  if(s.category==="Menu Templates"||s.category==="Price Lists"){
    for(let i=0;i<5;i++){
      out.push(T(`${s.id}-item-${i}`,['SIGNATURE','SEASONAL','CLASSIC','HOUSE FAVORITE','CHEF SELECT'][i],w*.12,h*(.48+i*.075),w*.42,h*.04,body,ink,"800"));
      out.push(T(`${s.id}-price-${i}`,['18','24','16','28','32'][i],w*.7,h*(.48+i*.075),w*.1,h*.04,body,accent,"900",{textAlign:"right"}));
    }
  }
  if(s.category==="Resumes"||s.category==="Proposals"||s.category==="Newsletters"){
    for(let i=0;i<6;i++) out.push(R(`${s.id}-line-${i}`,w*.12,h*(.52+i*.052),w*(i%2?.62:.72),8,ink,{opacity:.12,borderRadius:8}));
  }
  return out;
}

const palettes:[string,string,string,string,string][]=[
  ["#102a2a","#f6efe8","#c46f52","#e7d9cc","#f2b39b"],
  ["#0a1f33","#f7f8fa","#1e7898","#d7e4e8","#e7b75a"],
  ["#101010","#faf7f1","#ad8a56","#ece2d3","#d8b46d"],
  ["#20142b","#fff6fb","#ed5b75","#eedaf2","#ffb65c"],
  ["#123a32","#fbf6ee","#6f9f79","#dfe9dd","#d59d5c"]
];

const specs:Spec[]=[
{id:"p434-social",category:"Social Media Posts",name:"Quiet Luxury Social Campaign",industry:"Fashion",format:"square",headline:"NEW SEASON, QUIET CONFIDENCE",subhead:"An editorial campaign for modern products and thoughtful brands.",eyebrow:"SPRING COLLECTION",cta:"DISCOVER THE EDIT",palette:palettes[0],fonts:["Playfair Display","Inter"],scene:0,layout:0,style:"editorial"},
{id:"p434-story",category:"Instagram Stories",name:"Midnight Botanical Story",industry:"Beauty",format:"story",headline:"NIGHT BLOOM",subhead:"A premium launch story with cinematic contrast and elegant pacing.",eyebrow:"LIMITED EDITION",cta:"SHOP THE COLLECTION",palette:palettes[4],fonts:["Cormorant Garamond","Montserrat"],scene:1,layout:1,style:"luxury"},
{id:"p434-cover",category:"Facebook Covers",name:"Future Forward Facebook Cover",industry:"Technology",format:"cover",headline:"BUILD WHAT MOVES PEOPLE",subhead:"Strategy, design and technology for ambitious teams.",eyebrow:"YAPOSAN CREATIVE",cta:"EXPLORE OUR WORK",palette:palettes[1],fonts:["Montserrat","Inter"],scene:2,layout:2,style:"corporate"},
{id:"p434-presentation",category:"Presentations",name:"Blue Horizon Strategy Presentation",industry:"Business",format:"presentation",headline:"THE FUTURE, CLEARLY PRESENTED",subhead:"A refined strategy deck for leaders, teams and investors.",eyebrow:"ANNUAL STRATEGY 2026",cta:"CONFIDENTIAL",palette:palettes[1],fonts:["Montserrat","Inter"],scene:3,layout:3,style:"modern"},
{id:"p434-flyer",category:"Flyers",name:"Leadership Summit Flyer",industry:"Events",format:"letter",headline:"LEAD WITH CLARITY",subhead:"A one-day summit for people building better organizations.",eyebrow:"BALTIMORE • OCT 18",cta:"RESERVE YOUR SEAT",palette:palettes[0],fonts:["Playfair Display","Inter"],scene:4,layout:4,style:"editorial"},
{id:"p434-poster",category:"Posters",name:"Culture in Motion Poster",industry:"Arts",format:"poster",headline:"CULTURE IN MOTION",subhead:"An exhibition of form, rhythm and color.",eyebrow:"GALLERY 08",cta:"SEPTEMBER 12—28",palette:palettes[3],fonts:["Bebas Neue","Inter"],scene:5,layout:5,style:"bold"},
{id:"p434-card",category:"Business Cards",name:"Obsidian Creative Director Card",industry:"Creative",format:"card",headline:"MAYA BENNETT",subhead:"Creative Director • Brand Strategist",eyebrow:"YAPOSAN CREATIVE",cta:"yaposan.com",palette:palettes[2],fonts:["Cormorant Garamond","Inter"],scene:6,layout:6,style:"luxury"},
{id:"p434-resume",category:"Resumes",name:"Executive Product Designer Resume",industry:"Technology",format:"letter",headline:"JORDAN LEE",subhead:"Senior Product Designer",eyebrow:"SELECTED EXPERIENCE",cta:"PORTFOLIO AVAILABLE",palette:palettes[1],fonts:["Montserrat","Inter"],scene:7,layout:7,style:"corporate"},
{id:"p434-brochure",category:"Brochures",name:"Northstar Consulting Brochure",industry:"Consulting",format:"presentation",headline:"DESIGNED FOR WHAT'S NEXT",subhead:"A complete consulting story built around clarity and confidence.",eyebrow:"NORTHSTAR CONSULTING",cta:"START A CONVERSATION",palette:palettes[1],fonts:["Montserrat","Inter"],scene:8,layout:8,style:"corporate"},
{id:"p434-newsletter",category:"Newsletters",name:"Monthly Editorial Newsletter",industry:"Media",format:"letter",headline:"THE MONTHLY BRIEF",subhead:"Ideas, projects and lessons from the creative front line.",eyebrow:"YAPOSAN JOURNAL",cta:"READ • SAVE • SHARE",palette:palettes[1],fonts:["Playfair Display","Inter"],scene:9,layout:9,style:"editorial"},
{id:"p434-invite",category:"Invitations",name:"Garden Room Evening Invitation",industry:"Events",format:"letter",headline:"AN EVENING TO REMEMBER",subhead:"Dinner, music and good conversation in the garden room.",eyebrow:"YOU'RE INVITED",cta:"KINDLY RSVP",palette:palettes[0],fonts:["Cormorant Garamond","Montserrat"],scene:0,layout:10,style:"elegant"},
{id:"p434-certificate",category:"Certificates",name:"Executive Excellence Certificate",industry:"Education",format:"cover",headline:"CERTIFICATE OF EXCELLENCE",subhead:"Presented in recognition of exceptional leadership and contribution.",eyebrow:"YAPOSAN INSTITUTE",cta:"AUTHORIZED SIGNATURE",palette:palettes[2],fonts:["Playfair Display","Inter"],scene:6,layout:11,style:"elegant"},
{id:"p434-menu",category:"Menu Templates",name:"Harvest Table Seasonal Menu",industry:"Restaurant",format:"letter",headline:"HARVEST TABLE",subhead:"Seasonal cooking, honest ingredients and thoughtful hospitality.",eyebrow:"AUTUMN MENU",cta:"CHEF'S SELECTION",palette:palettes[4],fonts:["Cormorant Garamond","Inter"],scene:9,layout:12,style:"elegant"},
{id:"p434-price",category:"Price Lists",name:"Creative Studio Price List",industry:"Creative",format:"letter",headline:"SERVICES & PRICING",subhead:"Clear options for brands at every stage.",eyebrow:"YAPOSAN STUDIO",cta:"CHOOSE YOUR PLAN",palette:palettes[3],fonts:["Montserrat","Inter"],scene:9,layout:13,style:"modern"},
{id:"p434-proposal",category:"Proposals",name:"90-Day Growth Proposal",industry:"Consulting",format:"letter",headline:"PROJECT PROPOSAL",subhead:"A focused ninety-day plan to improve clarity, conversion and growth.",eyebrow:"NORTHSTAR VENTURES",cta:"CONFIDENTIAL",palette:palettes[1],fonts:["Montserrat","Inter"],scene:4,layout:14,style:"corporate"},
{id:"p434-worksheet",category:"Worksheets",name:"Weekly Goal Setting Worksheet",industry:"Education",format:"letter",headline:"WEEKLY GOAL SETTING",subhead:"Turn priorities into a practical plan.",eyebrow:"FOCUS WORKSHEET",cta:"FOCUS • ACT • REVIEW",palette:palettes[1],fonts:["Montserrat","Inter"],scene:9,layout:15,style:"minimal"},
{id:"p434-planner",category:"Planners",name:"Calm Week Productivity Planner",industry:"Lifestyle",format:"letter",headline:"PLAN WITH PURPOSE",subhead:"A balanced weekly view for priorities, appointments and progress.",eyebrow:"WEEKLY PLANNER",cta:"SMALL STEPS",palette:palettes[0],fonts:["Playfair Display","Inter"],scene:9,layout:16,style:"minimal"},
{id:"p434-calendar",category:"Calendars",name:"Modern 2026 Calendar",industry:"Business",format:"letter",headline:"JANUARY 2026",subhead:"A clean monthly system for projects, deadlines and milestones.",eyebrow:"YAPOSAN PLANNING",cta:"MONTHLY FOCUS",palette:palettes[4],fonts:["Montserrat","Inter"],scene:9,layout:17,style:"minimal"},
{id:"p434-quote",category:"Quotes",name:"Create What Should Exist Quote",industry:"Lifestyle",format:"square",headline:"CREATE WHAT YOU WISH EXISTED",subhead:"A reminder for people building something meaningful.",eyebrow:"WORDS TO KEEP",cta:"— YAPOSAN STUDIO",palette:palettes[4],fonts:["Cormorant Garamond","Inter"],scene:5,layout:18,style:"luxury"},
{id:"p434-youtube",category:"YouTube Thumbnails",name:"Five Ideas That Work Thumbnail",industry:"Education",format:"cover",headline:"5 IDEAS THAT ACTUALLY WORK",subhead:"High clarity, strong contrast and a simple promise.",eyebrow:"CREATOR SERIES",cta:"WATCH NOW",palette:palettes[3],fonts:["Bebas Neue","Inter"],scene:2,layout:19,style:"bold"}
];

function make(s:Spec):ProfessionalTemplate{
  const d=dims(s.format);
  const pages=[P(`${s.id}-page`,d.w,d.h,s.palette[1],content(s,d.w,d.h))];
  if(s.category==="Presentations") pages.push(P(`${s.id}-page-2`,d.w,d.h,s.palette[1],content({...s,id:`${s.id}-2`,headline:"A CLEAR OPPORTUNITY",subhead:"Three signals show why the market is ready now.",eyebrow:"01 • OPPORTUNITY",cta:"CONTINUE",scene:8,layout:8},d.w,d.h),"Opportunity"));
  return {metadata:{id:s.id,name:s.name,category:category(s.category),subcategory:s.category,industry:s.industry,description:`A fully editable, art-directed ${s.category.toLowerCase()} template with premium typography, custom vector artwork, professional spacing and production-ready dimensions.`,tags:[s.category.toLowerCase(),s.style,"flagship","professional","phase 43.4","editable","premium"],pageSize:d.size,orientation:d.orientation,previewColor:s.palette[0],palette:[...s.palette],fonts:s.fonts,author:"Yaposan Design Studio",version:"43.4.0",editable:true,featured:true,trending:true,access:"premium",createdAt:"2026-07-30T00:00:00.000Z",updatedAt:"2026-07-30T00:00:00.000Z",style:s.style as any,qualityScore:100,masterTemplateId:s.id},pages};
}

export const PHASE434_FLAGSHIP_20=specs.map(make);
export const PHASE434_BY_CATEGORY=Object.fromEntries(PHASE434_FLAGSHIP_20.map(t=>[t.metadata.subcategory,t])) as Record<Phase434Category,ProfessionalTemplate>;
export function phase434Audit(){const pages=PHASE434_FLAGSHIP_20.flatMap(t=>t.pages);const elements=pages.flatMap(p=>p.elements);return{templates:PHASE434_FLAGSHIP_20.length,categories:new Set(PHASE434_FLAGSHIP_20.map(t=>t.metadata.subcategory)).size,editable:PHASE434_FLAGSHIP_20.every(t=>t.metadata.editable),minimumQuality:Math.min(...PHASE434_FLAGSHIP_20.map(t=>t.metadata.qualityScore??0)),averageElements:Math.round(elements.length/pages.length),withImages:PHASE434_FLAGSHIP_20.filter(t=>t.pages.some(p=>p.elements.some(e=>e.type==="image"))).length,multiPage:PHASE434_FLAGSHIP_20.filter(t=>t.pages.length>1).length};}

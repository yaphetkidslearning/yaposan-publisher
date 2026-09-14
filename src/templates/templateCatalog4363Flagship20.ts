import type { ProfessionalTemplate, ProfessionalTemplateCategory } from "./types";
import type { PublisherElement, PublisherPage } from "../types/publisher";
import { DEFAULT_BLEED } from "../constants/publisher";

export type Flagship20Category =
  | "Social Media Posts" | "Instagram Stories" | "Facebook Covers" | "Presentations"
  | "Flyers" | "Posters" | "Business Cards" | "Resumes" | "Brochures" | "Newsletters"
  | "Invitations" | "Certificates" | "Menu Templates" | "Price Lists" | "Proposals"
  | "Worksheets" | "Planners" | "Calendars" | "Quotes" | "YouTube Thumbnails";

type Palette = readonly [string,string,string,string,string,string];
type Spec = {
  id:string; category:Flagship20Category; name:string; industry:string;
  format:"square"|"story"|"cover"|"presentation"|"letter"|"poster"|"card";
  style:"luxury"|"modern"|"editorial"|"minimal"|"bold"|"corporate"|"elegant"|"creative";
  palette:Palette; fonts:[string,string]; headline:string; subhead:string; eyebrow:string; cta:string;
  layout:number; art:number;
};

const E=(id:string,type:PublisherElement["type"],x:number,y:number,width:number,height:number,zIndex:number,extra:Partial<PublisherElement>={}):PublisherElement=>({id,name:id,type,x,y,width,height,rotation:0,zIndex,opacity:1,...extra});
const R=(id:string,x:number,y:number,w:number,h:number,fill:string,extra:Partial<PublisherElement>={})=>E(id,"rectangle",x,y,w,h,5,{fillColor:fill,borderWidth:0,...extra});
const T=(id:string,value:string,x:number,y:number,w:number,h:number,size:number,color:string,weight:PublisherElement["fontWeight"]="700",extra:Partial<PublisherElement>={})=>E(id,"text",x,y,w,h,30,{text:value,fontSize:size,textColor:color,fontWeight:weight,lineHeight:size*1.12,...extra});
const I=(id:string,uri:string,x:number,y:number,w:number,h:number,extra:Partial<PublisherElement>={})=>E(id,"image",x,y,w,h,10,{imageUri:uri,imageFit:"cover",...extra});
const C=(id:string,x:number,y:number,s:number,fill:string,extra:Partial<PublisherElement>={})=>R(id,x,y,s,s,fill,{borderRadius:999,...extra});
const L=(id:string,x:number,y:number,w:number,h:number,fill:string)=>R(id,x,y,w,h,fill);
const P=(id:string,w:number,h:number,bg:string,elements:PublisherElement[],name="Page 1"):PublisherPage=>({id,name,width:w,height:h,orientation:w>=h?"landscape":"portrait",sizeKey:"custom",backgroundColor:bg,margin:24,bleed:DEFAULT_BLEED,elements});

function svgUri(index:number,p:Palette){
  const [ink,paper,accent,soft,bright,deep]=p;
  const variants=[
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='${deep}'/><stop offset='.6' stop-color='${accent}'/><stop offset='1' stop-color='${bright}'/></linearGradient></defs><rect width='1200' height='900' fill='url(#g)'/><circle cx='900' cy='210' r='240' fill='${paper}' opacity='.18'/><path d='M0 720L250 480l210 170 230-310 510 560H0z' fill='${ink}' opacity='.34'/><path d='M0 790l330-250 250 190 190-120 430 290H0z' fill='${paper}' opacity='.18'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'><rect width='1200' height='900' fill='${paper}'/><rect x='70' y='70' width='1060' height='760' rx='46' fill='${soft}'/><circle cx='390' cy='420' r='220' fill='${accent}' opacity='.78'/><circle cx='690' cy='330' r='170' fill='${bright}' opacity='.72'/><circle cx='780' cy='580' r='240' fill='${deep}' opacity='.86'/><path d='M150 710c220-240 410-210 560-30 130 155 245 100 340-35' fill='none' stroke='${ink}' stroke-width='36' stroke-linecap='round' opacity='.72'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'><defs><linearGradient id='g2' x1='0' y1='1' x2='1' y2='0'><stop stop-color='${ink}'/><stop offset='1' stop-color='${deep}'/></linearGradient></defs><rect width='1200' height='900' fill='url(#g2)'/><rect x='110' y='100' width='420' height='690' rx='42' fill='${paper}' opacity='.96'/><rect x='580' y='180' width='510' height='230' rx='32' fill='${accent}'/><rect x='580' y='450' width='340' height='260' rx='32' fill='${bright}' opacity='.85'/><circle cx='1010' cy='620' r='150' fill='${soft}' opacity='.55'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'><rect width='1200' height='900' fill='${deep}'/><g opacity='.95'><rect x='0' y='0' width='400' height='900' fill='${ink}'/><rect x='400' y='0' width='400' height='900' fill='${accent}'/><rect x='800' y='0' width='400' height='900' fill='${bright}'/></g><circle cx='600' cy='450' r='300' fill='${paper}' opacity='.18'/><circle cx='600' cy='450' r='170' fill='none' stroke='${paper}' stroke-width='18' opacity='.8'/><path d='M260 700L560 260l380 440z' fill='none' stroke='${paper}' stroke-width='22' opacity='.8'/></svg>`,
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'><rect width='1200' height='900' fill='${paper}'/><path d='M0 0h1200v340C920 210 800 450 560 330 340 220 180 380 0 250z' fill='${ink}'/><path d='M0 900V590c210 80 320-80 520 40 220 130 420-70 680 30v240z' fill='${accent}'/><circle cx='900' cy='500' r='170' fill='${bright}' opacity='.78'/><circle cx='980' cy='550' r='70' fill='${deep}' opacity='.75'/></svg>`
  ];
  return `data:image/svg+xml;utf8,${encodeURIComponent(variants[index%variants.length])}`;
}

function dims(format:Spec["format"]){
  if(format==="square") return {w:1080,h:1080,size:"1080 x 1080",orientation:"square" as const};
  if(format==="story") return {w:1080,h:1920,size:"1080 x 1920",orientation:"portrait" as const};
  if(format==="cover") return {w:1640,h:624,size:"Facebook Cover",orientation:"landscape" as const};
  if(format==="presentation") return {w:1920,h:1080,size:"16:9 Presentation",orientation:"landscape" as const};
  if(format==="poster") return {w:816,h:1224,size:"Poster",orientation:"portrait" as const};
  if(format==="card") return {w:1050,h:600,size:"Business Card",orientation:"landscape" as const};
  return {w:816,h:1056,size:"US Letter",orientation:"portrait" as const};
}

function mapCategory(name:string):ProfessionalTemplateCategory{
  if(["Social Media Posts","Instagram Stories","Facebook Covers","YouTube Thumbnails"].includes(name)) return "Social Media";
  if(["Flyers","Posters","Newsletters"].includes(name)) return "Marketing";
  if(["Menu Templates"].includes(name)) return "Restaurant";
  if(["Invitations"].includes(name)) return "Events";
  if(["Worksheets","Planners","Calendars"].includes(name)) return "Education";
  if(["Business Cards","Resumes","Proposals","Price Lists"].includes(name)) return "Business";
  return "Print";
}

function elementsFor(s:Spec,w:number,h:number):PublisherElement[]{
  const [ink,paper,accent,soft,bright,deep]=s.palette;
  const id=s.id, art=svgUri(s.art,s.palette);
  const small=Math.max(12,Math.round(w*.014));
  const body=Math.max(16,Math.round(w*.02));
  const title=Math.max(38,Math.round(w*(w/h>1.4?.045:.064)));
  const out:PublisherElement[]=[];
  switch(s.layout){
    case 0: // premium social editorial
      out.push(R(id+"-bg",0,0,w,h,paper),I(id+"-photo",art,w*.52,0,w*.48,h,{borderRadius:0}),R(id+"-veil",w*.52,0,w*.48,h,ink,{opacity:.18}),R(id+"-chip",w*.07,h*.08,w*.25,h*.055,accent,{borderRadius:999}),T(id+"-ey",s.eyebrow,w*.07,h*.095,w*.25,h*.03,small,paper,"900",{textAlign:"center",letterSpacing:2}),T(id+"-title",s.headline,w*.07,h*.25,w*.4,h*.31,title,ink,"900"),L(id+"-rule",w*.07,h*.61,w*.13,7,accent),T(id+"-sub",s.subhead,w*.07,h*.66,w*.38,h*.12,body,"#475569","500"),R(id+"-cta",w*.07,h*.84,w*.27,h*.075,ink,{borderRadius:999}),T(id+"-cta-t",s.cta,w*.07,h*.863,w*.27,h*.035,small,paper,"900",{textAlign:"center",letterSpacing:1.3}),C(id+"-dot",w*.43,h*.12,w*.06,bright));
      break;
    case 1: // story luxury
      out.push(I(id+"-photo",art,0,0,w,h),R(id+"-shade",0,0,w,h,ink,{opacity:.48}),R(id+"-top",w*.08,h*.055,w*.84,h*.075,paper,{opacity:.92,borderRadius:999}),T(id+"-ey",s.eyebrow,w*.12,h*.075,w*.76,h*.035,small,ink,"900",{textAlign:"center",letterSpacing:2}),T(id+"-title",s.headline,w*.09,h*.28,w*.82,h*.25,title,paper,"900",{textAlign:"center",lineHeight:title*1.02}),L(id+"-line",w*.34,h*.57,w*.32,6,bright),T(id+"-sub",s.subhead,w*.14,h*.63,w*.72,h*.1,body,paper,"500",{textAlign:"center"}),R(id+"-cta",w*.27,h*.8,w*.46,h*.075,accent,{borderRadius:999}),T(id+"-cta-t",s.cta,w*.27,h*.823,w*.46,h*.035,small,paper,"900",{textAlign:"center",letterSpacing:1.4}));
      break;
    case 2: // cover campaign
      out.push(R(id+"-bg",0,0,w,h,ink),I(id+"-art",art,w*.56,0,w*.44,h),R(id+"-shape",w*.48,-h*.2,w*.23,h*1.4,accent,{rotation:8}),T(id+"-ey",s.eyebrow,w*.06,h*.15,w*.35,h*.06,small,bright,"900",{letterSpacing:2.2}),T(id+"-title",s.headline,w*.06,h*.31,w*.45,h*.33,title,paper,"900",{lineHeight:title*1.02}),T(id+"-sub",s.subhead,w*.06,h*.7,w*.38,h*.12,body,"#cbd5e1","500"),R(id+"-cta",w*.06,h*.84,w*.25,h*.09,paper,{borderRadius:999}),T(id+"-cta-t",s.cta,w*.06,h*.87,w*.25,h*.04,small,ink,"900",{textAlign:"center"}));
      break;
    case 3: // presentation cover
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-rail",0,0,w*.08,h,ink),I(id+"-art",art,w*.61,0,w*.39,h),T(id+"-ey",s.eyebrow,w*.14,h*.13,w*.34,h*.06,small,accent,"900",{letterSpacing:2.2}),T(id+"-title",s.headline,w*.14,h*.26,w*.4,h*.34,title,ink,"900"),L(id+"-rule",w*.14,h*.65,w*.11,7,accent),T(id+"-sub",s.subhead,w*.14,h*.7,w*.37,h*.1,body,"#475569","500"),T(id+"-cta",s.cta,w*.14,h*.86,w*.3,h*.05,small,ink,"900",{letterSpacing:1.4}));
      break;
    case 4: // flyer photo panel
      out.push(R(id+"-bg",0,0,w,h,deep),I(id+"-photo",art,0,0,w,h*.55),R(id+"-overlay",0,0,w,h*.55,ink,{opacity:.28}),R(id+"-paper",w*.06,h*.47,w*.88,h*.47,paper,{borderRadius:28,shadowColor:ink,shadowOpacity:.25,shadowRadius:24}),T(id+"-ey",s.eyebrow,w*.11,h*.535,w*.45,h*.035,small,accent,"900",{letterSpacing:2}),T(id+"-title",s.headline,w*.11,h*.61,w*.72,h*.14,title,ink,"900"),T(id+"-sub",s.subhead,w*.11,h*.77,w*.55,h*.075,body,"#475569","500"),R(id+"-cta",w*.68,h*.78,w*.2,h*.07,accent,{borderRadius:999}),T(id+"-cta-t",s.cta,w*.68,h*.801,w*.2,h*.03,small,paper,"900",{textAlign:"center"}));
      break;
    case 5: // poster art
      out.push(I(id+"-art",art,0,0,w,h),R(id+"-frame",w*.055,h*.045,w*.89,h*.91,"transparent",{borderWidth:4,borderColor:paper,borderRadius:10}),R(id+"-tag",w*.09,h*.08,w*.28,h*.055,paper,{borderRadius:999,opacity:.92}),T(id+"-ey",s.eyebrow,w*.09,h*.095,w*.28,h*.03,small,ink,"900",{textAlign:"center"}),T(id+"-title",s.headline,w*.09,h*.25,w*.82,h*.35,title,paper,"900",{textAlign:"center",lineHeight:title*.98}),T(id+"-sub",s.subhead,w*.18,h*.67,w*.64,h*.08,body,paper,"600",{textAlign:"center"}),T(id+"-cta",s.cta,w*.27,h*.85,w*.46,h*.04,small,paper,"900",{textAlign:"center",letterSpacing:2}));
      break;
    case 6: // card
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-left",0,0,w*.36,h,ink),R(id+"-accent",0,h*.72,w*.36,h*.28,accent),C(id+"-logo",w*.08,h*.13,w*.1,bright),T(id+"-logo-t","Y",w*.08,h*.16,w*.1,h*.08,title*.55,ink,"900",{textAlign:"center"}),T(id+"-name",s.headline,w*.44,h*.2,w*.46,h*.17,title,ink,"900"),T(id+"-role",s.subhead,w*.44,h*.42,w*.42,h*.07,body,accent,"800"),L(id+"-rule",w*.44,h*.55,w*.13,5,accent),T(id+"-contact","hello@yaposan.com\n+1 410 555 0148\nyaposan.com",w*.44,h*.61,w*.38,h*.19,body*.75,"#475569","600",{lineHeight:body*1.35}),T(id+"-tag",s.eyebrow,w*.06,h*.82,w*.24,h*.06,small,paper,"900",{textAlign:"center",letterSpacing:2}));
      break;
    case 7: // resume
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-sidebar",0,0,w*.31,h,ink),C(id+"-portrait",w*.085,h*.07,w*.14,soft),T(id+"-name",s.headline,w*.38,h*.08,w*.5,h*.09,title*.74,ink,"900"),T(id+"-role",s.subhead,w*.38,h*.18,w*.45,h*.045,body,accent,"800"),L(id+"-rule",w*.38,h*.25,w*.12,5,accent),T(id+"-profile-h","PROFILE",w*.38,h*.31,w*.22,h*.04,small,ink,"900",{letterSpacing:2}),T(id+"-profile","Strategic creative professional with a record of turning complex ideas into clear, useful experiences.",w*.38,h*.37,w*.48,h*.1,body*.78,"#475569","500"),T(id+"-exp-h","EXPERIENCE",w*.38,h*.52,w*.25,h*.04,small,ink,"900",{letterSpacing:2}),T(id+"-exp","2023—NOW   Senior Creative Lead\n2020—2023   Brand & Product Designer\n2017—2020   Visual Communication Designer",w*.38,h*.59,w*.5,h*.17,body*.76,"#334155","600",{lineHeight:body*1.25}),T(id+"-side","CONTACT\n\nBaltimore, MD\nhello@yaposan.com\n+1 410 555 0148\n\nSKILLS\n\nBrand Strategy\nEditorial Design\nCreative Direction\nDigital Products",w*.06,h*.29,w*.2,h*.48,body*.68,paper,"600",{lineHeight:body*1.18}));
      break;
    case 8: // brochure tri-fold
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-panel1",0,0,w/3,h,ink),I(id+"-photo",art,w/3,0,w/3,h*.48),R(id+"-panel3",w*2/3,0,w/3,h,soft),T(id+"-ey",s.eyebrow,w*.04,h*.08,w*.24,h*.04,small,bright,"900",{letterSpacing:2}),T(id+"-title",s.headline,w*.04,h*.18,w*.24,h*.3,title*.72,paper,"900"),T(id+"-sub",s.subhead,w*.04,h*.55,w*.24,h*.13,body*.82,"#cbd5e1","500"),R(id+"-cta",w*.04,h*.82,w*.2,h*.07,accent,{borderRadius:999}),T(id+"-cta-t",s.cta,w*.04,h*.842,w*.2,h*.03,small,paper,"900",{textAlign:"center"}),T(id+"-mid-h","A CLEARER WAY TO MOVE FORWARD",w*.37,h*.56,w*.26,h*.1,title*.45,ink,"900"),T(id+"-mid-b","Research-led thinking, purposeful design, and practical delivery—built into one coherent system.",w*.37,h*.69,w*.24,h*.13,body*.75,"#475569","500"),T(id+"-right-h","WHAT WE DELIVER",w*.71,h*.12,w*.22,h*.06,title*.4,ink,"900"),T(id+"-right-b","01  Strategy\n02  Identity\n03  Campaigns\n04  Digital\n05  Production",w*.71,h*.25,w*.2,h*.32,body*.82,ink,"700",{lineHeight:body*1.6}),C(id+"-orb",w*.76,h*.68,w*.13,accent));
      break;
    case 9: // newsletter
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-mast",0,0,w,h*.17,ink),T(id+"-ey",s.eyebrow,w*.06,h*.055,w*.25,h*.035,small,bright,"900",{letterSpacing:2}),T(id+"-brand","YAPOSAN JOURNAL",w*.06,h*.1,w*.55,h*.05,title*.42,paper,"900"),T(id+"-date","JULY 2026  •  ISSUE 08",w*.68,h*.105,w*.25,h*.03,small,paper,"800",{textAlign:"right"}),I(id+"-hero",art,w*.06,h*.23,w*.88,h*.3,{borderRadius:18}),T(id+"-title",s.headline,w*.06,h*.57,w*.62,h*.11,title*.62,ink,"900"),T(id+"-sub",s.subhead,w*.06,h*.69,w*.6,h*.08,body*.82,"#475569","500"),L(id+"-rule",w*.06,h*.8,w*.88,3,soft),T(id+"-col1","THE BRIEF\nThree shifts shaping modern creative teams and what they mean for your next project.",w*.06,h*.84,w*.27,h*.12,body*.7,ink,"600"),T(id+"-col2","IN PRACTICE\nHow one team simplified its process and improved quality at the same time.",w*.37,h*.84,w*.27,h*.12,body*.7,ink,"600"),T(id+"-col3","WHAT'S NEXT\nA practical checklist for planning the month ahead with confidence.",w*.68,h*.84,w*.27,h*.12,body*.7,ink,"600"));
      break;
    case 10: // invitation
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-frame1",w*.055,h*.045,w*.89,h*.91,"transparent",{borderWidth:3,borderColor:accent}),R(id+"-frame2",w*.075,h*.065,w*.85,h*.87,"transparent",{borderWidth:1,borderColor:bright}),C(id+"-fl1",w*.12,h*.12,w*.09,soft),C(id+"-fl2",w*.79,h*.12,w*.09,soft),T(id+"-ey",s.eyebrow,w*.2,h*.18,w*.6,h*.04,small,accent,"900",{textAlign:"center",letterSpacing:3}),T(id+"-title",s.headline,w*.14,h*.31,w*.72,h*.18,title,ink,"900",{textAlign:"center"}),T(id+"-sub",s.subhead,w*.2,h*.53,w*.6,h*.08,body,ink,"500",{textAlign:"center"}),L(id+"-rule",w*.37,h*.64,w*.26,3,accent),T(id+"-date","SATURDAY • SEPTEMBER 19 • 6:30 PM",w*.18,h*.7,w*.64,h*.04,small,ink,"900",{textAlign:"center",letterSpacing:1.5}),T(id+"-venue","THE GARDEN ROOM\n1200 CHARLES STREET • BALTIMORE",w*.2,h*.77,w*.6,h*.08,body*.72,"#475569","600",{textAlign:"center"}),T(id+"-cta",s.cta,w*.25,h*.88,w*.5,h*.04,small,accent,"900",{textAlign:"center",letterSpacing:2}));
      break;
    case 11: // certificate
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-outer",w*.035,h*.035,w*.93,h*.93,"transparent",{borderWidth:7,borderColor:ink}),R(id+"-inner",w*.055,h*.055,w*.89,h*.89,"transparent",{borderWidth:2,borderColor:accent}),C(id+"-seal",w*.44,h*.12,w*.12,accent),T(id+"-seal-t","Y",w*.44,h*.15,w*.12,h*.06,title*.5,paper,"900",{textAlign:"center"}),T(id+"-ey",s.eyebrow,w*.2,h*.29,w*.6,h*.04,small,accent,"900",{textAlign:"center",letterSpacing:3}),T(id+"-title",s.headline,w*.14,h*.39,w*.72,h*.1,title*.7,ink,"900",{textAlign:"center"}),T(id+"-sub",s.subhead,w*.18,h*.53,w*.64,h*.07,body*.85,"#475569","500",{textAlign:"center"}),T(id+"-name","ALEXANDRIA MORGAN",w*.18,h*.64,w*.64,h*.07,title*.5,ink,"800",{textAlign:"center"}),L(id+"-line1",w*.19,h*.82,w*.25,2,ink),L(id+"-line2",w*.56,h*.82,w*.25,2,ink),T(id+"-sig1","PROGRAM DIRECTOR",w*.19,h*.84,w*.25,h*.03,small,ink,"800",{textAlign:"center"}),T(id+"-sig2","JULY 30, 2026",w*.56,h*.84,w*.25,h*.03,small,ink,"800",{textAlign:"center"}));
      break;
    case 12: // menu
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-top",0,0,w,h*.22,ink),C(id+"-mark",w*.43,h*.07,w*.14,accent),T(id+"-mark-t","Y",w*.43,h*.105,w*.14,h*.06,title*.5,paper,"900",{textAlign:"center"}),T(id+"-title",s.headline,w*.12,h*.27,w*.76,h*.08,title*.65,ink,"900",{textAlign:"center"}),T(id+"-sub",s.subhead,w*.18,h*.37,w*.64,h*.05,body*.78,"#475569","500",{textAlign:"center"}),L(id+"-rule",w*.18,h*.45,w*.64,2,accent),T(id+"-left","STARTERS\n\nRoasted Tomato Soup ........ 9\nGarden Greens ................. 12\nCrispy Polenta .................. 14\nBurrata & Citrus ............... 16\n\nSIDES\n\nHerbed Potatoes ............... 8\nSeasonal Vegetables .......... 9",w*.1,h*.5,w*.36,h*.38,body*.72,ink,"600",{lineHeight:body*1.12}),T(id+"-right","MAINS\n\nWild Mushroom Pasta ....... 24\nGrilled Salmon ................ 29\nBraised Short Rib ............ 34\nMarket Vegetable Plate ..... 22\n\nDESSERT\n\nChocolate Torte ............... 11\nLemon Olive Oil Cake ....... 10",w*.54,h*.5,w*.36,h*.38,body*.72,ink,"600",{lineHeight:body*1.12}),T(id+"-foot",s.cta,w*.2,h*.92,w*.6,h*.035,small,accent,"900",{textAlign:"center",letterSpacing:2}));
      break;
    case 13: // price list
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-band",0,0,w,h*.2,deep),T(id+"-ey",s.eyebrow,w*.08,h*.06,w*.3,h*.035,small,bright,"900",{letterSpacing:2}),T(id+"-title",s.headline,w*.08,h*.105,w*.6,h*.07,title*.62,paper,"900"),T(id+"-sub",s.subhead,w*.08,h*.24,w*.7,h*.06,body*.82,ink,"500"),R(id+"-p1",w*.07,h*.36,w*.26,h*.46,"#fff",{borderRadius:20,borderWidth:2,borderColor:soft,shadowColor:ink,shadowOpacity:.12,shadowRadius:15}),R(id+"-p2",w*.37,h*.32,w*.26,h*.5,ink,{borderRadius:20,shadowColor:ink,shadowOpacity:.2,shadowRadius:18}),R(id+"-p3",w*.67,h*.36,w*.26,h*.46,"#fff",{borderRadius:20,borderWidth:2,borderColor:soft,shadowColor:ink,shadowOpacity:.12,shadowRadius:15}),T(id+"-p1t","STARTER\n\n$49\n\n1 concept\n2 revisions\nFinal files",w*.1,h*.42,w*.2,h*.3,body,ink,"700",{textAlign:"center",lineHeight:body*1.3}),T(id+"-p2t","PRO\n\n$129\n\n3 concepts\n5 revisions\nBrand toolkit\nPriority support",w*.4,h*.39,w*.2,h*.34,body,paper,"700",{textAlign:"center",lineHeight:body*1.3}),T(id+"-p3t","BUSINESS\n\n$249\n\nFull system\nUnlimited edits\nTeam handoff",w*.7,h*.42,w*.2,h*.3,body,ink,"700",{textAlign:"center",lineHeight:body*1.3}),R(id+"-cta",w*.37,h*.86,w*.26,h*.065,accent,{borderRadius:999}),T(id+"-cta-t",s.cta,w*.37,h*.879,w*.26,h*.03,small,paper,"900",{textAlign:"center"}));
      break;
    case 14: // proposal
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-corner",w*.58,0,w*.42,h,soft),I(id+"-photo",art,w*.64,h*.1,w*.28,h*.36,{borderRadius:18}),T(id+"-ey",s.eyebrow,w*.08,h*.1,w*.38,h*.035,small,accent,"900",{letterSpacing:2}),T(id+"-title",s.headline,w*.08,h*.19,w*.44,h*.22,title,ink,"900"),L(id+"-rule",w*.08,h*.47,w*.12,7,accent),T(id+"-sub",s.subhead,w*.08,h*.53,w*.43,h*.11,body,"#475569","500"),T(id+"-meta","PREPARED FOR\nNorthstar Ventures\n\nPREPARED BY\nYaposan Creative Studio\n\nDATE\nJuly 30, 2026",w*.08,h*.7,w*.42,h*.2,body*.72,ink,"700",{lineHeight:body*1.18}),R(id+"-badge",w*.69,h*.57,w*.18,h*.18,ink,{borderRadius:18}),T(id+"-badge-t","90 DAY\nGROWTH PLAN",w*.69,h*.615,w*.18,h*.08,body*.85,paper,"900",{textAlign:"center"}),T(id+"-cta",s.cta,w*.64,h*.87,w*.28,h*.04,small,ink,"900",{textAlign:"right",letterSpacing:1.5}));
      break;
    case 15: // worksheet
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-head",0,0,w,h*.18,ink),T(id+"-ey",s.eyebrow,w*.07,h*.055,w*.35,h*.035,small,bright,"900",{letterSpacing:2}),T(id+"-title",s.headline,w*.07,h*.1,w*.7,h*.06,title*.58,paper,"900"),T(id+"-date","WEEK OF: __________________",w*.62,h*.2,w*.3,h*.035,small,ink,"800",{textAlign:"right"}),T(id+"-focus","TOP 3 PRIORITIES",w*.07,h*.27,w*.35,h*.04,small,accent,"900",{letterSpacing:1.6}),...Array.from({length:3},(_,n)=>R(id+"-priority"+n,w*.07,h*(.34+n*.09),w*.86,h*.06,"#fff",{borderWidth:1,borderColor:soft,borderRadius:10})),T(id+"-actions","ACTION PLAN",w*.07,h*.65,w*.3,h*.04,small,accent,"900",{letterSpacing:1.6}),...Array.from({length:4},(_,n)=>R(id+"-action"+n,w*.07,h*(.72+n*.055),w*.86,h*.04,"#fff",{borderWidth:1,borderColor:soft,borderRadius:8})),T(id+"-foot",s.cta,w*.07,h*.96,w*.86,h*.025,small,ink,"900",{textAlign:"center",letterSpacing:1.5}));
      break;
    case 16: // planner
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-rail",0,0,w*.13,h,accent),T(id+"-title",s.headline,w*.19,h*.075,w*.62,h*.08,title*.58,ink,"900"),T(id+"-sub",s.subhead,w*.19,h*.16,w*.55,h*.04,body*.75,"#475569","500"),T(id+"-week","MON   TUE   WED   THU   FRI",w*.19,h*.25,w*.72,h*.04,small,ink,"900",{letterSpacing:1.1}),...Array.from({length:5},(_,c)=>R(id+"-col"+c,w*(.19+c*.145),h*.31,w*.125,h*.47,"#fff",{borderWidth:1,borderColor:soft,borderRadius:12})),T(id+"-notes","NOTES & WINS",w*.19,h*.84,w*.3,h*.04,small,accent,"900",{letterSpacing:1.5}),R(id+"-notes-box",w*.19,h*.89,w*.72,h*.07,"#fff",{borderWidth:1,borderColor:soft,borderRadius:12}),T(id+"-rail-t","WEEK\n01",w*.025,h*.08,w*.08,h*.17,title*.5,paper,"900",{textAlign:"center"}));
      break;
    case 17: // calendar
      out.push(R(id+"-bg",0,0,w,h,paper),R(id+"-top",0,0,w,h*.21,ink),T(id+"-ey",s.eyebrow,w*.07,h*.065,w*.3,h*.035,small,bright,"900",{letterSpacing:2}),T(id+"-title",s.headline,w*.07,h*.11,w*.6,h*.07,title*.58,paper,"900"),T(id+"-month","JANUARY",w*.72,h*.11,w*.21,h*.06,title*.42,accent,"900",{textAlign:"right"}),T(id+"-days","MON      TUE      WED      THU      FRI      SAT      SUN",w*.07,h*.27,w*.86,h*.035,small,ink,"900",{textAlign:"center"}),...Array.from({length:35},(_,n)=>R(id+"-d"+n,w*(.07+(n%7)*.123),h*(.34+Math.floor(n/7)*.108),w*.105,h*.085,"#fff",{borderWidth:1,borderColor:soft,borderRadius:8})),...Array.from({length:31},(_,n)=>T(id+"-n"+n,String(n+1),w*(.075+((n+2)%7)*.123),h*(.345+Math.floor((n+2)/7)*.108),w*.03,h*.025,small*.78,ink,"800")),R(id+"-accent",w*.73,h*.84,w*.2,h*.08,accent,{borderRadius:14}),T(id+"-accent-t",s.cta,w*.73,h*.865,w*.2,h*.03,small,paper,"900",{textAlign:"center"}));
      break;
    case 18: // quote
      out.push(I(id+"-art",art,0,0,w,h),R(id+"-shade",0,0,w,h,ink,{opacity:.62}),T(id+"-quote","“",w*.08,h*.14,w*.16,h*.16,title*1.8,bright,"900"),T(id+"-title",s.headline,w*.11,h*.3,w*.78,h*.3,title,paper,"900",{textAlign:"center",lineHeight:title*1.03}),L(id+"-rule",w*.37,h*.69,w*.26,5,accent),T(id+"-sub",s.subhead,w*.18,h*.76,w*.64,h*.07,body,paper,"500",{textAlign:"center"}),T(id+"-cta",s.cta,w*.25,h*.88,w*.5,h*.035,small,bright,"900",{textAlign:"center",letterSpacing:2}));
      break;
    default: // youtube
      out.push(I(id+"-art",art,0,0,w,h),R(id+"-shade",0,0,w,h,ink,{opacity:.32}),R(id+"-label",w*.05,h*.07,w*.23,h*.1,accent,{borderRadius:14}),T(id+"-ey",s.eyebrow,w*.05,h*.095,w*.23,h*.05,small,paper,"900",{textAlign:"center",letterSpacing:1.2}),T(id+"-title",s.headline,w*.05,h*.24,w*.58,h*.46,title*1.08,paper,"900",{lineHeight:title*1.02}),R(id+"-num",w*.72,h*.19,w*.2,h*.42,bright,{borderRadius:28,rotation:-4}),T(id+"-num-t","5",w*.72,h*.23,w*.2,h*.3,title*2.8,ink,"900",{textAlign:"center"}),R(id+"-cta",w*.05,h*.78,w*.32,h*.11,paper,{borderRadius:999}),T(id+"-cta-t",s.cta,w*.05,h*.815,w*.32,h*.05,small,ink,"900",{textAlign:"center"}));
  }
  return out;
}

const palettes:Palette[]=[
  ["#111827","#FFF9F2","#E85D3F","#F4D6CC","#F6C453","#3A2A38"],
  ["#0C1B33","#F7F9FC","#1FA2A6","#D9EEF0","#F0B35A","#173F5F"],
  ["#1A1A1A","#FAF7F0","#D3A64A","#E8DFCF","#F4C7C3","#3C2E3B"],
  ["#14213D","#FFFFFF","#FCA311","#E5E5E5","#2EC4B6","#1D3557"],
  ["#20302C","#F8F3E8","#C5654A","#D9D2C4","#E8BA66","#3E5C55"]
];

const specs:Spec[]=[
  {id:"p4363-social",category:"Social Media Posts",name:"Sunday Soft Launch Social Post",industry:"Lifestyle",format:"square",style:"editorial",palette:palettes[0],fonts:["Playfair Display","Inter"],headline:"A SLOWER WAY TO START",subhead:"A calm launch announcement designed for thoughtful brands.",eyebrow:"NEW COLLECTION",cta:"DISCOVER THE EDIT",layout:0,art:0},
  {id:"p4363-story",category:"Instagram Stories",name:"Midnight Botanical Instagram Story",industry:"Fashion",format:"story",style:"luxury",palette:palettes[4],fonts:["Cormorant Garamond","Montserrat"],headline:"MIDNIGHT BOTANICAL",subhead:"An atmospheric story for premium product launches.",eyebrow:"LIMITED RELEASE",cta:"SHOP THE DROP",layout:1,art:4},
  {id:"p4363-cover",category:"Facebook Covers",name:"Global Growth Facebook Cover",industry:"Business",format:"cover",style:"corporate",palette:palettes[1],fonts:["Montserrat","Inter"],headline:"IDEAS THAT MOVE BUSINESS FORWARD",subhead:"Strategy, creativity and technology for the next stage of growth.",eyebrow:"YAPOSAN STUDIO",cta:"EXPLORE OUR WORK",layout:2,art:0},
  {id:"p4363-presentation",category:"Presentations",name:"Future Systems Strategy Deck",industry:"Technology",format:"presentation",style:"modern",palette:palettes[3],fonts:["Montserrat","Inter"],headline:"THE FUTURE, CLEARLY PRESENTED",subhead:"A strategic narrative for leaders, teams and investors.",eyebrow:"ANNUAL STRATEGY 2026",cta:"YAPOSAN • CONFIDENTIAL",layout:3,art:2},
  {id:"p4363-flyer",category:"Flyers",name:"Modern Leadership Summit Flyer",industry:"Events",format:"letter",style:"editorial",palette:palettes[1],fonts:["Playfair Display","Inter"],headline:"LEAD WITH CLARITY",subhead:"A one-day summit for people building better organizations.",eyebrow:"BALTIMORE • OCTOBER 18",cta:"RESERVE YOUR SEAT",layout:4,art:0},
  {id:"p4363-poster",category:"Posters",name:"Culture in Motion Art Poster",industry:"Arts",format:"poster",style:"bold",palette:palettes[0],fonts:["Bebas Neue","Inter"],headline:"CULTURE IN MOTION",subhead:"An original exhibition of form, rhythm and color.",eyebrow:"GALLERY 08",cta:"SEPTEMBER 12—28",layout:5,art:3},
  {id:"p4363-card",category:"Business Cards",name:"Obsidian Creative Director Card",industry:"Creative",format:"card",style:"luxury",palette:palettes[2],fonts:["Cormorant Garamond","Inter"],headline:"MAYA BENNETT",subhead:"Creative Director • Brand Strategist",eyebrow:"YAPOSAN CREATIVE",cta:"yaposan.com",layout:6,art:1},
  {id:"p4363-resume",category:"Resumes",name:"Executive Product Designer Resume",industry:"Technology",format:"letter",style:"corporate",palette:palettes[1],fonts:["Montserrat","Inter"],headline:"JORDAN LEE",subhead:"Senior Product Designer",eyebrow:"SELECTED EXPERIENCE",cta:"PORTFOLIO AVAILABLE",layout:7,art:2},
  {id:"p4363-brochure",category:"Brochures",name:"Northstar Consulting Tri-Fold",industry:"Consulting",format:"presentation",style:"corporate",palette:palettes[1],fonts:["Montserrat","Inter"],headline:"DESIGNED FOR WHAT'S NEXT",subhead:"A complete consulting story built around clarity and confidence.",eyebrow:"NORTHSTAR CONSULTING",cta:"START A CONVERSATION",layout:8,art:0},
  {id:"p4363-newsletter",category:"Newsletters",name:"Yaposan Monthly Editorial Newsletter",industry:"Media",format:"letter",style:"editorial",palette:palettes[3],fonts:["Playfair Display","Inter"],headline:"THE MONTHLY BRIEF",subhead:"Ideas, projects and lessons from the creative front line.",eyebrow:"YAPOSAN JOURNAL",cta:"READ • SAVE • SHARE",layout:9,art:2},
  {id:"p4363-invite",category:"Invitations",name:"Garden Room Evening Invitation",industry:"Events",format:"letter",style:"elegant",palette:palettes[0],fonts:["Cormorant Garamond","Montserrat"],headline:"AN EVENING TO REMEMBER",subhead:"Dinner, music and good conversation in the garden room.",eyebrow:"YOU'RE INVITED",cta:"KINDLY RSVP BY SEPTEMBER 5",layout:10,art:4},
  {id:"p4363-certificate",category:"Certificates",name:"Executive Excellence Certificate",industry:"Education",format:"cover",style:"elegant",palette:palettes[2],fonts:["Playfair Display","Inter"],headline:"CERTIFICATE OF EXCELLENCE",subhead:"Presented in recognition of exceptional leadership and contribution.",eyebrow:"YAPOSAN INSTITUTE",cta:"AUTHORIZED SIGNATURE",layout:11,art:1},
  {id:"p4363-menu",category:"Menu Templates",name:"Harvest Table Seasonal Menu",industry:"Restaurant",format:"letter",style:"elegant",palette:palettes[4],fonts:["Cormorant Garamond","Inter"],headline:"HARVEST TABLE",subhead:"Seasonal cooking, honest ingredients and thoughtful hospitality.",eyebrow:"AUTUMN MENU",cta:"CHEF'S SELECTION • 2026",layout:12,art:4},
  {id:"p4363-price",category:"Price Lists",name:"Creative Studio Service Pricing",industry:"Creative",format:"letter",style:"modern",palette:palettes[3],fonts:["Montserrat","Inter"],headline:"SERVICES & PRICING",subhead:"Clear options for brands at every stage.",eyebrow:"YAPOSAN CREATIVE STUDIO",cta:"CHOOSE PRO",layout:13,art:2},
  {id:"p4363-proposal",category:"Proposals",name:"Northstar 90-Day Growth Proposal",industry:"Consulting",format:"letter",style:"corporate",palette:palettes[1],fonts:["Montserrat","Inter"],headline:"PROJECT PROPOSAL",subhead:"A focused ninety-day plan to improve clarity, conversion and growth.",eyebrow:"NORTHSTAR VENTURES",cta:"CONFIDENTIAL PROPOSAL",layout:14,art:0},
  {id:"p4363-worksheet",category:"Worksheets",name:"Weekly Goal Setting Worksheet",industry:"Education",format:"letter",style:"minimal",palette:palettes[1],fonts:["Montserrat","Inter"],headline:"WEEKLY GOAL SETTING",subhead:"Turn priorities into a practical plan.",eyebrow:"FOCUS WORKSHEET",cta:"FOCUS • ACT • REVIEW",layout:15,art:1},
  {id:"p4363-planner",category:"Planners",name:"Calm Week Productivity Planner",industry:"Lifestyle",format:"letter",style:"minimal",palette:palettes[0],fonts:["Playfair Display","Inter"],headline:"PLAN WITH PURPOSE",subhead:"A balanced weekly view for priorities, appointments and progress.",eyebrow:"WEEKLY PLANNER",cta:"SMALL STEPS, CONSISTENTLY",layout:16,art:4},
  {id:"p4363-calendar",category:"Calendars",name:"Modern January 2026 Calendar",industry:"Business",format:"letter",style:"minimal",palette:palettes[3],fonts:["Montserrat","Inter"],headline:"2026 CALENDAR",subhead:"A clean monthly system for projects, deadlines and milestones.",eyebrow:"YAPOSAN PLANNING",cta:"MONTHLY FOCUS",layout:17,art:2},
  {id:"p4363-quote",category:"Quotes",name:"Create What Should Exist Quote Card",industry:"Lifestyle",format:"square",style:"luxury",palette:palettes[4],fonts:["Cormorant Garamond","Inter"],headline:"CREATE WHAT YOU WISH EXISTED",subhead:"A reminder for people building something meaningful.",eyebrow:"WORDS TO KEEP",cta:"— YAPOSAN STUDIO",layout:18,art:0},
  {id:"p4363-youtube",category:"YouTube Thumbnails",name:"Five Ideas That Work YouTube Thumbnail",industry:"Education",format:"cover",style:"bold",palette:palettes[0],fonts:["Bebas Neue","Inter"],headline:"IDEAS THAT ACTUALLY WORK",subhead:"High clarity, strong contrast and a simple promise.",eyebrow:"CREATOR SERIES",cta:"WATCH NOW",layout:19,art:3}
];

function make(s:Spec):ProfessionalTemplate{
  const d=dims(s.format);
  const pages=[P(s.id+"-page",d.w,d.h,s.palette[1],elementsFor(s,d.w,d.h))];
  if(s.category==="Presentations"){
    const [ink,paper,accent,soft,bright]=s.palette;
    pages.push(P(s.id+"-page2",d.w,d.h,paper,[R(s.id+"-2bg",0,0,d.w,d.h,paper),T(s.id+"-2ey","01 • OPPORTUNITY",d.w*.08,d.h*.1,d.w*.4,d.h*.05,24,accent,"900",{letterSpacing:2}),T(s.id+"-2title","A market ready for a clearer creative platform",d.w*.08,d.h*.21,d.w*.64,d.h*.18,58,ink,"900"),R(s.id+"-2card1",d.w*.08,d.h*.49,d.w*.25,d.h*.29,"#fff",{borderRadius:24,borderWidth:2,borderColor:soft}),R(s.id+"-2card2",d.w*.37,d.h*.49,d.w*.25,d.h*.29,ink,{borderRadius:24}),R(s.id+"-2card3",d.w*.66,d.h*.49,d.w*.25,d.h*.29,accent,{borderRadius:24}),T(s.id+"-2n1","68%",d.w*.11,d.h*.56,d.w*.19,d.h*.08,54,ink,"900",{textAlign:"center"}),T(s.id+"-2n2","3.4×",d.w*.4,d.h*.56,d.w*.19,d.h*.08,54,paper,"900",{textAlign:"center"}),T(s.id+"-2n3","42K",d.w*.69,d.h*.56,d.w*.19,d.h*.08,54,paper,"900",{textAlign:"center"}),T(s.id+"-2l1","FASTER CREATION",d.w*.11,d.h*.68,d.w*.19,d.h*.04,18,ink,"900",{textAlign:"center"}),T(s.id+"-2l2","MORE OUTPUT",d.w*.4,d.h*.68,d.w*.19,d.h*.04,18,paper,"900",{textAlign:"center"}),T(s.id+"-2l3","ACTIVE USERS",d.w*.69,d.h*.68,d.w*.19,d.h*.04,18,paper,"900",{textAlign:"center"})],"Opportunity"));
  }
  return {metadata:{id:s.id,name:s.name,category:mapCategory(s.category),subcategory:s.category,industry:s.industry,description:`A hand-built flagship ${s.category.toLowerCase()} template with original art direction, production-sized pages, refined typography and fully editable elements.`,tags:[s.category.toLowerCase(),s.style,"flagship","hand-built","","premium quality","editable"],pageSize:d.size,orientation:d.orientation,previewColor:s.palette[0],palette:[...s.palette],fonts:s.fonts,author:"Yaposan Design Studio",version:"43.6.3",editable:true,featured:true,trending:true,access:"premium",createdAt:"2026-07-30T00:00:00.000Z",updatedAt:"2026-07-30T00:00:00.000Z",style:s.style as any,qualityScore:100,masterTemplateId:s.id},pages};
}

export const PHASE4363_FLAGSHIP_20=specs.map(make);
export const PHASE4363_BY_CATEGORY=Object.fromEntries(PHASE4363_FLAGSHIP_20.map(t=>[t.metadata.subcategory,t])) as Record<Flagship20Category,ProfessionalTemplate>;
export function phase4363Audit(){
  const pages=PHASE4363_FLAGSHIP_20.flatMap(t=>t.pages);
  const elements=pages.flatMap(p=>p.elements);
  return {templates:PHASE4363_FLAGSHIP_20.length,categories:new Set(PHASE4363_FLAGSHIP_20.map(t=>t.metadata.subcategory)).size,editable:PHASE4363_FLAGSHIP_20.every(t=>t.metadata.editable),minimumQuality:Math.min(...PHASE4363_FLAGSHIP_20.map(t=>t.metadata.qualityScore??0)),averageElements:Math.round(elements.length/pages.length),withImages:PHASE4363_FLAGSHIP_20.filter(t=>t.pages.some(p=>p.elements.some(e=>e.type==="image"))).length,multiPage:PHASE4363_FLAGSHIP_20.filter(t=>t.pages.length>1).length};
}

import type { PublisherElement, PublisherProject } from "../types/publisher";

export type FontPairing = { id:string; name:string; heading:string; body:string; description:string };
export const FONT_PAIRINGS: FontPairing[] = [
  {id:"modern",name:"Modern Editorial",heading:"Montserrat",body:"Merriweather",description:"Strong geometric headings with highly readable serif body copy."},
  {id:"classic",name:"Classic Publication",heading:"Playfair Display",body:"Lato",description:"Elegant display headlines balanced by a clean sans serif."},
  {id:"friendly",name:"Friendly Brand",heading:"Poppins",body:"Open Sans",description:"Approachable rounded headings and neutral body text."},
  {id:"compact",name:"Compact Report",heading:"Oswald",body:"Roboto",description:"Space-efficient headings with dependable document text."},
];
export const normalizeProfessionalTypography=(e:PublisherElement):PublisherElement=>({...e,opticalAlignment:e.opticalAlignment??false,textWrapMode:e.textWrapMode??"none",textWrapPadding:Math.max(0,Math.min(100,e.textWrapPadding??8))});
export function typographyIssues(project:PublisherProject){const issues:string[]=[];const embedded=new Set(Object.keys(project.embeddedFonts??{}));project.pages.forEach(page=>page.elements.forEach(e=>{if(e.type!=="text")return;if(!e.fontFamily)issues.push(`${page.name}: ${e.name} has no font family.`);if((e.fontFamily??"").includes("Custom")&&!embedded.has(e.fontFamily!))issues.push(`${page.name}: ${e.fontFamily} is not embedded.`);if((e.fontSize??0)<6)issues.push(`${page.name}: ${e.name} uses text smaller than 6 pt.`);if((e.tracking??0)>20)issues.push(`${page.name}: ${e.name} has extreme tracking.`);}));return issues;}
export function replaceTypography(project:PublisherProject,find:Partial<PublisherElement>,replace:Partial<PublisherElement>){let count=0;const pages=project.pages.map(page=>({...page,elements:page.elements.map(e=>{if(e.type!=="text")return e;const matches=Object.entries(find).every(([k,v])=>v===undefined||(e as any)[k]===v);if(!matches)return e;count++;return {...e,...replace};})}));return {project:{...project,pages,updatedAt:Date.now()},count};}
export function saveTypographyStyle(project:PublisherProject,id:string,name:string,updates:Partial<PublisherElement>){return {...project,updatedAt:Date.now(),typographyStyles:{...(project.typographyStyles??{}),[id]:{name,updates}}};}
export function deleteTypographyStyle(project:PublisherProject,id:string){const next={...(project.typographyStyles??{})};delete next[id];return {...project,updatedAt:Date.now(),typographyStyles:next};}
export function applyTypographyStyle(element:PublisherElement,project:PublisherProject,id:string){const style=project.typographyStyles?.[id];return style?{...element,...style.updates,professionalStyleId:id}:element;}
export function applyFontPairing(project:PublisherProject,pairingId:string){const pairing=FONT_PAIRINGS.find(x=>x.id===pairingId);if(!pairing)return project;return {...project,updatedAt:Date.now(),pages:project.pages.map(page=>({...page,elements:page.elements.map(e=>e.type!=="text"?e:{...e,fontFamily:(e.fontSize??0)>=28?pairing.heading:pairing.body})}))};}

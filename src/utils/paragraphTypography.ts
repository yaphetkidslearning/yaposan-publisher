import type { PublisherElement } from "../types/publisher";
export type ParagraphStylePreset={id:string;name:string;updates:Partial<PublisherElement>};
export const PARAGRAPH_STYLE_PRESETS:ParagraphStylePreset[]=[
{id:"body",name:"Body",updates:{textAlign:"left",lineHeight:1.25,paragraphSpacingAfter:8,columnCount:1,listType:"none"}},
{id:"lead",name:"Lead",updates:{textAlign:"left",lineHeight:1.4,paragraphSpacingAfter:14,firstLineIndent:0}},
{id:"quote",name:"Quote",updates:{textAlign:"left",lineHeight:1.35,leftIndent:24,rightIndent:24,italic:true}},
{id:"newsletter",name:"Newsletter",updates:{textAlign:"justify",lineHeight:1.2,columnCount:2,columnGap:18,hyphenation:true}},
{id:"compact",name:"Compact",updates:{lineHeight:1.05,paragraphSpacingAfter:2}},
];
export const clampParagraph=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:0));
export function normalizeParagraphTypography(e:PublisherElement):PublisherElement{return {...e,lineHeight:clampParagraph(e.lineHeight??1.2,.7,4),paragraphSpacingBefore:clampParagraph(e.paragraphSpacingBefore??0,0,200),paragraphSpacingAfter:clampParagraph(e.paragraphSpacingAfter??0,0,200),firstLineIndent:clampParagraph(e.firstLineIndent??0,-200,400),hangingIndent:clampParagraph(e.hangingIndent??0,0,200),leftIndent:clampParagraph(e.leftIndent??0,0,400),rightIndent:clampParagraph(e.rightIndent??0,0,400),tabStops:(e.tabStops??[]).filter(Number.isFinite).map(v=>clampParagraph(v,0,1000)).sort((a,b)=>a-b),listType:e.listType??"none",listStart:Math.max(1,Math.round(e.listStart??1)),dropCapLines:Math.round(clampParagraph(e.dropCapLines??0,0,10)),hyphenation:e.hyphenation??false,justification:e.justification??"normal",columnCount:Math.round(clampParagraph(e.columnCount??1,1,6)),columnGap:clampParagraph(e.columnGap??18,0,100),baselineGrid:e.baselineGrid??false,baselineGridSpacing:clampParagraph(e.baselineGridSpacing??12,4,100)};}
export function applyParagraphPreset(e:PublisherElement,id:string){const p=PARAGRAPH_STYLE_PRESETS.find(x=>x.id===id);return normalizeParagraphTypography({...e,...(p?.updates??{}),paragraphStyleId:p?.id});}
export function formatListText(text:string,type:PublisherElement["listType"],start=1){if(!type||type==="none")return text;return text.split(/\r?\n/).map((line,i)=>line.trim()?`${type==="bullet"?"•":`${start+i}.`} ${line.replace(/^(?:•|\d+[.)])\s*/,"")}`:line).join("\n");}
export function splitTextColumns(text:string,count:number){const c=Math.max(1,Math.round(count));if(c===1)return[text];const words=text.split(/\s+/);const out=Array.from({length:c},()=>[] as string[]);const size=Math.ceil(words.length/c);for(let i=0;i<c;i++)out[i]=words.slice(i*size,(i+1)*size);return out.map(x=>x.join(" "));}

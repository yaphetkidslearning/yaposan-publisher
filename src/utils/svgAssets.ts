import * as QRCode from "qrcode";
import type { PublisherElement } from "../types/publisher";

export function recolorSvg(svg:string, fillColor:string, strokeColor:string, strokeWidth=3){
  let next=svg.replace(/currentColor/g, strokeColor);
  if (/fill="none"/.test(next)) next=next.replace(/stroke-width="[^"]*"/, `stroke-width="${strokeWidth}"`);
  else next=next.replace(/fill="(?!none)[^"]*"/g, (m)=>m.includes("white")||m.includes("#111827")?m:`fill="${fillColor}"`);
  return next;
}
export function svgDataUri(svg:string){return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;}
export function parseSvgViewBox(svg:string){return svg.match(/viewBox=["']([^"']+)["']/i)?.[1] ?? "0 0 64 64";}
export function svgToElement(svg:string, name:string, zIndex:number, kind:PublisherElement["assetKind"]="custom", assetId?:string, size:"small"|"medium"|"large"|"original"="medium"):PublisherElement{
  const dimensions = size === "small" ? {width:96,height:96} : size === "large" ? {width:300,height:300} : size === "original" ? {width:180,height:180} : {width:180,height:180};
  return {id:`svg-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name,type:"svg",x:120,y:130,width:dimensions.width,height:dimensions.height,rotation:0,zIndex,opacity:1,fillColor:"#14B8A6",borderColor:"#172033",borderWidth:3,svgMarkup:svg,svgOriginalMarkup:svg,svgFill:"#14B8A6",svgStroke:"#172033",svgStrokeWidth:3,svgViewBox:parseSvgViewBox(svg),assetId,assetKind:kind,editableVector:true,imageUri:svgDataUri(svg),imageFit:"contain"};
}
export async function makeQrSvg(value:string){return QRCode.toString(value,{type:"svg",margin:1,color:{dark:"#111827",light:"#FFFFFF"},errorCorrectionLevel:"M"});}

const CODE128_PATTERNS=["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];
export function makeCode128Svg(value:string){
  const text=(value||"1234567890").slice(0,80).replace(/[^\x20-\x7E]/g,""); const codes=[104,...[...text].map(c=>c.charCodeAt(0)-32)]; let sum=104; codes.slice(1).forEach((c,i)=>sum+=c*(i+1)); codes.push(sum%103,106);
  let x=10; const bars:string[]=[]; let black=true; for(const code of codes){for(const ch of CODE128_PATTERNS[code]){const w=Number(ch)*2;if(black)bars.push(`<rect x="${x}" y="8" width="${w}" height="56" fill="#111827"/>`);x+=w;black=!black;}}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x+10} 84"><rect width="100%" height="100%" fill="white"/>${bars.join("")}<text x="${(x+10)/2}" y="78" text-anchor="middle" font-family="Arial" font-size="10" fill="#111827">${text.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</text></svg>`;
}
function attr(tag:string,name:string, fallback="0"){return tag.match(new RegExp(`${name}=["']([^"']+)["']`,"i"))?.[1]??fallback;}
function presentationAttributes(tag:string){
 const names=["fill","stroke","stroke-width","stroke-linecap","stroke-linejoin","fill-rule","opacity","transform","class","style"];
 return names.map((name)=>{const value=tag.match(new RegExp(`${name}=["']([^"']+)["']`,"i"))?.[1];return value===undefined?"":` ${name}="${value.replace(/"/g,"&quot;")}"`;}).join("");
}
function primitivePath(tag:string,kind:string){
 const attrs=presentationAttributes(tag);
 if(kind==="path")return `<path d="${attr(tag,"d","")}"${attrs}/>`;
 if(kind==="rect"){const x=+attr(tag,"x"),y=+attr(tag,"y"),w=+attr(tag,"width"),h=+attr(tag,"height"),rx=+attr(tag,"rx");const d=rx?`M${x+rx} ${y}H${x+w-rx}Q${x+w} ${y} ${x+w} ${y+rx}V${y+h-rx}Q${x+w} ${y+h} ${x+w-rx} ${y+h}H${x+rx}Q${x} ${y+h} ${x} ${y+h-rx}V${y+rx}Q${x} ${y} ${x+rx} ${y}Z`:`M${x} ${y}H${x+w}V${y+h}H${x}Z`;return `<path d="${d}"${attrs}/>`;}
 if(kind==="circle"){const cx=+attr(tag,"cx"),cy=+attr(tag,"cy"),r=+attr(tag,"r");return `<path d="M${cx-r} ${cy}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0"${attrs}/>`;}
 if(kind==="ellipse"){const cx=+attr(tag,"cx"),cy=+attr(tag,"cy"),rx=+attr(tag,"rx"),ry=+attr(tag,"ry");return `<path d="M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0"${attrs}/>`;}
 if(kind==="line")return `<path d="M${attr(tag,"x1")} ${attr(tag,"y1")}L${attr(tag,"x2")} ${attr(tag,"y2")}"${attrs}/>`;
 if(kind==="polygon"||kind==="polyline"){const pts=attr(tag,"points","").trim().replace(/[,\s]+/g," ");if(!pts)return "";const nums=pts.split(" ");let d=`M${nums[0]} ${nums[1]}`;for(let i=2;i<nums.length;i+=2)d+=`L${nums[i]} ${nums[i+1]}`;if(kind==="polygon")d+="Z";return `<path d="${d}"${attrs}/>`;}
 return "";
}
function extractDefs(svg:string){return [...svg.matchAll(/<defs\b[^>]*>[\s\S]*?<\/defs>/gi)].map((match)=>match[0]).join("");}
export function svgToEditableShapes(svg:string, base:PublisherElement):PublisherElement[] {
 const supported=[...svg.matchAll(/<(path|rect|circle|ellipse|line|polygon|polyline)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)/gi)];
 if(!supported.length)return [];
 const defs=extractDefs(svg); const viewBox=parseSvgViewBox(svg);
 return supported.map((match,index)=>{
   const markup=primitivePath(match[0],match[1].toLowerCase());
   const wrapped=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${defs}${markup}</svg>`;
   return {...base,id:`${base.id}-vector-${index+1}-${Math.random().toString(36).slice(2,6)}`,name:`${base.name} Vector ${index+1}`,zIndex:base.zIndex+index/100,type:"svg",svgMarkup:wrapped,svgOriginalMarkup:wrapped,svgViewBox:viewBox,imageUri:svgDataUri(wrapped),editableVector:true};
 });
}
export function svgToEditableShape(svg:string, base:PublisherElement):PublisherElement | null{return svgToEditableShapes(svg,base)[0]??null;}

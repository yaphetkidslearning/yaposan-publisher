import type { PublisherElement, PublisherPage } from "../types/publisher";

export type PageSvgOptions = {
  hyperlinks?: boolean;
  preserveText?: boolean;
  preserveGradients?: boolean;
};

const esc=(v:string)=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const attr=(v:string)=>esc(v);
function transform(e:PublisherElement){const cx=e.x+e.width/2,cy=e.y+e.height/2;const flipX=e.flipHorizontal?-1:1,flipY=e.flipVertical?-1:1;return `translate(${cx} ${cy}) rotate(${e.rotation||0}) scale(${flipX} ${flipY}) translate(${-e.width/2} ${-e.height/2})`;}
function linkWrap(e:PublisherElement, body:string, enabled=true){return enabled&&e.hyperlink?`<a href="${attr(e.hyperlink)}" target="_blank">${body}</a>`:body;}
function gradient(e:PublisherElement, defs:string[], enabled=true){
  if(!enabled||!e.fillGradient)return e.fillColor||"none";
  const id=`gradient-${e.id.replace(/[^a-z0-9_-]/gi,'')}`;
  if(e.fillGradient.type==='radial')defs.push(`<radialGradient id="${id}"><stop offset="0%" stop-color="${attr(e.fillGradient.startColor)}"/><stop offset="100%" stop-color="${attr(e.fillGradient.endColor)}"/></radialGradient>`);
  else {const a=(e.fillGradient.angle||0)*Math.PI/180,x=Math.cos(a),y=Math.sin(a);defs.push(`<linearGradient id="${id}" x1="${50-50*x}%" y1="${50-50*y}%" x2="${50+50*x}%" y2="${50+50*y}%"><stop offset="0%" stop-color="${attr(e.fillGradient.startColor)}"/><stop offset="100%" stop-color="${attr(e.fillGradient.endColor)}"/></linearGradient>`);}
  return `url(#${id})`;
}
function textSvg(e:PublisherElement, common:string){
  const size=e.fontSize||24,lh=size*(e.lineHeight||1.2),lines=(e.text||'').split('\n');
  const anchor=e.textAlign==='center'?'middle':e.textAlign==='right'?'end':'start';
  const x=e.textAlign==='center'?e.width/2:e.textAlign==='right'?e.width:0;
  const deco=[e.underline?'underline':''].filter(Boolean).join(' ');
  const tspans=lines.map((line,i)=>`<tspan x="${x}" dy="${i===0?size:lh}">${esc(line||' ')}</tspan>`).join('');
  return `<g ${common}><text x="${x}" y="0" font-family="${attr(e.fontFamily||'Helvetica')}" font-size="${size}" font-weight="${e.fontWeight||400}" font-style="${e.italic?'italic':'normal'}" text-anchor="${anchor}" fill="${attr(e.textColor||e.fillColor||'#111827')}" letter-spacing="${e.letterSpacing||0}" text-decoration="${deco}" xml:space="preserve">${tspans}</text></g>`;
}
function elementSvg(e:PublisherElement,defs:string[],o:PageSvgOptions):string {
 if(e.hidden)return ""; const opacity=e.opacity??1; const common=`transform="${transform(e)}" opacity="${opacity}"`;
 let body='';
 if(e.type==="svg"&&e.svgMarkup){const inner=e.svgMarkup.replace(/^[\s\S]*?<svg[^>]*>/i,"").replace(/<\/svg>\s*$/i,"");body=`<g ${common}><svg width="${e.width}" height="${e.height}" viewBox="${attr(e.svgViewBox||"0 0 64 64")}" preserveAspectRatio="xMidYMid meet">${inner}</svg></g>`;return linkWrap(e,body,o.hyperlinks!==false);}
 if(e.type==="text"){body=textSvg(e,common);return linkWrap(e,body,o.hyperlinks!==false);}
 if(e.type==="image"&&e.imageUri){body=`<g ${common}><image href="${attr(e.imageUri)}" width="${e.width}" height="${e.height}" preserveAspectRatio="xMidYMid ${e.imageFit==='contain'?'meet':e.imageFit==='stretch'?'none':'slice'}"/></g>`;return linkWrap(e,body,o.hyperlinks!==false);}
 const fill=gradient(e,defs,o.preserveGradients!==false),stroke=e.borderColor||"none",sw=e.borderWidth||0;
 if(e.type==="circle")body=`<g ${common}><ellipse cx="${e.width/2}" cy="${e.height/2}" rx="${e.width/2}" ry="${e.height/2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>`;
 else if(e.type==="triangle")body=`<g ${common}><polygon points="${e.width/2},0 ${e.width},${e.height} 0,${e.height}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>`;
 else if(e.type==="star"){const pts=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2===0?Math.min(e.width,e.height)/2:Math.min(e.width,e.height)/4;return `${e.width/2+Math.cos(a)*r},${e.height/2+Math.sin(a)*r}`}).join(' ');body=`<g ${common}><polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>`;}
 else if(e.type==="arrow")body=`<g ${common}><polygon points="0,${e.height*.3} ${e.width*.65},${e.height*.3} ${e.width*.65},0 ${e.width},${e.height/2} ${e.width*.65},${e.height} ${e.width*.65},${e.height*.7} 0,${e.height*.7}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>`;
 else if(e.type==="line")body=`<g ${common}><line x1="0" y1="${e.height/2}" x2="${e.width}" y2="${e.height/2}" stroke="${stroke}" stroke-width="${Math.max(1,sw)}"/></g>`;
 else body=`<g ${common}><rect width="${e.width}" height="${e.height}" rx="${e.borderRadius||0}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>`;
 return linkWrap(e,body,o.hyperlinks!==false);
}
export function pageToSvg(page:PublisherPage,o:PageSvgOptions={}):string {const defs:string[]=[];const body=[...page.elements].sort((a,b)=>a.zIndex-b.zIndex).map(e=>elementSvg(e,defs,o)).join("");return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}">${defs.length?`<defs>${defs.join('')}</defs>`:''}<rect width="100%" height="100%" fill="${page.backgroundColor||"#fff"}"/>${body}</svg>`;}

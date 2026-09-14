import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type VectorNodeKind = "corner" | "smooth" | "symmetric";
export type ProfessionalVectorNode = { x:number; y:number; inX?:number; inY?:number; outX?:number; outY?:number; kind?:VectorNodeKind; pressure?:number };
export type VectorBooleanOperation = "union" | "subtract" | "intersect" | "exclude" | "divide" | "combine";
export type VectorAuditItem = { id:string; severity:"error"|"warning"|"info"; message:string; elementId?:string; pageId?:string };
type E = PublisherElement & Record<string, any>;
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
const nodesOf=(e:E):ProfessionalVectorNode[]=>clone((e.vectorNodes??e.vectorPoints??e.points??[]) as ProfessionalVectorNode[]);
const isVector=(e:E):boolean=>{
  const shapeKind = typeof e.shapeKind === "string" ? e.shapeKind : "";
  const elementType = String(e.type);
  return ["freehand","bezier-path","brush-stroke","custom-path","compound-path","imported-svg"].includes(shapeKind) || Boolean(e.editableVector) || elementType === "svg";
};
const box=(items:E[])=>({left:Math.min(...items.map(i=>i.x)),top:Math.min(...items.map(i=>i.y)),right:Math.max(...items.map(i=>i.x+i.width)),bottom:Math.max(...items.map(i=>i.y+i.height))});
const dist=(a:ProfessionalVectorNode,b:ProfessionalVectorNode)=>Math.hypot(a.x-b.x,a.y-b.y);

export function normalizeVectorElement(element:E):E{
  const nodes=nodesOf(element);
  return {...element,editableVector:true,vectorNodes:nodes,vectorPoints:nodes,vectorClosed:Boolean(element.vectorClosed),vectorWinding:element.vectorWinding??"nonzero",strokeCap:element.strokeCap??"round",strokeJoin:element.strokeJoin??"round",miterLimit:element.miterLimit??4};
}
export function closeVectorPath(element:E,closed=true):E{return {...normalizeVectorElement(element),vectorClosed:closed};}
export function reverseVectorPath(element:E):E{
  const nodes=nodesOf(element).reverse().map(n=>({...n,inX:n.outX,inY:n.outY,outX:n.inX,outY:n.inY}));
  return {...normalizeVectorElement(element),vectorNodes:nodes,vectorPoints:nodes,vectorDirection:element.vectorDirection==="reverse"?"forward":"reverse"};
}
export function setAllNodeKinds(element:E,kind:VectorNodeKind):E{
  const nodes=nodesOf(element).map(n=>({...n,kind})); return {...normalizeVectorElement(element),vectorNodes:nodes,vectorPoints:nodes};
}
export function simplifyVectorPath(element:E,tolerance=2):E{
  const input=nodesOf(element); if(input.length<3)return normalizeVectorElement(element);
  const out=[input[0]]; for(let i=1;i<input.length-1;i++){const a=out[out.length-1],b=input[i],c=input[i+1]; const area=Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)); if(dist(a,b)>=tolerance&&area>=tolerance)out.push(b);} out.push(input[input.length-1]);
  return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorSimplifyTolerance:tolerance};
}
export function smoothVectorPath(element:E,strength=.35):E{
  const input=nodesOf(element); if(input.length<3)return normalizeVectorElement(element);
  const out=input.map((n,i)=>{if(i===0||i===input.length-1)return {...n}; const prev=input[i-1],next=input[i+1]; const dx=(next.x-prev.x)*strength,dy=(next.y-prev.y)*strength; return {...n,kind:"smooth" as const,inX:n.x-dx,inY:n.y-dy,outX:n.x+dx,outY:n.y+dy};});
  return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out};
}
export function outlineStroke(element:E):E{
  const width=Math.max(1,Number(element.borderWidth??1)); return {...normalizeVectorElement(element),name:`${element.name} Outline`,shapeKind:"compound-path",strokeOutlined:true,strokeSourceWidth:width,fillColor:element.borderColor??element.fillColor??"#0F172A",borderColor:"transparent",borderWidth:0,compoundSources:[clone(element)]};
}
export function createCompoundVector(elements:E[],ids:string[],operation:VectorBooleanOperation):{elements:E[];created:E|null}{
  const selected=elements.filter(e=>ids.includes(e.id)); if(selected.length<2)return {elements,created:null}; const b=box(selected); const top=Math.max(...elements.map(e=>e.zIndex));
  const created:E={...normalizeVectorElement(selected[0]),id:`vector-${operation}-${Date.now()}`,name:`${operation[0].toUpperCase()+operation.slice(1)} Vector`,x:b.left,y:b.top,width:Math.max(1,b.right-b.left),height:Math.max(1,b.bottom-b.top),zIndex:top+1,shapeKind:"compound-path",booleanOperation:operation,compoundSources:selected.map(e=>({...clone(e),x:e.x-b.left,y:e.y-b.top})),editableVector:true,locked:false};
  return {elements:[...elements.filter(e=>!ids.includes(e.id)),created].map((e,i)=>({...e,zIndex:i+1})),created};
}
export function vectorPathData(element:E):string{
  const n=nodesOf(element); if(!n.length)return ""; let d=`M ${n[0].x} ${n[0].y}`; for(let i=1;i<n.length;i++){const a=n[i-1],b=n[i]; if(a.outX!=null||b.inX!=null)d+=` C ${a.outX??a.x} ${a.outY??a.y}, ${b.inX??b.x} ${b.inY??b.y}, ${b.x} ${b.y}`; else d+=` L ${b.x} ${b.y}`;} if(element.vectorClosed)d+=" Z"; return d;
}
export type VectorGradientStop = { offset:number; color:string; opacity?:number };
export type VectorGradient = { type:"linear"|"radial"; angle?:number; cx?:number; cy?:number; radius?:number; spread?:"pad"|"reflect"|"repeat"; stops:VectorGradientStop[] };
export type VectorPattern = { type:"stripes"|"dots"|"grid"|"crosshatch"; foreground:string; background:string; size:number; angle?:number; strokeWidth?:number };
export function normalizeGradientStops(stops:VectorGradientStop[]):VectorGradientStop[]{const clean=stops.map(stop=>({offset:Math.max(0,Math.min(1,Number(stop.offset)||0)),color:stop.color||"#000000",opacity:Math.max(0,Math.min(1,stop.opacity??1))})).sort((a,b)=>a.offset-b.offset);if(!clean.length)return [{offset:0,color:"#7C3AED",opacity:1},{offset:1,color:"#06B6D4",opacity:1}];if(clean.length===1)return [clean[0],{...clean[0],offset:clean[0].offset===1?0:1}].sort((a,b)=>a.offset-b.offset);return clean;}
export function setVectorGradient(element:E,gradient:VectorGradient):E{return {...normalizeVectorElement(element),vectorGradient:{...gradient,stops:normalizeGradientStops(gradient.stops)},vectorPattern:undefined,fillColor:"transparent"};}
export function setVectorPattern(element:E,pattern:VectorPattern):E{return {...normalizeVectorElement(element),vectorPattern:{...pattern,size:Math.max(2,Number(pattern.size)||8),strokeWidth:Math.max(.25,Number(pattern.strokeWidth)||1)},vectorGradient:undefined,fillColor:"transparent"};}
export function clearVectorAppearanceFill(element:E,fillColor="transparent"):E{return {...normalizeVectorElement(element),vectorGradient:undefined,vectorPattern:undefined,fillColor};}
const xmlEscape=(value:unknown)=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const safeSvgId=(value:string)=>value.replace(/[^a-zA-Z0-9_-]/g,"-");
function vectorSvgParts(element:E,prefix="vector"):{defs:string[];body:string}{
  const uid=safeSvgId(`${prefix}-${element.id??"path"}`), d=vectorPathData(element);
  const stroke=element.borderColor&&element.borderColor!=="transparent"?element.borderColor:"none";
  let fill=element.fillColor&&element.fillColor!=="transparent"?element.fillColor:"none";
  const defs:string[]=[];
  if(element.vectorGradient){
    const g=element.vectorGradient as VectorGradient, gid=`${uid}-fill`, stops=normalizeGradientStops(g.stops).map(stop=>`<stop offset="${Math.round(stop.offset*100)}%" stop-color="${xmlEscape(stop.color)}" stop-opacity="${stop.opacity??1}"/>`).join("");
    if(g.type==="radial")defs.push(`<radialGradient id="${gid}" cx="${g.cx??.5}" cy="${g.cy??.5}" r="${g.radius??.5}" spreadMethod="${g.spread??"pad"}">${stops}</radialGradient>`);
    else{const rad=(g.angle??0)*Math.PI/180,x=Math.cos(rad)/2,y=Math.sin(rad)/2;defs.push(`<linearGradient id="${gid}" x1="${.5-x}" y1="${.5-y}" x2="${.5+x}" y2="${.5+y}" spreadMethod="${g.spread??"pad"}">${stops}</linearGradient>`);}
    fill=`url(#${gid})`;
  } else if(element.vectorPattern){
    const p=element.vectorPattern as VectorPattern,pid=`${uid}-fill`,size=Math.max(2,p.size||8),sw=Math.max(.25,p.strokeWidth||1),bg=`<rect width="${size}" height="${size}" fill="${xmlEscape(p.background)}"/>`;let art="";
    if(p.type==="dots")art=`<circle cx="${size/2}" cy="${size/2}" r="${Math.max(1,sw*1.5)}" fill="${xmlEscape(p.foreground)}"/>`;
    if(p.type==="stripes")art=`<path d="M 0 ${size} L ${size} 0 M ${-size/2} ${size/2} L ${size/2} ${-size/2} M ${size/2} ${size*1.5} L ${size*1.5} ${size/2}" stroke="${xmlEscape(p.foreground)}" stroke-width="${sw}"/>`;
    if(p.type==="grid")art=`<path d="M 0 0 H ${size} M 0 0 V ${size}" stroke="${xmlEscape(p.foreground)}" stroke-width="${sw}"/>`;
    if(p.type==="crosshatch")art=`<path d="M 0 0 L ${size} ${size} M ${size} 0 L 0 ${size}" stroke="${xmlEscape(p.foreground)}" stroke-width="${sw}"/>`;
    defs.push(`<pattern id="${pid}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${p.angle??0})">${bg}${art}</pattern>`);fill=`url(#${pid})`;
  }
  const marker=(kind:string,id:string)=>kind==="arrow"?`<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${xmlEscape(stroke)}"/></marker>`:kind==="circle"?`<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"><circle cx="5" cy="5" r="4" fill="${xmlEscape(stroke)}"/></marker>`:kind==="square"?`<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"><rect x="1" y="1" width="8" height="8" fill="${xmlEscape(stroke)}"/></marker>`:"";
  const start=element.startArrowhead??"none",end=element.endArrowhead??"none",sid=`${uid}-start`,eid=`${uid}-end`; if(start!=="none")defs.push(marker(start,sid));if(end!=="none")defs.push(marker(end,eid));
  const dash=Array.isArray(element.strokeDashArray)&&element.strokeDashArray.length?` stroke-dasharray="${element.strokeDashArray.join(" ")}" stroke-dashoffset="${element.strokeDashOffset??0}"`:"";
  const markers=`${start!=="none"?` marker-start="url(#${sid})"`:""}${end!=="none"?` marker-end="url(#${eid})"`:""}`,blend=element.vectorBlendMode&&element.vectorBlendMode!=="normal"?` style="mix-blend-mode:${element.vectorBlendMode}"`:"";
  if(element.shapeKind==="compound-path"&&Array.isArray(element.compoundSources)&&element.compoundSources.length){
    const compoundSources = element.compoundSources as E[];
    const sourceParts=compoundSources.map((source:E,index:number)=>vectorSvgParts(source,`${uid}-${index}`)); sourceParts.forEach(part=>defs.push(...part.defs));
    const sourceBodies=sourceParts.map((part,index)=>`<g transform="translate(${compoundSources[index].x??0} ${compoundSources[index].y??0})">${part.body}</g>`).join("");
    return {defs,body:`<g data-boolean-operation="${element.booleanOperation??"combine"}" opacity="${element.opacity??1}"${blend}>${sourceBodies}</g>`};
  }
  return {defs,body:`<path d="${xmlEscape(d)}" fill="${xmlEscape(fill)}" fill-opacity="${element.vectorFillOpacity??1}" fill-rule="${element.vectorWinding??"nonzero"}" stroke="${xmlEscape(stroke)}" stroke-opacity="${element.vectorStrokeOpacity??1}" stroke-width="${element.borderWidth??0}" stroke-linecap="${element.strokeCap??"round"}" stroke-linejoin="${element.strokeJoin??"round"}" stroke-miterlimit="${element.miterLimit??4}"${dash}${markers}${blend} opacity="${element.opacity??1}"/>`};
}
export function vectorElementToSvg(element:E):string{
  const width=Math.max(1,Number(element.width)||1),height=Math.max(1,Number(element.height)||1),parts=vectorSvgParts(element);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.defs.length?`<defs>${parts.defs.join("")}</defs>`:""}${parts.body}</svg>`;
}
export function cleanVectorPath(element:E,tolerance=.01):E{
  const input=nodesOf(element),out:ProfessionalVectorNode[]=[];for(const node of input){if(!Number.isFinite(node.x)||!Number.isFinite(node.y))continue;if(out.length&&dist(out[out.length-1],node)<=tolerance)continue;out.push({...node});}
  if(element.vectorClosed&&out.length>2&&dist(out[0],out[out.length-1])<=tolerance)out.pop();
  return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorCleanedAt:Date.now()};
}
export function flattenCompoundVector(element:E):E{
  if(element.shapeKind!=="compound-path"||!Array.isArray(element.compoundSources)||!element.compoundSources.length)return normalizeVectorElement(element);
  const nodes:ProfessionalVectorNode[]=[];element.compoundSources.forEach((source:E)=>nodes.push(...nodesOf(source).map(node=>({...node,x:node.x+(source.x??0),y:node.y+(source.y??0),inX:node.inX==null?undefined:node.inX+(source.x??0),inY:node.inY==null?undefined:node.inY+(source.y??0),outX:node.outX==null?undefined:node.outX+(source.x??0),outY:node.outY==null?undefined:node.outY+(source.y??0)}))));
  return {...normalizeVectorElement(element),name:`${element.name} Flattened`,shapeKind:"custom-path",vectorNodes:nodes,vectorPoints:nodes,vectorClosed:true,compoundSources:undefined,booleanOperation:undefined,vectorFlattened:true};
}
export function releaseCompoundVector(elements:E[],id:string):{elements:E[];released:E[]}{
  const compound=elements.find(item=>item.id===id);if(!compound||compound.shapeKind!=="compound-path"||!Array.isArray(compound.compoundSources))return {elements,released:[]};
  const maxZ=Math.max(0,...elements.map(item=>item.zIndex??0));const released=compound.compoundSources.map((source:E,index:number)=>({...clone(source),id:`${source.id||"vector"}-released-${Date.now()}-${index}`,name:`${source.name||"Vector"} Released`,x:compound.x+(source.x??0),y:compound.y+(source.y??0),zIndex:maxZ+index+1,locked:false}));
  return {elements:[...elements.filter(item=>item.id!==id),...released].map((item,index)=>({...item,zIndex:index+1})),released};
}
export function vectorProjectToSvgLibrary(project:PublisherProject):string{
  const width=Math.max(1,...project.pages.map(page=>page.width)),gap=24,totalHeight=Math.max(1,project.pages.reduce((sum,page)=>sum+page.height+gap,0)-gap);let y=0;const defs:string[]=[],groups:string[]=[];
  project.pages.forEach((page,pageIndex)=>{const bodies:string[]=[];page.elements.forEach((raw,index)=>{const element=raw as E;if(!isVector(element))return;const parts=vectorSvgParts(element,`page-${pageIndex}-item-${index}`);defs.push(...parts.defs);bodies.push(`<g transform="translate(${element.x} ${element.y}) rotate(${element.rotation??0} ${element.width/2} ${element.height/2})">${parts.body}</g>`);});groups.push(`<g id="${safeSvgId(page.id)}" transform="translate(0 ${y})"><rect width="${page.width}" height="${page.height}" fill="${xmlEscape(page.backgroundColor??"#FFFFFF")}"/>${bodies.join("")}</g>`);y+=page.height+gap;});
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}"><title>${xmlEscape(project.name)} Vector Library</title>${defs.length?`<defs>${defs.join("")}</defs>`:""}${groups.join("")}</svg>`;
}
export function validateVectorSvgRoundTrip(element:E):{valid:boolean;errors:string[];svg:string}{
  const svg=vectorElementToSvg(element),errors:string[]=[];if(!svg.startsWith("<svg"))errors.push("SVG root is missing.");if(!svg.includes("</svg>"))errors.push("SVG document is incomplete.");if(element.shapeKind!=="compound-path"&&nodesOf(element).length>=2&&!svg.includes("<path"))errors.push("Editable path geometry was not serialized.");if(/NaN|Infinity|undefined/.test(svg))errors.push("SVG contains invalid numeric values.");return {valid:errors.length===0,errors,svg};
}
export function auditProfessionalVectors(project:PublisherProject):VectorAuditItem[]{
  const out:VectorAuditItem[]=[]; project.pages.forEach((page:PublisherPage)=>page.elements.forEach((raw)=>{const e=raw as E;if(!isVector(e))return;const n=nodesOf(e);if(e.shapeKind!=="compound-path"&&e.type!=="svg"&&n.length<2)out.push({id:`nodes-${e.id}`,severity:"error",message:"Vector path has fewer than two nodes.",elementId:e.id,pageId:page.id});if((e.borderWidth??0)>0&&(!e.borderColor||e.borderColor==="transparent"))out.push({id:`stroke-${e.id}`,severity:"warning",message:"Stroke width is set but stroke color is transparent.",elementId:e.id,pageId:page.id});if(e.shapeKind==="compound-path"&&!(e.compoundSources?.length))out.push({id:`compound-${e.id}`,severity:"error",message:"Compound path has no source geometry.",elementId:e.id,pageId:page.id});if(n.length>250)out.push({id:`complex-${e.id}`,severity:"info",message:`Complex path contains ${n.length} nodes; simplify for smaller exports.`,elementId:e.id,pageId:page.id});for(let i=1;i<n.length;i++)if(dist(n[i-1],n[i])<.01)out.push({id:`duplicate-${e.id}-${i}`,severity:"warning",message:`Nodes ${i} and ${i+1} overlap.`,elementId:e.id,pageId:page.id});if(Array.isArray(e.strokeDashArray)&&e.strokeDashArray.some((v:any)=>!Number.isFinite(v)||v<0))out.push({id:`dash-${e.id}`,severity:"error",message:"Stroke dash values must be non-negative numbers.",elementId:e.id,pageId:page.id});if(e.vectorGradient&&(e.vectorGradient.stops??[]).length<2)out.push({id:`gradient-${e.id}`,severity:"error",message:"Vector gradient requires at least two color stops.",elementId:e.id,pageId:page.id});if(e.vectorGradient&&(e.vectorGradient.stops??[]).some((s:any)=>s.offset<0||s.offset>1))out.push({id:`gradient-range-${e.id}`,severity:"warning",message:"Gradient stop offsets should be between 0 and 1.",elementId:e.id,pageId:page.id});if(e.vectorPattern&&(!Number.isFinite(e.vectorPattern.size)||e.vectorPattern.size<2))out.push({id:`pattern-${e.id}`,severity:"error",message:"Pattern size must be at least 2 pixels.",elementId:e.id,pageId:page.id});if((e.vectorFillOpacity??1)<0||(e.vectorFillOpacity??1)>1||(e.vectorStrokeOpacity??1)<0||(e.vectorStrokeOpacity??1)>1)out.push({id:`appearance-opacity-${e.id}`,severity:"error",message:"Fill and stroke opacity must be between 0 and 1.",elementId:e.id,pageId:page.id});if(e.liveShape&&!(e.liveShape as any).editable)out.push({id:`live-shape-${e.id}`,severity:"warning",message:"Live shape parameters are not editable.",elementId:e.id,pageId:page.id});if(e.vectorWidthProfile&&n.some((node:any)=>!Number.isFinite(node.pressure)))out.push({id:`width-profile-${e.id}`,severity:"error",message:"Variable-width path contains invalid pressure values.",elementId:e.id,pageId:page.id});if(e.vectorRepeat&&e.vectorRepeat.count<1)out.push({id:`repeat-${e.id}`,severity:"error",message:"Vector repeat count must be at least one.",elementId:e.id,pageId:page.id});if(e.vectorMeshGradient&&e.vectorMeshGradient.points.length<4)out.push({id:`mesh-${e.id}`,severity:"warning",message:"Mesh gradient should contain at least four control points.",elementId:e.id,pageId:page.id});const roundTrip=validateVectorSvgRoundTrip(e);if(!roundTrip.valid)out.push({id:`roundtrip-${e.id}`,severity:"error",message:`SVG round-trip failed: ${roundTrip.errors.join(" ")}`,elementId:e.id,pageId:page.id});}));return out;
}
export function vectorProjectSummary(project:PublisherProject){let vectors=0,nodes=0,compound=0,closed=0;project.pages.forEach(p=>p.elements.forEach(raw=>{const e=raw as E;if(!isVector(e))return;vectors++;nodes+=nodesOf(e).length;if(e.shapeKind==="compound-path")compound++;if(e.vectorClosed)closed++;}));return {vectors,nodes,compound,closed,issues:auditProfessionalVectors(project).length};}

export type VectorTransformOptions = { dx?:number; dy?:number; scaleX?:number; scaleY?:number; rotate?:number; originX?:number; originY?:number };
export function insertVectorNode(element:E,afterIndex:number,t=.5):E{
  const nodes=nodesOf(element); if(nodes.length<2)return normalizeVectorElement(element);
  const aIndex=Math.max(0,Math.min(nodes.length-1,afterIndex)); const bIndex=aIndex===nodes.length-1?(element.vectorClosed?0:aIndex):aIndex+1;
  if(aIndex===bIndex)return normalizeVectorElement(element);
  const a=nodes[aIndex],b=nodes[bIndex],mix=(x:number,y:number)=>x+(y-x)*Math.max(0,Math.min(1,t));
  const node:ProfessionalVectorNode={x:mix(a.x,b.x),y:mix(a.y,b.y),kind:"smooth",inX:mix(a.outX??a.x,b.inX??b.x),inY:mix(a.outY??a.y,b.inY??b.y),outX:mix(a.outX??a.x,b.inX??b.x),outY:mix(a.outY??a.y,b.inY??b.y)};
  nodes.splice(aIndex+1,0,node); return {...normalizeVectorElement(element),vectorNodes:nodes,vectorPoints:nodes};
}
export function deleteVectorNode(element:E,index:number):E{
  const nodes=nodesOf(element); const minimum=element.vectorClosed?3:2; if(nodes.length<=minimum)return normalizeVectorElement(element);
  nodes.splice(Math.max(0,Math.min(nodes.length-1,index)),1); return {...normalizeVectorElement(element),vectorNodes:nodes,vectorPoints:nodes};
}
export function updateVectorNode(element:E,index:number,updates:Partial<ProfessionalVectorNode>):E{
  const nodes=nodesOf(element); if(!nodes[index])return normalizeVectorElement(element); nodes[index]={...nodes[index],...updates};
  return {...normalizeVectorElement(element),vectorNodes:nodes,vectorPoints:nodes};
}
export function transformVectorPath(element:E,options:VectorTransformOptions):E{
  const nodes=nodesOf(element); if(!nodes.length)return normalizeVectorElement(element);
  const minX=Math.min(...nodes.map(n=>n.x)),maxX=Math.max(...nodes.map(n=>n.x)),minY=Math.min(...nodes.map(n=>n.y)),maxY=Math.max(...nodes.map(n=>n.y));
  const ox=options.originX??(minX+maxX)/2,oy=options.originY??(minY+maxY)/2,sx=options.scaleX??1,sy=options.scaleY??1,rad=(options.rotate??0)*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad),dx=options.dx??0,dy=options.dy??0;
  const point=(x:number,y:number)=>{const px=(x-ox)*sx,py=(y-oy)*sy;return {x:ox+px*cos-py*sin+dx,y:oy+px*sin+py*cos+dy};};
  const out=nodes.map(n=>{const p=point(n.x,n.y),i=n.inX==null||n.inY==null?null:point(n.inX,n.inY),o=n.outX==null||n.outY==null?null:point(n.outX,n.outY);return {...n,x:p.x,y:p.y,...(i?{inX:i.x,inY:i.y}:{}),...(o?{outX:o.x,outY:o.y}:{})};});
  return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorTransform:{...(element.vectorTransform??{}),...options}};
}
export function offsetVectorPath(element:E,amount:number):E{
  const nodes=nodesOf(element); if(!nodes.length)return normalizeVectorElement(element); const cx=nodes.reduce((s,n)=>s+n.x,0)/nodes.length,cy=nodes.reduce((s,n)=>s+n.y,0)/nodes.length;
  const out=nodes.map(n=>{const dx=n.x-cx,dy=n.y-cy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;return {...n,x:n.x+ux*amount,y:n.y+uy*amount,inX:n.inX==null?undefined:n.inX+ux*amount,inY:n.inY==null?undefined:n.inY+uy*amount,outX:n.outX==null?undefined:n.outX+ux*amount,outY:n.outY==null?undefined:n.outY+uy*amount};});
  return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorOffset:(element.vectorOffset??0)+amount};
}
export function setVectorStrokePattern(element:E,dashArray:number[],dashOffset=0):E{return {...normalizeVectorElement(element),strokeDashArray:dashArray.filter(v=>Number.isFinite(v)&&v>=0),strokeDashOffset:dashOffset};}
export function setVectorArrowheads(element:E,start:"none"|"arrow"|"circle"|"square",end:"none"|"arrow"|"circle"|"square"):E{return {...normalizeVectorElement(element),startArrowhead:start,endArrowhead:end};}

// advanced illustration completion.
export type LiveShapeKind = "rectangle"|"rounded-rectangle"|"polygon"|"star"|"spiral"|"gear"|"arrow";
export type VectorBrushPreset = "pencil"|"marker"|"ink"|"calligraphy"|"artistic";
export type VectorWarpMode = "arc"|"wave"|"fish"|"bulge"|"perspective";
export type VectorLiveEffect = "zigzag"|"roughen"|"pucker"|"inflate"|"twist"|"bloat";
export type VectorRepeatMode = "none"|"radial"|"grid"|"mirror";

const polarNodes=(count:number, radius:(index:number)=>number, cx=50, cy=50, rotation=-Math.PI/2):ProfessionalVectorNode[]=>
  Array.from({length:Math.max(3,count)},(_,index)=>{const angle=rotation+(Math.PI*2*index)/Math.max(3,count),r=radius(index);return {x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r,kind:"corner"};});

export function createLiveShape(element:E,kind:LiveShapeKind,parameters:Record<string,number>={}):E{
  const w=Math.max(1,element.width||100),h=Math.max(1,element.height||100),cx=w/2,cy=h/2;
  let nodes:ProfessionalVectorNode[]=[];
  if(kind==="rectangle"||kind==="rounded-rectangle") nodes=[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}].map(n=>({...n,kind:"corner" as const}));
  if(kind==="polygon") nodes=polarNodes(Math.max(3,Math.round(parameters.sides??6)),()=>Math.min(w,h)/2,cx,cy);
  if(kind==="star"){const points=Math.max(3,Math.round(parameters.points??5)),outer=Math.min(w,h)/2,inner=outer*Math.max(.1,Math.min(.9,parameters.innerRatio??.45));nodes=polarNodes(points*2,i=>i%2?inner:outer,cx,cy);}
  if(kind==="gear"){const teeth=Math.max(4,Math.round(parameters.teeth??10)),outer=Math.min(w,h)/2,inner=outer*.72;nodes=polarNodes(teeth*2,i=>i%2?inner:outer,cx,cy);}
  if(kind==="arrow") nodes=[{x:0,y:h*.35},{x:w*.62,y:h*.35},{x:w*.62,y:0},{x:w,y:h*.5},{x:w*.62,y:h},{x:w*.62,y:h*.65},{x:0,y:h*.65}].map(n=>({...n,kind:"corner" as const}));
  if(kind==="spiral"){const turns=Math.max(1,parameters.turns??3),count=Math.max(18,Math.round(turns*18));nodes=Array.from({length:count},(_,i)=>{const t=i/(count-1),a=t*turns*Math.PI*2,r=t*Math.min(w,h)*.48;return{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,kind:"smooth" as const};});}
  const closed=kind!=="spiral";
  return {...normalizeVectorElement(element),shapeKind:"custom-path",vectorNodes:nodes,vectorPoints:nodes,vectorClosed:closed,liveShape:{kind,parameters:{...parameters},editable:true},cornerRadius:kind==="rounded-rectangle"?Math.max(0,parameters.cornerRadius??12):element.cornerRadius};
}

export function applyLiveCorners(element:E,radius:number):E{
  const value=Math.max(0,radius);return {...normalizeVectorElement(element),liveCornerRadius:value,cornerRadius:value,liveCorners:true};
}
export function applyVariableWidth(element:E,profile:"uniform"|"taper-start"|"taper-end"|"taper-both"|"bulge",strength=.8):E{
  const nodes=nodesOf(element),last=Math.max(1,nodes.length-1),s=Math.max(0,Math.min(1,strength));
  const pressure=(i:number)=>{const t=i/last;if(profile==="taper-start")return .15+(s*t);if(profile==="taper-end")return .15+s*(1-t);if(profile==="taper-both")return .15+s*Math.sin(Math.PI*t);if(profile==="bulge")return .45+s*Math.sin(Math.PI*t);return 1;};
  const out=nodes.map((n,i)=>({...n,pressure:pressure(i)}));return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorWidthProfile:{profile,strength:s}};
}
export function applyVectorBrush(element:E,preset:VectorBrushPreset):E{
  const settings:Record<VectorBrushPreset,{width:number;cap:"round"|"square"|"butt";opacity:number;profile:string}>={pencil:{width:2,cap:"round",opacity:.8,profile:"uniform"},marker:{width:12,cap:"square",opacity:.55,profile:"uniform"},ink:{width:5,cap:"round",opacity:1,profile:"taper-both"},calligraphy:{width:8,cap:"butt",opacity:1,profile:"taper-end"},artistic:{width:10,cap:"round",opacity:.9,profile:"bulge"}};
  const setting=settings[preset];return {...applyVariableWidth(element,setting.profile as any,.85),vectorBrush:{preset,angle:preset==="calligraphy"?35:0,spacing:1},borderWidth:setting.width,strokeCap:setting.cap,vectorStrokeOpacity:setting.opacity,shapeKind:"brush-stroke"};
}
export function createVectorSymbol(element:E,name?:string):E{return {...normalizeVectorElement(element),vectorSymbol:{symbolId:element.vectorSymbol?.symbolId??`symbol-${Date.now()}`,name:name||element.name||"Vector Symbol",isMaster:true,instanceVersion:(element.vectorSymbol?.instanceVersion??0)+1}};}
export function createSymbolInstance(element:E,masterId:string):E{return {...clone(element),id:`symbol-instance-${Date.now()}`,name:`${element.name} Instance`,vectorSymbol:{symbolId:masterId,name:element.name,isMaster:false,masterId,instanceVersion:1}};}
export function applyVectorWarp(element:E,mode:VectorWarpMode,amount=.25):E{
  const nodes=nodesOf(element);if(!nodes.length)return normalizeVectorElement(element);const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),w=Math.max(1,maxX-minX),h=Math.max(1,maxY-minY),a=Math.max(-1,Math.min(1,amount));
  const point=(x:number,y:number)=>{const tx=(x-minX)/w,ty=(y-minY)/h;let nx=x,ny=y;if(mode==="arc")ny+=Math.sin(Math.PI*tx)*h*a*.5;if(mode==="wave")ny+=Math.sin(Math.PI*4*tx)*h*a*.18;if(mode==="fish")nx+=(Math.sin(Math.PI*ty)-.5)*w*a*.25;if(mode==="bulge"){const scale=1+a*Math.sin(Math.PI*ty);nx=minX+w/2+(x-(minX+w/2))*scale;}if(mode==="perspective")nx=minX+(x-minX)*(1+a*(ty-.5));return{x:nx,y:ny};};
  const out=nodes.map(n=>{const p=point(n.x,n.y);return{...n,x:p.x,y:p.y};});return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorWarp:{mode,amount:a,editable:true}};
}
export function applyVectorLiveEffect(element:E,effect:VectorLiveEffect,amount=.2):E{
  const nodes=nodesOf(element);if(!nodes.length)return normalizeVectorElement(element);const cx=nodes.reduce((s,n)=>s+n.x,0)/nodes.length,cy=nodes.reduce((s,n)=>s+n.y,0)/nodes.length,a=Math.max(-1,Math.min(1,amount));
  const out=nodes.map((n,i)=>{let x=n.x,y=n.y;const dx=x-cx,dy=y-cy,len=Math.hypot(dx,dy)||1;if(effect==="zigzag"){const k=i%2?1:-1;x+=(-dy/len)*a*12*k;y+=(dx/len)*a*12*k;}if(effect==="roughen"){const k=Math.sin((i+1)*12.9898)*43758.5453%1;x+=k*a*10;y-=k*a*10;}if(effect==="pucker"||effect==="inflate"||effect==="bloat"){const scale=effect==="pucker"?1-Math.abs(a)*.35:1+Math.abs(a)*.35;x=cx+dx*scale;y=cy+dy*scale;}if(effect==="twist"){const angle=a*Math.PI*(len/Math.max(1,Math.max(...nodes.map(q=>Math.hypot(q.x-cx,q.y-cy)))));x=cx+dx*Math.cos(angle)-dy*Math.sin(angle);y=cy+dx*Math.sin(angle)+dy*Math.cos(angle);}return{...n,x,y};});
  return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorLiveEffects:[...(element.vectorLiveEffects??[]),{effect,amount:a,enabled:true}]};
}
export function applyVectorRepeat(element:E,mode:VectorRepeatMode,count=6,spacing=16):E{return {...normalizeVectorElement(element),vectorRepeat:{mode,count:Math.max(1,Math.round(count)),spacing:Math.max(0,spacing),angle:mode==="radial"?360/Math.max(1,count):0,editable:true}};}
export function knifeVectorPath(element:E,index?:number):E{
  const nodes=nodesOf(element);if(nodes.length<3)return normalizeVectorElement(element);const cut=Math.max(1,Math.min(nodes.length-2,index??Math.floor(nodes.length/2)));return {...normalizeVectorElement(element),vectorNodes:nodes.slice(0,cut+1),vectorPoints:nodes.slice(0,cut+1),vectorClosed:false,knifeRemainder:nodes.slice(cut),vectorKnifeCutAt:cut};
}
export function eraseVectorNodes(element:E,centerIndex?:number,radius=1):E{
  const nodes=nodesOf(element);if(nodes.length<3)return normalizeVectorElement(element);const center=Math.max(0,Math.min(nodes.length-1,centerIndex??Math.floor(nodes.length/2))),r=Math.max(0,Math.round(radius));const out=nodes.filter((_,i)=>Math.abs(i-center)>r);return {...normalizeVectorElement(element),vectorNodes:out,vectorPoints:out,vectorClosed:out.length>=3?element.vectorClosed:false,vectorErasedAt:Date.now()};
}
export function applyMeshGradient(element:E):E{return {...normalizeVectorElement(element),vectorMeshGradient:{rows:2,columns:2,points:[{x:0,y:0,color:"#7C3AED"},{x:1,y:0,color:"#06B6D4"},{x:0,y:1,color:"#EC4899"},{x:1,y:1,color:"#F59E0B"}],editable:true},vectorGradient:{type:"radial",cx:.5,cy:.5,radius:.72,spread:"pad",stops:[{offset:0,color:"#FFFFFF",opacity:.9},{offset:.35,color:"#7C3AED",opacity:1},{offset:.7,color:"#06B6D4",opacity:1},{offset:1,color:"#EC4899",opacity:1}]},fillColor:"transparent"};}

import type { PublisherElement } from "../types/publisher";

export type SmartDiagramType = "organization" | "flowchart" | "timeline" | "mind-map" | "process" | "decision-tree" | "pyramid" | "cycle" | "venn" | "swimlane";
export type SmartDiagramTheme = "teal" | "blue" | "purple" | "warm" | "slate";
export type DiagramDirection = "horizontal" | "vertical";
export type DiagramNodeInput = { title: string; subtitle?: string };
export type SmartDiagramOptions = {
  type: SmartDiagramType;
  title?: string;
  nodes?: DiagramNodeInput[];
  direction?: DiagramDirection;
  theme?: SmartDiagramTheme;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

const palettes: Record<SmartDiagramTheme, string[]> = {
  teal: ["#0F766E", "#14B8A6", "#5EEAD4", "#CCFBF1", "#134E4A"],
  blue: ["#1D4ED8", "#3B82F6", "#93C5FD", "#DBEAFE", "#1E3A8A"],
  purple: ["#6D28D9", "#8B5CF6", "#C4B5FD", "#EDE9FE", "#4C1D95"],
  warm: ["#C2410C", "#F97316", "#FDBA74", "#FFEDD5", "#7C2D12"],
  slate: ["#334155", "#64748B", "#94A3B8", "#E2E8F0", "#0F172A"],
};

function base(id:string,name:string,type:PublisherElement["type"],x:number,y:number,width:number,height:number,zIndex:number,groupId:string): PublisherElement {
  return { id, name, type, x, y, width, height, rotation:0, zIndex, opacity:1, groupId };
}
function rect(id:string,title:string,x:number,y:number,w:number,h:number,z:number,g:string,fill:string,stroke:string,role="node"): PublisherElement {
  return { ...base(id,title,"rectangle",x,y,w,h,z,g), fillColor:fill, borderColor:stroke, borderWidth:2, borderRadius:12, diagramRole:role } as any;
}
function text(id:string,value:string,x:number,y:number,w:number,h:number,z:number,g:string,color="#0F172A",size=15,weight:PublisherElement["fontWeight"]="700",role="label"): PublisherElement {
  return { ...base(id,value,"text",x,y,w,h,z,g), text:value, textColor:color, fontFamily:"Arial", fontSize:size, fontWeight:weight, textAlign:"center", verticalJustification:"center", diagramRole:role } as any;
}
function line(id:string,x1:number,y1:number,x2:number,y2:number,z:number,g:string,color:string,role="connector"): PublisherElement {
  return { ...base(id,"Diagram Connector","line",x1,y1,Math.max(1,x2-x1),Math.max(1,y2-y1),z,g), borderColor:color, borderWidth:3, diagramRole:role, connectorStart:{x:x1,y:y1}, connectorEnd:{x:x2,y:y2}, connectorRouting:"orthogonal" } as any;
}
function circle(id:string,title:string,x:number,y:number,size:number,z:number,g:string,fill:string,stroke:string,opacity=1,role="node"): PublisherElement {
  return { ...base(id,title,"circle",x,y,size,size,z,g), fillColor:fill, borderColor:stroke, borderWidth:2, opacity, diagramRole:role } as any;
}
function triangle(id:string,title:string,x:number,y:number,w:number,h:number,z:number,g:string,fill:string,stroke:string): PublisherElement {
  return { ...base(id,title,"triangle",x,y,w,h,z,g), fillColor:fill, borderColor:stroke, borderWidth:2, diagramRole:"level" } as any;
}
const uid=(prefix:string,index:number)=>`${prefix}-${index}`;
const defaults: Record<SmartDiagramType,string[]> = {
  organization:["Chief Executive","Operations","Technology","Marketing","Finance"],
  flowchart:["Start","Collect Data","Valid?","Process","Finish"],
  timeline:["Discover","Plan","Design","Build","Launch"],
  "mind-map":["Main Idea","Audience","Message","Channels","Budget","Results"],
  process:["Research","Strategy","Create","Review","Publish"],
  "decision-tree":["Decision","Option A","Option B","Result A","Result B"],
  pyramid:["Vision","Strategy","Programs","Projects","Tasks"],
  cycle:["Plan","Create","Review","Improve","Repeat"],
  venn:["Audience A","Audience B","Shared Value"],
  swimlane:["Request","Review","Approve","Deliver"],
};

export function createSmartDiagram(nextId:()=>string,zStart:number,options:SmartDiagramOptions): PublisherElement[] {
  const x=options.x??100,y=options.y??110,w=options.width??760,h=options.height??470;
  const colors=palettes[options.theme??"teal"], groupId=nextId();
  const labels=(options.nodes?.length?options.nodes.map(n=>n.title):defaults[options.type]).filter(Boolean);
  const out:PublisherElement[]=[]; let z=zStart;
  const add=(e:PublisherElement)=>{(e as any).diagramType=options.type;(e as any).diagramGroupId=groupId;out.push(e);};
  const title=options.title?.trim(); if(title)add(text(nextId(),title,x,y-42,w,32,z++,groupId,colors[4],22,"800","title"));

  if(options.type==="organization"){
    const topW=190,topH=70,cx=x+w/2-topW/2; add(rect(nextId(),labels[0],cx,y,topW,topH,z++,groupId,colors[0],colors[4])); add(text(nextId(),labels[0],cx+8,y+8,topW-16,topH-16,z++,groupId,"#FFFFFF"));
    const children=labels.slice(1), gap=18, cw=Math.min(150,(w-gap*(children.length-1))/Math.max(1,children.length)), cy=y+190;
    children.forEach((label,i)=>{const nx=x+i*(cw+gap);add(line(nextId(),cx+topW/2,y+topH,nx+cw/2,cy,z++,groupId,colors[1]));add(rect(nextId(),label,nx,cy,cw,64,z++,groupId,colors[3],colors[0]));add(text(nextId(),label,nx+6,cy+6,cw-12,52,z++,groupId,colors[4],14));});
  } else if(options.type==="flowchart"){
    const vertical=options.direction!=="horizontal", nw=150,nh=66,gap=42;
    labels.forEach((label,i)=>{const nx=vertical?x+w/2-nw/2:x+i*(nw+gap), ny=vertical?y+i*(nh+gap):y+h/2-nh/2;if(i)add(line(nextId(),vertical?nx+nw/2:(nx-gap)+nw,vertical?ny-gap:ny+nh/2,vertical?nx+nw/2:nx,vertical?ny:ny+nh/2,z++,groupId,colors[1]));const shape=i===0||i===labels.length-1?circle(nextId(),label,nx+35,ny,80,z++,groupId,colors[3],colors[0]):rect(nextId(),label,nx,ny,nw,nh,z++,groupId,i===2?colors[2]:"#FFFFFF",colors[0]);add(shape);add(text(nextId(),label,nx+8,ny+8,nw-16,nh-16,z++,groupId,colors[4],14));});
  } else if(options.type==="timeline"||options.type==="process"){
    const cy=y+h/2,step=w/Math.max(1,labels.length-1);add(line(nextId(),x,cy,x+w,cy,z++,groupId,colors[1],"axis"));labels.forEach((label,i)=>{const nx=x+i*step;add(circle(nextId(),label,nx-22,cy-22,44,z++,groupId,colors[i%3],colors[4]));add(text(nextId(),String(i+1),nx-18,cy-18,36,36,z++,groupId,"#FFFFFF",14));add(text(nextId(),label,nx-65,cy+(i%2?42:-86),130,38,z++,groupId,colors[4],14));});
  } else if(options.type==="mind-map"){
    const centerX=x+w/2,centerY=y+h/2,center=labels[0]??"Main Idea";add(circle(nextId(),center,centerX-70,centerY-70,140,z++,groupId,colors[0],colors[4]));add(text(nextId(),center,centerX-58,centerY-30,116,60,z++,groupId,"#FFFFFF",17));labels.slice(1).forEach((label,i,arr)=>{const angle=(i/arr.length)*Math.PI*2-Math.PI/2,nx=centerX+Math.cos(angle)*250-65,ny=centerY+Math.sin(angle)*170-34;add(line(nextId(),centerX,centerY,nx+65,ny+34,z++,groupId,colors[(i+1)%3]));add(rect(nextId(),label,nx,ny,130,68,z++,groupId,colors[3],colors[(i+1)%3]));add(text(nextId(),label,nx+7,ny+7,116,54,z++,groupId,colors[4],14));});
  } else if(options.type==="decision-tree"){
    const rootX=x+w/2-85;add(rect(nextId(),labels[0],rootX,y,170,68,z++,groupId,colors[0],colors[4]));add(text(nextId(),labels[0],rootX+8,y+8,154,52,z++,groupId,"#FFFFFF"));const choices=labels.slice(1,3);choices.forEach((label,i)=>{const nx=x+(i? w*.64:w*.12),ny=y+165;add(line(nextId(),rootX+85,y+68,nx+75,ny,z++,groupId,colors[1]));add(text(nextId(),i?"NO":"YES",rootX+85+(i?75:-115),y+95,50,22,z++,groupId,colors[4],11));add(rect(nextId(),label,nx,ny,150,62,z++,groupId,colors[3],colors[0]));add(text(nextId(),label,nx+6,ny+6,138,50,z++,groupId,colors[4],14));const result=labels[i+3]??`Result ${i+1}`,ry=ny+145;add(line(nextId(),nx+75,ny+62,nx+75,ry,z++,groupId,colors[1]));add(rect(nextId(),result,nx,ry,150,62,z++,groupId,"#FFFFFF",colors[1]));add(text(nextId(),result,nx+6,ry+6,138,50,z++,groupId,colors[4],14));});
  } else if(options.type==="pyramid"){
    const levels=Math.min(10,Math.max(3,labels.length)),lh=h/levels;for(let i=0;i<levels;i++){const ratio=(i+1)/levels,tw=w*ratio,nx=x+(w-tw)/2,ny=y+i*lh;add(triangle(nextId(),labels[i]??`Level ${i+1}`,nx,ny,tw,lh-4,z++,groupId,colors[i%3],colors[4]));add(text(nextId(),labels[i]??`Level ${i+1}`,x+w/2-100,ny+8,200,lh-20,z++,groupId,i<2?"#FFFFFF":colors[4],14));}
  } else if(options.type==="cycle"){
    const cx=x+w/2,cy=y+h/2,r=155;labels.forEach((label,i)=>{const a=(i/labels.length)*Math.PI*2-Math.PI/2,nx=cx+Math.cos(a)*r-55,ny=cy+Math.sin(a)*r-32,next=(i+1)%labels.length,na=(next/labels.length)*Math.PI*2-Math.PI/2,nx2=cx+Math.cos(na)*r,ny2=cy+Math.sin(na)*r;add(line(nextId(),nx+55,ny+32,nx2,ny2,z++,groupId,colors[1]));add(rect(nextId(),label,nx,ny,110,64,z++,groupId,colors[i%3],colors[4]));add(text(nextId(),label,nx+6,ny+6,98,52,z++,groupId,"#FFFFFF",13));});
  } else if(options.type==="venn"){
    const size=230,cx=x+w/2,cy=y+h/2;add(circle(nextId(),labels[0]??"A",cx-size*.85,cy-size/2,size,z++,groupId,colors[0],colors[4],.58,"venn-circle"));add(circle(nextId(),labels[1]??"B",cx-size*.15,cy-size/2,size,z++,groupId,colors[1],colors[4],.58,"venn-circle"));add(text(nextId(),labels[0]??"A",cx-size*.8,cy-size*.15,100,36,z++,groupId,"#FFFFFF",16));add(text(nextId(),labels[1]??"B",cx+size*.35,cy-size*.15,100,36,z++,groupId,"#FFFFFF",16));add(text(nextId(),labels[2]??"Shared",cx-70,cy-18,140,36,z++,groupId,colors[4],15));
  } else if(options.type==="swimlane"){
    const lanes=["Requester","Manager","Production"],laneH=h/lanes.length;lanes.forEach((lane,i)=>{const ly=y+i*laneH;add(rect(nextId(),lane,x,ly,w,laneH,z++,groupId,i%2?"#F8FAFC":"#FFFFFF",colors[2],"lane"));add(rect(nextId(),lane,x,ly,125,laneH,z++,groupId,colors[0],colors[4],"lane-header"));add(text(nextId(),lane,x+8,ly+8,109,laneH-16,z++,groupId,"#FFFFFF",14));});labels.forEach((label,i)=>{const lane=i%lanes.length,nx=x+155+(i%2)*280,ny=y+lane*laneH+laneH/2-28;if(i)add(line(nextId(),x+155+((i-1)%2)*280+130,y+((i-1)%lanes.length)*laneH+laneH/2,nx,ny+28,z++,groupId,colors[1]));add(rect(nextId(),label,nx,ny,130,56,z++,groupId,colors[3],colors[0]));add(text(nextId(),label,nx+6,ny+6,118,44,z++,groupId,colors[4],13));});
  }
  return out;
}

export function diagramBounds(elements:PublisherElement[]){if(!elements.length)return{x:0,y:0,width:0,height:0};const minX=Math.min(...elements.map(e=>e.x)),minY=Math.min(...elements.map(e=>e.y)),maxX=Math.max(...elements.map(e=>e.x+e.width)),maxY=Math.max(...elements.map(e=>e.y+e.height));return{x:minX,y:minY,width:maxX-minX,height:maxY-minY};}
export function countDiagramRoles(elements:PublisherElement[]){return elements.reduce<Record<string,number>>((a,e)=>{const role=String((e as any).diagramRole??"object");a[role]=(a[role]??0)+1;return a;},{});}

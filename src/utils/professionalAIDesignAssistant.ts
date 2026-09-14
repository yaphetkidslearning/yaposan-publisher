export type Phase48AssistantAction =
  | "improve-layout" | "improve-typography" | "improve-colors" | "improve-spacing"
  | "improve-accessibility" | "make-premium" | "make-minimal" | "resize-format"
  | "rewrite-copy" | "generate-variations";

export type Phase48Severity = "info" | "warning" | "critical";
export type Phase48SuggestionStatus = "proposed" | "accepted" | "dismissed";

export type Phase48DesignNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  role?: "heading" | "body" | "button" | "image" | "decoration";
};

export type Phase48DesignDocument = {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  nodes: Phase48DesignNode[];
};

export type Phase48Suggestion = {
  id: string;
  action: Phase48AssistantAction;
  title: string;
  explanation: string;
  severity: Phase48Severity;
  confidence: number;
  nodeIds: string[];
  status: Phase48SuggestionStatus;
  changes: Array<{ nodeId: string; property: keyof Phase48DesignNode; before: unknown; after: unknown }>;
};

export type Phase48Audit = {
  score: number;
  layout: number;
  typography: number;
  color: number;
  spacing: number;
  accessibility: number;
  suggestions: Phase48Suggestion[];
};

export const PHASE48_CAPABILITIES = [
  "Design audit with layout, typography, color, spacing, and accessibility scores",
  "Explainable one-click suggestions with before and after values",
  "Accept, dismiss, preview, and undo-friendly suggestion workflow",
  "Premium, minimal, and format-resize design intents",
  "Rule-based local assistant that can later connect to production AI providers",
  "Safe document transformation without silently overwriting original work",
];

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  return { r: parseInt(clean.slice(0,2),16), g: parseInt(clean.slice(2,4),16), b: parseInt(clean.slice(4,6),16) };
};
const luminance = (color: string) => {
  const rgb = hexToRgb(color); if (!rgb) return 0.5;
  const channels = [rgb.r,rgb.g,rgb.b].map((v) => { const c=v/255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); });
  return channels[0]*0.2126 + channels[1]*0.7152 + channels[2]*0.0722;
};
export function phase48ContrastRatio(foreground: string, background: string) {
  const a=luminance(foreground), b=luminance(background); return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
const clamp = (n:number,min=0,max=100) => Math.max(min,Math.min(max,Math.round(n)));
const suggestion = (partial: Omit<Phase48Suggestion,"id"|"status">): Phase48Suggestion => ({...partial,id:`p48-${partial.action}-${partial.nodeIds.join("-") || "document"}`,status:"proposed"});

export function auditPhase48Design(document: Phase48DesignDocument): Phase48Audit {
  const suggestions: Phase48Suggestion[] = [];
  const nodes=document.nodes;
  const headings=nodes.filter((n)=>n.role==="heading");
  const bodies=nodes.filter((n)=>n.role==="body");
  const buttons=nodes.filter((n)=>n.role==="button");
  const outOfBounds=nodes.filter((n)=>n.x<0||n.y<0||n.x+n.width>document.width||n.y+n.height>document.height);
  if (outOfBounds.length) suggestions.push(suggestion({action:"improve-layout",title:"Keep content inside the page",explanation:"Some objects extend beyond the page boundary and may be clipped during export.",severity:"critical",confidence:0.99,nodeIds:outOfBounds.map(n=>n.id),changes:[]}));
  const tinyText=nodes.filter((n)=>n.text && (n.fontSize ?? 16)<11);
  if (tinyText.length) suggestions.push(suggestion({action:"improve-typography",title:"Increase small text",explanation:"Text below 11 pt is difficult to read in print and small previews.",severity:"warning",confidence:0.96,nodeIds:tinyText.map(n=>n.id),changes:tinyText.map(n=>({nodeId:n.id,property:"fontSize",before:n.fontSize,after:12}))}));
  const weakHeadings=headings.filter((n)=>(n.fontSize??20)<28);
  if (weakHeadings.length) suggestions.push(suggestion({action:"improve-typography",title:"Strengthen the headline hierarchy",explanation:"Larger display type creates a clearer first reading point.",severity:"info",confidence:0.9,nodeIds:weakHeadings.map(n=>n.id),changes:weakHeadings.map(n=>({nodeId:n.id,property:"fontSize",before:n.fontSize,after:Math.max(32,n.fontSize??0)}))}));
  const lowContrast=nodes.filter((n)=>n.text && n.color && phase48ContrastRatio(n.color,n.backgroundColor ?? document.backgroundColor)<4.5);
  if (lowContrast.length) suggestions.push(suggestion({action:"improve-accessibility",title:"Improve text contrast",explanation:"These text elements do not meet the recommended 4.5:1 contrast ratio.",severity:"critical",confidence:0.98,nodeIds:lowContrast.map(n=>n.id),changes:lowContrast.map(n=>({nodeId:n.id,property:"color",before:n.color,after:luminance(n.backgroundColor ?? document.backgroundColor)>0.45?"#0f172a":"#ffffff"}))}));
  const edgeNodes=nodes.filter((n)=>n.x<24||n.y<24||document.width-(n.x+n.width)<24||document.height-(n.y+n.height)<24);
  if (edgeNodes.length) suggestions.push(suggestion({action:"improve-spacing",title:"Add safer page margins",explanation:"Move important content away from trim and screen edges.",severity:"warning",confidence:0.88,nodeIds:edgeNodes.map(n=>n.id),changes:[]}));
  if (buttons.some((n)=>n.height<40)) suggestions.push(suggestion({action:"improve-accessibility",title:"Increase interactive target size",explanation:"Buttons should be at least 40 pixels high for easier interaction.",severity:"warning",confidence:0.94,nodeIds:buttons.filter(n=>n.height<40).map(n=>n.id),changes:buttons.filter(n=>n.height<40).map(n=>({nodeId:n.id,property:"height",before:n.height,after:44}))}));
  const typography=clamp(100-tinyText.length*12-weakHeadings.length*7);
  const accessibility=clamp(100-lowContrast.length*18-buttons.filter(n=>n.height<40).length*10);
  const layout=clamp(100-outOfBounds.length*25-edgeNodes.length*4);
  const spacing=clamp(100-edgeNodes.length*7);
  const uniqueColors=new Set(nodes.map(n=>n.color).filter(Boolean));
  const color=clamp(100-Math.max(0,uniqueColors.size-6)*6-lowContrast.length*10);
  const score=clamp((layout+typography+color+spacing+accessibility)/5);
  return {score,layout,typography,color,spacing,accessibility,suggestions};
}

export function applyPhase48Suggestion(document: Phase48DesignDocument, item: Phase48Suggestion): Phase48DesignDocument {
  const changesByNode=new Map<string, typeof item.changes>();
  item.changes.forEach((change)=>changesByNode.set(change.nodeId,[...(changesByNode.get(change.nodeId)??[]),change]));
  return {...document,nodes:document.nodes.map((node)=>{
    const changes=changesByNode.get(node.id); if(!changes) return node;
    return changes.reduce<Phase48DesignNode>((next,change)=>({...next,[change.property]:change.after}),node);
  })};
}

export function setPhase48SuggestionStatus(item: Phase48Suggestion, status: Phase48SuggestionStatus): Phase48Suggestion { return {...item,status}; }

export function createPhase48PremiumPass(document: Phase48DesignDocument): Phase48Suggestion[] {
  const headings=document.nodes.filter(n=>n.role==="heading");
  const bodies=document.nodes.filter(n=>n.role==="body");
  return [suggestion({action:"make-premium",title:"Apply premium editorial hierarchy",explanation:"Uses stronger display type, more deliberate body sizing, and refined contrast while preserving content.",severity:"info",confidence:0.86,nodeIds:[...headings,...bodies].map(n=>n.id),changes:[...headings.map(n=>({nodeId:n.id,property:"fontWeight" as const,before:n.fontWeight,after:"800"})),...bodies.map(n=>({nodeId:n.id,property:"color" as const,before:n.color,after:"#334155"}))]})];
}

export const PHASE48_DEMO_DOCUMENT: Phase48DesignDocument = {
  id:"phase48-demo",name:"Spring Campaign Flyer",width:816,height:1056,backgroundColor:"#ffffff",nodes:[
    {id:"title",type:"text",role:"heading",x:52,y:70,width:500,height:80,text:"Grow your business",fontSize:24,fontWeight:"700",color:"#94a3b8"},
    {id:"body",type:"text",role:"body",x:52,y:170,width:420,height:100,text:"Smart marketing services for ambitious teams.",fontSize:9,color:"#64748b"},
    {id:"cta",type:"button",role:"button",x:52,y:290,width:180,height:30,text:"Get started",fontSize:14,color:"#ffffff",backgroundColor:"#7c3aed"},
    {id:"footer",type:"text",role:"body",x:8,y:1018,width:400,height:24,text:"yaposan.com",fontSize:10,color:"#cbd5e1"},
  ]
};

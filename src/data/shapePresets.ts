import type { PublisherElementType } from "../types/publisher";

export type ShapePreset = {
  id: string; name: string; icon: string; type: PublisherElementType;
  width: number; height: number; fillColor: string; borderColor: string;
  borderWidth: number; borderRadius?: number; rotation?: number;
  shapeKind?: string; lineStyle?: "solid" | "dashed" | "dotted";
  gradient?: { type: "linear" | "radial"; colors: string[]; angle?: number };
  arrowStart?: boolean; arrowEnd?: boolean;
  category?: "Basic" | "Arrows" | "Flowchart" | "Callouts" | "Stars" | "Banners" | "Decorations" | "Business" | "Education";
  keywords?: string[];
};

const p = (id:string,name:string,icon:string,type:PublisherElementType,width:number,height:number,fillColor:string,borderColor:string,borderWidth=2,extra:Partial<ShapePreset>={}):ShapePreset => ({id,name,icon,type,width,height,fillColor,borderColor,borderWidth,...extra});

export const SHAPE_PRESETS: ShapePreset[] = [
  p("rectangle","Rectangle","▭","rectangle",240,150,"#14B8A6","#0F766E"),
  p("rounded","Rounded Rectangle","▢","rectangle",240,150,"#38BDF8","#0369A1",2,{borderRadius:28}),
  p("square","Square","□","rectangle",170,170,"#8B5CF6","#6D28D9"),
  p("circle","Circle","○","circle",180,180,"#F59E0B","#D97706"),
  p("oval","Oval","⬭","circle",250,145,"#EC4899","#BE185D"),
  p("triangle","Triangle","△","triangle",210,180,"#22C55E","#15803D"),
  p("diamond","Diamond","◇","rectangle",160,160,"#06B6D4","#0E7490",2,{rotation:45,shapeKind:"diamond"}),
  p("pentagon","Pentagon","⬠","star",190,190,"#6366F1","#4338CA",2,{shapeKind:"pentagon"}),
  p("hexagon","Hexagon","⬡","star",210,180,"#0EA5E9","#0369A1",2,{shapeKind:"hexagon"}),
  p("star","Star","☆","star",190,190,"#FACC15","#CA8A04"),
  p("heart","Heart","♡","star",190,180,"#F43F5E","#BE123C",2,{shapeKind:"heart"}),
  p("cloud","Cloud","☁","star",250,150,"#E0F2FE","#0284C7",2,{shapeKind:"cloud"}),
  p("speech","Speech Bubble","▱","rectangle",270,160,"#FFFFFF","#334155",2,{borderRadius:24,shapeKind:"speech"}),
  p("callout","Callout","▰","rectangle",280,150,"#FEF3C7","#D97706",2,{borderRadius:18,shapeKind:"callout"}),
  p("ribbon","Ribbon","⌁","rectangle",320,100,"#7C3AED","#5B21B6",2,{shapeKind:"ribbon"}),
  p("banner","Banner","▱","rectangle",330,96,"#0D9488","#0F766E",2,{borderRadius:10,shapeKind:"banner"}),
  p("arrow","Arrow","➜","arrow",270,110,"#2563EB","#1D4ED8",0),
  p("line","Line","—","line",290,28,"#334155","#334155",4),
  p("dashed-line","Dashed Line","--","line",290,28,"#475569","#475569",4,{lineStyle:"dashed"}),
  p("dotted-line","Dotted Line","··","line",290,28,"#64748B","#64748B",4,{lineStyle:"dotted"}),
  p("arrow-line","Arrow Line","→","line",300,30,"#2563EB","#2563EB",4,{arrowEnd:true}),
  p("double-arrow","Double Arrow","↔","line",300,30,"#7C3AED","#7C3AED",4,{arrowStart:true,arrowEnd:true}),
  p("curved-line","Curved Line","⌒","line",300,100,"#0F766E","#0F766E",4,{shapeKind:"curve"}),
  p("connector","Connector","⤴","line",300,120,"#334155","#334155",4,{shapeKind:"connector",arrowEnd:true}),
  p("elbow","Elbow Connector","⌐","line",300,120,"#334155","#334155",4,{shapeKind:"elbow",arrowEnd:true}),
  p("gradient-card","Gradient Card","▰","rectangle",280,170,"#2563EB","#1E3A8A",0,{borderRadius:24,gradient:{type:"linear",colors:["#2563EB","#7C3AED"],angle:45}}),
  p("pie","Pie","◔","circle",190,190,"#F59E0B","#B45309",2,{shapeKind:"pie",category:"Basic"}),
  p("arc","Arc","⌒","line",220,130,"transparent","#2563EB",5,{shapeKind:"arc",category:"Basic"}),
  p("donut","Donut","◉","circle",190,190,"#14B8A6","#0F766E",2,{shapeKind:"donut",category:"Basic"}),
  p("moon","Moon","☾","star",170,190,"#6366F1","#4338CA",2,{shapeKind:"moon",category:"Decorations"}),
  p("lightning","Lightning","ϟ","star",150,210,"#FACC15","#CA8A04",2,{shapeKind:"lightning",category:"Decorations"}),
  p("chevron","Chevron","❯","arrow",230,120,"#0EA5E9","#0369A1",2,{shapeKind:"chevron",category:"Arrows"}),
  p("cube","Cube","◇","star",190,190,"#8B5CF6","#6D28D9",2,{shapeKind:"cube",category:"Business"}),
  p("bracket","Bracket","[ ]","line",210,170,"transparent","#334155",4,{shapeKind:"bracket",category:"Basic"}),
  p("cross","Cross","✚","star",180,180,"#EF4444","#B91C1C",2,{shapeKind:"cross",category:"Basic"}),
  p("flow-process","Process","▭","rectangle",250,120,"#DBEAFE","#2563EB",2,{borderRadius:8,shapeKind:"flow-process",category:"Flowchart"}),
  p("flow-decision","Decision","◇","rectangle",180,180,"#FEF3C7","#D97706",2,{rotation:45,shapeKind:"flow-decision",category:"Flowchart"}),
  p("flow-database","Database","▥","rectangle",220,150,"#DCFCE7","#16A34A",2,{borderRadius:26,shapeKind:"flow-database",category:"Flowchart"}),
  p("flow-document","Document","▱","rectangle",240,150,"#FCE7F3","#DB2777",2,{shapeKind:"flow-document",category:"Flowchart"}),
  p("timeline-node","Timeline Node","●","circle",44,44,"#0D9488","#115E59",2,{category:"Business"}),
  p("org-card","Org Chart Card","▭","rectangle",240,120,"#FFFFFF","#64748B",2,{borderRadius:14,shapeKind:"org-card",category:"Business"}),
  p("education-label","Education Label","▰","rectangle",280,88,"#E0F2FE","#0284C7",2,{borderRadius:18,shapeKind:"education-label",category:"Education"}),
];

export type DrawingTool = "select" | "pen" | "node" | "pencil" | "brush" | "calligraphy" | "marker" | "crayon" | "airbrush" | "highlighter" | "eraser";

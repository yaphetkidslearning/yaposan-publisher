export type ColorSpace = "RGB" | "CMYK" | "LAB" | "GRAY" | "SPOT";
export type RenderingIntent = "perceptual" | "relative-colorimetric" | "absolute-colorimetric" | "saturation";
export type IccProfileClass = "display" | "input" | "output" | "device-link" | "abstract";

export type IccProfile = {
  id: string;
  name: string;
  colorSpace: Exclude<ColorSpace, "SPOT">;
  profileClass: IccProfileClass;
  version: string;
  description: string;
  source: "built-in" | "embedded" | "imported";
  checksum?: string;
};

export type RgbColor = { space: "RGB"; r: number; g: number; b: number; alpha?: number };
export type CmykColor = { space: "CMYK"; c: number; m: number; y: number; k: number; alpha?: number };
export type LabColor = { space: "LAB"; l: number; a: number; b: number; alpha?: number };
export type GrayColor = { space: "GRAY"; gray: number; alpha?: number };
export type SpotColor = { space: "SPOT"; name: string; tint: number; alternate: CmykColor; library?: string };
export type ManagedColor = RgbColor | CmykColor | LabColor | GrayColor | SpotColor;

export type InkLimit = { totalAreaCoverage: number; blackStart: number; blackMaximum: number };
export type ColorManagementSettings = {
  workingRgbProfileId: string;
  workingCmykProfileId: string;
  grayProfileId: string;
  renderingIntent: RenderingIntent;
  blackPointCompensation: boolean;
  preserveBlack: boolean;
  preserveSpotColors: boolean;
  simulatePaperColor: boolean;
  simulateBlackInk: boolean;
  overprintPreview: boolean;
  softProofEnabled: boolean;
  inkLimit: InkLimit;
};

export type SpotLibraryColor = { id: string; name: string; cmyk: CmykColor; rgb: RgbColor; category: string };
export type SeparationPlate = { id: string; name: string; kind: "process" | "spot"; coverage: number; overprintObjects: number };
export type ColorIssue = { id: string; severity: "error" | "warning" | "info"; message: string; fix: string };
export type ColorAuditInput = { colors: ManagedColor[]; outputProfileId?: string; embeddedProfileIds?: string[]; hasTransparency?: boolean };
export type ColorAuditReport = { score: number; processColors: number; spotColors: number; maximumTac: number; plates: SeparationPlate[]; issues: ColorIssue[] };

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const channel = (value: number) => Math.round(clamp(value, 0, 255));
const round = (value: number, places = 2) => Number(value.toFixed(places));

export const BUILT_IN_ICC_PROFILES: IccProfile[] = [
  { id: "srgb-v4", name: "sRGB IEC61966-2.1", colorSpace: "RGB", profileClass: "display", version: "4.3", description: "Standard web and general-purpose RGB working space.", source: "built-in" },
  { id: "display-p3", name: "Display P3", colorSpace: "RGB", profileClass: "display", version: "4.3", description: "Wide-gamut display RGB working space.", source: "built-in" },
  { id: "adobe-rgb-1998", name: "Adobe RGB (1998)", colorSpace: "RGB", profileClass: "display", version: "2.1", description: "Wide-gamut RGB space used in print workflows.", source: "built-in" },
  { id: "fogra39", name: "Coated FOGRA39", colorSpace: "CMYK", profileClass: "output", version: "2.1", description: "ISO 12647-2 coated offset reference condition.", source: "built-in" },
  { id: "fogra51", name: "PSO Coated v3 (FOGRA51)", colorSpace: "CMYK", profileClass: "output", version: "4.3", description: "Modern coated offset printing condition.", source: "built-in" },
  { id: "gracol2013", name: "GRACoL 2013 CRPC6", colorSpace: "CMYK", profileClass: "output", version: "4.3", description: "North American grade-one coated commercial printing.", source: "built-in" },
  { id: "swop2013", name: "SWOP 2013 CRPC5", colorSpace: "CMYK", profileClass: "output", version: "4.3", description: "North American publication printing condition.", source: "built-in" },
  { id: "gray-g22", name: "Gray Gamma 2.2", colorSpace: "GRAY", profileClass: "display", version: "4.3", description: "General-purpose grayscale working space.", source: "built-in" },
];

export const DEFAULT_COLOR_MANAGEMENT_SETTINGS: ColorManagementSettings = {
  workingRgbProfileId: "srgb-v4",
  workingCmykProfileId: "gracol2013",
  grayProfileId: "gray-g22",
  renderingIntent: "relative-colorimetric",
  blackPointCompensation: true,
  preserveBlack: true,
  preserveSpotColors: true,
  simulatePaperColor: false,
  simulateBlackInk: true,
  overprintPreview: true,
  softProofEnabled: true,
  inkLimit: { totalAreaCoverage: 300, blackStart: 70, blackMaximum: 95 },
};

export const PANTONE_ESSENTIAL_LIBRARY: SpotLibraryColor[] = [
  { id: "pantone-186-c", name: "PANTONE 186 C", cmyk: { space: "CMYK", c: 2, m: 100, y: 85, k: 6 }, rgb: { space: "RGB", r: 200, g: 16, b: 46 }, category: "Solid Coated" },
  { id: "pantone-286-c", name: "PANTONE 286 C", cmyk: { space: "CMYK", c: 100, m: 75, y: 0, k: 0 }, rgb: { space: "RGB", r: 0, g: 51, b: 160 }, category: "Solid Coated" },
  { id: "pantone-347-c", name: "PANTONE 347 C", cmyk: { space: "CMYK", c: 93, m: 0, y: 100, k: 0 }, rgb: { space: "RGB", r: 0, g: 154, b: 68 }, category: "Solid Coated" },
  { id: "pantone-123-c", name: "PANTONE 123 C", cmyk: { space: "CMYK", c: 0, m: 19, y: 89, k: 0 }, rgb: { space: "RGB", r: 255, g: 199, b: 44 }, category: "Solid Coated" },
  { id: "pantone-black-c", name: "PANTONE Black C", cmyk: { space: "CMYK", c: 63, m: 62, y: 59, k: 94 }, rgb: { space: "RGB", r: 45, g: 41, b: 38 }, category: "Solid Coated" },
  { id: "pantone-cool-gray-7-c", name: "PANTONE Cool Gray 7 C", cmyk: { space: "CMYK", c: 20, m: 14, y: 12, k: 40 }, rgb: { space: "RGB", r: 151, g: 153, b: 155 }, category: "Solid Coated" },
];

export function rgbToCmyk(color: RgbColor): CmykColor {
  const r = channel(color.r) / 255, g = channel(color.g) / 255, b = channel(color.b) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.9999) return { space: "CMYK", c: 0, m: 0, y: 0, k: 100, alpha: color.alpha };
  return { space: "CMYK", c: round(((1-r-k)/(1-k))*100), m: round(((1-g-k)/(1-k))*100), y: round(((1-b-k)/(1-k))*100), k: round(k*100), alpha: color.alpha };
}

export function cmykToRgb(color: CmykColor): RgbColor {
  const c=clamp(color.c)/100,m=clamp(color.m)/100,y=clamp(color.y)/100,k=clamp(color.k)/100;
  return { space:"RGB", r:channel(255*(1-c)*(1-k)), g:channel(255*(1-m)*(1-k)), b:channel(255*(1-y)*(1-k)), alpha:color.alpha };
}

function pivotRgb(value:number){const n=value/255;return n<=0.04045?n/12.92:Math.pow((n+0.055)/1.055,2.4)}
function pivotXyz(value:number){return value>0.008856?Math.cbrt(value):(7.787*value)+(16/116)}
export function rgbToLab(color: RgbColor): LabColor {
  const r=pivotRgb(channel(color.r)),g=pivotRgb(channel(color.g)),b=pivotRgb(channel(color.b));
  const x=(r*0.4124+g*0.3576+b*0.1805)/0.95047,y=(r*0.2126+g*0.7152+b*0.0722),z=(r*0.0193+g*0.1192+b*0.9505)/1.08883;
  const fx=pivotXyz(x),fy=pivotXyz(y),fz=pivotXyz(z);
  return { space:"LAB", l:round((116*fy)-16), a:round(500*(fx-fy)), b:round(200*(fy-fz)), alpha:color.alpha };
}

export function convertManagedColor(color: ManagedColor, target: Exclude<ColorSpace,"SPOT">): ManagedColor {
  if (color.space===target) return color;
  const source = color.space === "SPOT" ? color.alternate : color;
  let rgb: RgbColor;
  if(source.space==="RGB") rgb=source;
  else if(source.space==="CMYK") rgb=cmykToRgb(source);
  else if(source.space==="GRAY") { const value=channel(255*(1-clamp(source.gray)/100)); rgb={space:"RGB",r:value,g:value,b:value,alpha:source.alpha}; }
  else { const gray=channel((clamp(source.l)/100)*255); rgb={space:"RGB",r:gray,g:gray,b:gray,alpha:source.alpha}; }
  if(target==="RGB") return rgb;
  if(target==="CMYK") return rgbToCmyk(rgb);
  if(target==="LAB") return rgbToLab(rgb);
  return {space:"GRAY",gray:round(100-(0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b)/255*100),alpha:rgb.alpha};
}

export function totalAreaCoverage(color: ManagedColor): number {
  const cmyk = (convertManagedColor(color,"CMYK") as CmykColor);
  return round(cmyk.c+cmyk.m+cmyk.y+cmyk.k);
}

export function applyInkLimit(color:CmykColor, limit:InkLimit):CmykColor {
  const values=[clamp(color.c),clamp(color.m),clamp(color.y),clamp(color.k)];
  const total=values.reduce((sum,value)=>sum+value,0);
  if(total<=limit.totalAreaCoverage) return {...color,c:values[0],m:values[1],y:values[2],k:Math.min(values[3],limit.blackMaximum)};
  const maxK=Math.min(values[3],limit.blackMaximum), available=Math.max(0,limit.totalAreaCoverage-maxK), chroma=values[0]+values[1]+values[2],scale=chroma?available/chroma:0;
  return {...color,c:round(values[0]*scale),m:round(values[1]*scale),y:round(values[2]*scale),k:round(maxK)};
}

export function buildSeparations(colors:ManagedColor[]):SeparationPlate[] {
  const processNames=["Cyan","Magenta","Yellow","Black"] as const;
  const cmyk=colors.map((color)=>convertManagedColor(color,"CMYK") as CmykColor);
  const process=processNames.map((name,index)=>({id:`process-${name.toLowerCase()}`,name,kind:"process" as const,coverage:round(cmyk.reduce((sum,color)=>sum+[color.c,color.m,color.y,color.k][index],0)/Math.max(1,cmyk.length)),overprintObjects:0}));
  const spots=[...new Set(colors.filter((color):color is SpotColor=>color.space==="SPOT").map((color)=>color.name))].map((name)=>({id:`spot-${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,name,kind:"spot" as const,coverage:round(colors.filter((color)=>color.space==="SPOT"&&color.name===name).reduce((sum,color)=>sum+(color as SpotColor).tint,0)/Math.max(1,colors.length)),overprintObjects:0}));
  return [...process,...spots];
}

export function auditColorWorkflow(input:ColorAuditInput,settings:ColorManagementSettings=DEFAULT_COLOR_MANAGEMENT_SETTINGS):ColorAuditReport {
  const issues:ColorIssue[]=[];
  const maximumTac=Math.max(0,...input.colors.map(totalAreaCoverage));
  if(!input.outputProfileId) issues.push({id:"missing-output-profile",severity:"error",message:"No output ICC profile is assigned.",fix:"Assign the target press or proofing ICC profile."});
  if(maximumTac>settings.inkLimit.totalAreaCoverage) issues.push({id:"ink-limit",severity:"error",message:`Maximum ink coverage is ${maximumTac}% (limit ${settings.inkLimit.totalAreaCoverage}%).`,fix:"Apply the output profile ink limit or reduce rich-black values."});
  const rgbCount=input.colors.filter((color)=>color.space==="RGB").length;
  if(rgbCount) issues.push({id:"rgb-in-print",severity:"warning",message:`${rgbCount} RGB color${rgbCount===1?"":"s"} require output conversion.`,fix:"Convert to the document CMYK profile using the selected rendering intent."});
  if(input.hasTransparency) issues.push({id:"transparency",severity:"info",message:"Transparency is present and may affect legacy print workflows.",fix:"Use a modern PDF/X-4 workflow or preview flattening."});
  const spots=input.colors.filter((color)=>color.space==="SPOT").length;
  if(spots&&!settings.preserveSpotColors) issues.push({id:"spot-conversion",severity:"warning",message:"Spot colors are configured for process conversion.",fix:"Enable Preserve Spot Colors when separate spot plates are required."});
  const penalty=issues.reduce((sum,issue)=>sum+(issue.severity==="error"?25:issue.severity==="warning"?10:3),0);
  return {score:Math.max(0,100-penalty),processColors:input.colors.length-spots,spotColors:spots,maximumTac,plates:buildSeparations(input.colors),issues};
}

export function createSpotColor(entry:SpotLibraryColor,tint=100):SpotColor{return {space:"SPOT",name:entry.name,tint:clamp(tint),alternate:entry.cmyk,library:entry.category}}
export function colorToCss(color:ManagedColor):string{const rgb=convertManagedColor(color,"RGB") as RgbColor;return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}

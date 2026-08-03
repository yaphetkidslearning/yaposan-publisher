import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type DocumentViewMode = "single" | "facing" | "book" | "magazine";
export type SectionBreakKind = "next-page" | "continuous" | "even-page" | "odd-page";
export type PageNumberStyle = "arabic" | "roman-upper" | "roman-lower" | "letters-upper" | "letters-lower";
export type PageSide = "single" | "left" | "right";

export type DocumentSection = {
  id: string;
  name: string;
  description?: string;
  pageIds: string[];
  breakKind: SectionBreakKind;
  numbering: { style: PageNumberStyle; startAt: number; prefix: string; continueFromPrevious: boolean };
  color: string;
  icon: string;
  locked: boolean;
  hidden: boolean;
  collapsed: boolean;
  notes?: string;
  masterSpreadId?: string;
  createdAt: number;
  updatedAt: number;
};

export type PublicationMetadata = {
  title: string; author: string; company: string; keywords: string[]; subject: string;
  description: string; language: string; publisher: string; copyright: string;
  license: string; revision: number;
};

export type DocumentFoundationState = {
  version: "21.0";
  viewMode: DocumentViewMode;
  sections: DocumentSection[];
  metadata: PublicationMetadata;
  createdAt: number;
  updatedAt: number;
};

export type PageNumberInfo = { pageId: string; sectionId: string; rawNumber: number; display: string; side: PageSide };
export type DocumentStatistics = {
  pages: number; sections: number; elements: number; words: number; characters: number;
  paragraphs: number; images: number; tables: number; shapes: number; charts: number;
  animations: number; links: number; fonts: number; assets: number;
};
export type NavigatorResult = { id: string; kind: "section" | "page" | "object" | "text"; label: string; pageId?: string; elementId?: string; sectionId?: string };

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"];
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const baseMetadata = (project: PublisherProject): PublicationMetadata => ({
  title: project.name, author: project.author ?? "", company: "", keywords: project.tags ?? [], subject: "",
  description: project.description ?? "", language: "en", publisher: "", copyright: "", license: "", revision: 1,
});

export function createDocumentFoundation(project: PublisherProject): DocumentFoundationState {
  const now = Date.now();
  return { version: "21.0", viewMode: "single", createdAt: now, updatedAt: now, metadata: baseMetadata(project), sections: [{
    id: uid("section"), name: "Main Document", description: "Primary publication section", pageIds: project.pages.map(page => page.id),
    breakKind: "next-page", numbering: { style: "arabic", startAt: 1, prefix: "", continueFromPrevious: false }, color: COLORS[0], icon: "document-text",
    locked: false, hidden: false, collapsed: false, createdAt: now, updatedAt: now,
  }] };
}

export function normalizeDocumentFoundation(project: PublisherProject): PublisherProject {
  const current = project.documentFoundation ?? createDocumentFoundation(project);
  const pageIds = new Set(project.pages.map(page => page.id));
  const claimed = new Set<string>();
  const sections = current.sections.map((section, index) => ({ ...section, color: section.color || COLORS[index % COLORS.length], pageIds: section.pageIds.filter(id => pageIds.has(id) && !claimed.has(id)).map(id => (claimed.add(id), id)) }));
  const unassigned = project.pages.filter(page => !claimed.has(page.id)).map(page => page.id);
  if (!sections.length) return { ...project, documentFoundation: createDocumentFoundation(project), phase21Version: "21.0" };
  if (unassigned.length) sections[sections.length - 1] = { ...sections[sections.length - 1], pageIds: [...sections[sections.length - 1].pageIds, ...unassigned] };
  return { ...project, phase21Version: "21.0", documentFoundation: { ...current, version: "21.0", sections, updatedAt: Date.now() } };
}

export function updateDocumentSettings(project: PublisherProject, updates: Partial<Pick<DocumentFoundationState, "viewMode" | "metadata">>): PublisherProject {
  const normalized = normalizeDocumentFoundation(project); const state = normalized.documentFoundation!;
  return { ...normalized, updatedAt: Date.now(), documentFoundation: { ...state, ...updates, metadata: updates.metadata ? { ...state.metadata, ...updates.metadata } : state.metadata, updatedAt: Date.now() } };
}

export function addDocumentSection(project: PublisherProject, name: string, pageIds: string[] = []): PublisherProject {
  const normalized = normalizeDocumentFoundation(project); const state = normalized.documentFoundation!; const now = Date.now();
  const moved = new Set(pageIds);
  const sections = state.sections.map(section => ({ ...section, pageIds: section.pageIds.filter(id => !moved.has(id)) }));
  sections.push({ id: uid("section"), name: name.trim() || `Section ${sections.length + 1}`, pageIds, breakKind: "next-page", numbering: { style: "arabic", startAt: 1, prefix: "", continueFromPrevious: true }, color: COLORS[sections.length % COLORS.length], icon: "bookmark", locked: false, hidden: false, collapsed: false, createdAt: now, updatedAt: now });
  return { ...normalized, updatedAt: now, documentFoundation: { ...state, sections, updatedAt: now } };
}

export function updateDocumentSection(project: PublisherProject, sectionId: string, updates: Partial<DocumentSection>): PublisherProject {
  const normalized = normalizeDocumentFoundation(project); const state = normalized.documentFoundation!;
  return { ...normalized, updatedAt: Date.now(), documentFoundation: { ...state, sections: state.sections.map(section => section.id === sectionId ? { ...section, ...updates, id: section.id, updatedAt: Date.now() } : section), updatedAt: Date.now() } };
}

export function deleteDocumentSection(project: PublisherProject, sectionId: string): PublisherProject {
  const normalized = normalizeDocumentFoundation(project); const state = normalized.documentFoundation!;
  if (state.sections.length <= 1) throw new Error("A publication must contain at least one section.");
  const index = state.sections.findIndex(section => section.id === sectionId); if (index < 0) return normalized;
  const removed = state.sections[index]; if (removed.locked) throw new Error("Unlock the section before deleting it.");
  const targetIndex = index > 0 ? index - 1 : 1; const targetId = state.sections[targetIndex].id;
  const sections = state.sections.filter(section => section.id !== sectionId).map(section => section.id === targetId ? { ...section, pageIds: [...section.pageIds, ...removed.pageIds], updatedAt: Date.now() } : section);
  return { ...normalized, updatedAt: Date.now(), documentFoundation: { ...state, sections, updatedAt: Date.now() } };
}

export function moveDocumentSection(project: PublisherProject, sectionId: string, direction: -1 | 1): PublisherProject {
  const normalized = normalizeDocumentFoundation(project); const state = normalized.documentFoundation!; const sections = [...state.sections];
  const from = sections.findIndex(section => section.id === sectionId); const to = from + direction; if (from < 0 || to < 0 || to >= sections.length) return normalized;
  [sections[from], sections[to]] = [sections[to], sections[from]];
  const pageById = new Map(normalized.pages.map(page => [page.id, page]));
  const ordered = sections.flatMap(section => section.pageIds.map(id => pageById.get(id)).filter((page): page is PublisherPage => Boolean(page)));
  return { ...normalized, pages: ordered, activePageId: normalized.activePageId, updatedAt: Date.now(), documentFoundation: { ...state, sections, updatedAt: Date.now() } };
}

export function movePageToSection(project: PublisherProject, pageId: string, sectionId: string, position?: number): PublisherProject {
  const normalized = normalizeDocumentFoundation(project); const state = normalized.documentFoundation!;
  if (!normalized.pages.some(page => page.id === pageId)) throw new Error("Page does not exist.");
  if (!state.sections.some(section => section.id === sectionId)) throw new Error("Section does not exist.");
  const sections = state.sections.map(section => {
    const without = section.pageIds.filter(id => id !== pageId); if (section.id !== sectionId) return { ...section, pageIds: without };
    const at = Math.max(0, Math.min(position ?? without.length, without.length)); return { ...section, pageIds: [...without.slice(0, at), pageId, ...without.slice(at)], updatedAt: Date.now() };
  });
  const pageById = new Map(normalized.pages.map(page => [page.id, page]));
  return { ...normalized, pages: sections.flatMap(section => section.pageIds.map(id => pageById.get(id)).filter((page): page is PublisherPage => Boolean(page))), updatedAt: Date.now(), documentFoundation: { ...state, sections, updatedAt: Date.now() } };
}

function roman(value: number) { const pairs: Array<[number,string]> = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; let n=Math.max(1,value), out=""; for (const [v,s] of pairs) while(n>=v){out+=s;n-=v;} return out; }
function letters(value: number) { let n=Math.max(1,value), out=""; while(n){n--;out=String.fromCharCode(65+(n%26))+out;n=Math.floor(n/26);} return out; }
export function formatPageNumber(value: number, style: PageNumberStyle) { if(style==="roman-upper")return roman(value); if(style==="roman-lower")return roman(value).toLowerCase(); if(style==="letters-upper")return letters(value); if(style==="letters-lower")return letters(value).toLowerCase(); return String(value); }

export function buildPageNumberMap(project: PublisherProject): PageNumberInfo[] {
  const normalized = normalizeDocumentFoundation(project); const state = normalized.documentFoundation!; const results: PageNumberInfo[]=[]; let previous=0; let absolute=0;
  for(const section of state.sections){ let number=section.numbering.continueFromPrevious ? previous+1 : Math.max(1,section.numbering.startAt); for(const pageId of section.pageIds){ absolute++; const side: PageSide = state.viewMode === "single" ? "single" : absolute % 2 === 0 ? "left" : "right"; results.push({pageId,sectionId:section.id,rawNumber:number,display:`${section.numbering.prefix}${formatPageNumber(number,section.numbering.style)}`,side}); previous=number; number++; } }
  return results;
}

const textOf = (element: PublisherElement) => typeof element.text === "string" ? element.text : "";
export function calculateDocumentStatistics(project: PublisherProject): DocumentStatistics {
  const normalized=normalizeDocumentFoundation(project); const elements=normalized.pages.flatMap(page=>page.elements); const text=elements.map(textOf).filter(Boolean).join("\n");
  const words=(text.match(/\S+/g)??[]).length; const fonts=new Set(elements.map(item=>item.fontFamily).filter(Boolean));
  return { pages:normalized.pages.length, sections:normalized.documentFoundation!.sections.length, elements:elements.length, words, characters:text.length, paragraphs:text ? text.split(/\n+/).filter(Boolean).length : 0, images:elements.filter(e=>e.type==="image").length, tables:elements.filter(e=>e.type==="table").length, shapes:elements.filter(e=>["rectangle","circle","shape","line"].includes(e.type)).length, charts:elements.filter(e=>Boolean(e.chartType)).length, animations:elements.reduce((n,e)=>n+(e.animations?.length??0),0), links:elements.filter(e=>Boolean(e.hyperlink)).length, fonts:fonts.size, assets:elements.filter(e=>Boolean(e.assetId)).length };
}

export function searchDocument(project: PublisherProject, query: string): NavigatorResult[] {
  const normalized=normalizeDocumentFoundation(project); const q=query.trim().toLowerCase(); if(!q)return [];
  const sectionByPage=new Map(normalized.documentFoundation!.sections.flatMap(section=>section.pageIds.map(id=>[id,section.id] as const))); const out:NavigatorResult[]=[];
  normalized.documentFoundation!.sections.forEach(section=>{if(`${section.name} ${section.description??""} ${section.notes??""}`.toLowerCase().includes(q))out.push({id:section.id,kind:"section",label:section.name,sectionId:section.id,pageId:section.pageIds[0]});});
  normalized.pages.forEach((page,index)=>{if(`${page.name??""} page ${index+1}`.toLowerCase().includes(q))out.push({id:page.id,kind:"page",label:page.name??`Page ${index+1}`,pageId:page.id,sectionId:sectionByPage.get(page.id)}); page.elements.forEach(element=>{const label=textOf(element)||element.name||element.type;if(`${label} ${element.type}`.toLowerCase().includes(q))out.push({id:`${page.id}-${element.id}`,kind:textOf(element)?"text":"object",label:label.slice(0,80),pageId:page.id,elementId:element.id,sectionId:sectionByPage.get(page.id)});});}); return out.slice(0,100);
}

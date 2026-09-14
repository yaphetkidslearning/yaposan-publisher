import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, TemplateMetadata, TemplateOrientation } from "./types";

export type MasterTemplateStyle = "corporate" | "luxury" | "minimal" | "creative" | "editorial" | "bold" | "elegant";
export type MasterTemplateKind = "business-card" | "letterhead" | "invoice" | "brochure" | "flyer" | "certificate" | "postcard" | "calendar" | "newsletter" | "social-media" | "marketing" | "corporate";

export type MasterTemplateDefinition = {
  id: string;
  name: string;
  kind: MasterTemplateKind;
  category: TemplateMetadata["category"];
  subcategory: string;
  industry: string;
  style: MasterTemplateStyle;
  pageSize: string;
  orientation: TemplateOrientation;
  width: number;
  height: number;
  description: string;
  tags: string[];
  palette: { background: string; surface: string; primary: string; accent: string; text: string; muted: string };
  fonts: { heading: string; body: string };
  pages: Array<{ name: string; elements: PublisherElement[] }>;
};

export type MasterTemplateAudit = {
  score: number;
  errors: string[];
  warnings: string[];
  signatures: string[];
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const signature = (page: MasterTemplateDefinition["pages"][number]) => page.elements
  .map(item => `${item.type}:${Math.round(item.x)}:${Math.round(item.y)}:${Math.round(item.width)}:${Math.round(item.height)}`)
  .sort().join("|");

export function auditMasterTemplate(master: MasterTemplateDefinition): MasterTemplateAudit {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!master.pages.length) errors.push("A master template must contain at least one page.");
  if (master.name.trim().length < 4) errors.push("Master template name is too short.");
  if (master.tags.length < 4) warnings.push("Add more discovery tags.");
  const signatures = master.pages.map(signature);
  if (new Set(signatures).size !== signatures.length) warnings.push("Two or more pages use the same structural layout.");
  master.pages.forEach((page, pageIndex) => {
    const ids = page.elements.map(element => element.id);
    if (new Set(ids).size !== ids.length) errors.push(`Page ${pageIndex + 1} contains duplicate element IDs.`);
    if (!page.elements.some(element => element.type === "text")) warnings.push(`Page ${pageIndex + 1} has no editable text.`);
  });
  return { score: Math.max(0, 100 - errors.length * 25 - warnings.length * 6), errors, warnings, signatures };
}

export function compileMasterTemplate(master: MasterTemplateDefinition, access: TemplateMetadata["access"] = "free"): ProfessionalTemplate {
  const audit = auditMasterTemplate(master);
  if (audit.errors.length) throw new Error(`Master template validation failed: ${audit.errors.join(" ")}`);
  const now = "2026-07-28T00:00:00.000Z";
  const pages: PublisherPage[] = master.pages.map((page, pageIndex) => ({
    id: `${master.id}-page-${pageIndex + 1}`,
    name: page.name,
    width: master.width,
    height: master.height,
    orientation: master.orientation === "square" ? "portrait" : master.orientation,
    sizeKey: "custom",
    backgroundColor: master.palette.background,
    margin: 32,
    bleed: 12,
    elements: clone(page.elements),
  }));
  return {
    metadata: {
      id: master.id,
      name: master.name,
      category: master.category,
      subcategory: master.subcategory,
      industry: master.industry,
      description: master.description,
      tags: [...master.tags, master.style, master.kind, "master-template", "phase-24.3a"],
      pageSize: master.pageSize,
      orientation: master.orientation,
      previewColor: master.palette.primary,
      author: "Yaposan Design Studio",
      version: "24.3A",
      editable: true,
      featured: true,
      access,
      createdAt: now,
      updatedAt: now,
      themeId: `${master.style}-${master.palette.primary.replace("#", "").toLowerCase()}`,
      supportedThemeIds: [master.style, "brand-kit", "custom"],
      style: master.style,
      masterTemplateId: master.id,
      palette: Object.values(master.palette),
      fonts: [master.fonts.heading, master.fonts.body],
      qualityScore: audit.score,
    },
    pages,
  };
}

export function createMasterVariant(master: MasterTemplateDefinition, options: {
  id: string; name: string; industry?: string; palette?: Partial<MasterTemplateDefinition["palette"]>;
}): MasterTemplateDefinition {
  return {
    ...clone(master),
    id: options.id,
    name: options.name,
    industry: options.industry ?? master.industry,
    palette: { ...master.palette, ...options.palette },
    tags: [...master.tags, "curated-variant"],
    pages: master.pages.map((page, pageIndex) => ({
      ...page,
      elements: page.elements.map(element => ({ ...element, id: `${options.id}-p${pageIndex + 1}-${element.id}` })),
    })),
  };
}

import type { ProfessionalTemplate, TemplateAccess, TemplateOrientation } from "./types";

export type TemplateViewMode = "large-grid" | "compact-grid" | "list";
export type TemplateSortMode = "featured" | "newest" | "name" | "quality";

export type BrowserFilters = {
  query: string;
  subcategory: string;
  industry: string;
  style: string;
  orientation: "all" | TemplateOrientation;
  access: "all" | TemplateAccess;
  favoritesOnly: boolean;
  sort: TemplateSortMode;
};

export const DEFAULT_BROWSER_FILTERS: BrowserFilters = {
  query: "",
  subcategory: "All",
  industry: "All",
  style: "All",
  orientation: "all",
  access: "all",
  favoritesOnly: false,
  sort: "featured",
};

const normalized = (value: string | undefined) => (value ?? "").trim().toLowerCase();

export function getBrowserFacets(templates: ProfessionalTemplate[]) {
  const unique = (values: Array<string | undefined>) => Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())))).sort();
  return {
    subcategories: ["All", ...unique(templates.map(template => template.metadata.subcategory))],
    industries: ["All", ...unique(templates.map(template => template.metadata.industry))],
    styles: ["All", ...unique(templates.map(template => template.metadata.style))],
  };
}

export function filterProfessionalTemplates(
  templates: ProfessionalTemplate[],
  filters: BrowserFilters,
  favorites: ReadonlySet<string>,
): ProfessionalTemplate[] {
  const query = normalized(filters.query);
  const result = templates.filter(template => {
    const metadata = template.metadata;
    const searchable = [
      metadata.name,
      metadata.description,
      metadata.category,
      metadata.subcategory,
      metadata.industry,
      metadata.style,
      metadata.pageSize,
      ...metadata.tags,
    ].map(normalized).join(" ");

    if (query && !searchable.includes(query)) return false;
    if (filters.subcategory !== "All" && metadata.subcategory !== filters.subcategory) return false;
    if (filters.industry !== "All" && metadata.industry !== filters.industry) return false;
    if (filters.style !== "All" && metadata.style !== filters.style) return false;
    if (filters.orientation !== "all" && metadata.orientation !== filters.orientation) return false;
    if (filters.access !== "all" && (metadata.access ?? "free") !== filters.access) return false;
    if (filters.favoritesOnly && !favorites.has(metadata.id)) return false;
    return true;
  });

  return result.sort((left, right) => {
    const a = left.metadata;
    const b = right.metadata;
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    if (filters.sort === "newest") return b.updatedAt.localeCompare(a.updatedAt);
    if (filters.sort === "quality") return (b.qualityScore ?? 0) - (a.qualityScore ?? 0) || a.name.localeCompare(b.name);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.qualityScore ?? 0) - (a.qualityScore ?? 0) || a.name.localeCompare(b.name);
  });
}

export function describeTemplate(template: ProfessionalTemplate) {
  const metadata = template.metadata;
  return {
    pageCount: template.pages.length,
    editableElementCount: template.pages.reduce((total, page) => total + page.elements.length, 0),
    palette: metadata.palette ?? [metadata.previewColor],
    fonts: metadata.fonts ?? [],
    access: metadata.access ?? "free",
    qualityScore: metadata.qualityScore ?? 0,
  };
}

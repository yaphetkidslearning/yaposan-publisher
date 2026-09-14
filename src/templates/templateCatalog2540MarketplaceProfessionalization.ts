import type { ProfessionalTemplate } from "./types";

const PREMIUM_CATEGORIES = new Set(["Business", "Fashion", "Real Estate", "Technology", "Marketing"]);

export function prepareTemplateMarketplace(templates: ProfessionalTemplate[]): ProfessionalTemplate[] {
  return templates.map((template, index) => ({
    ...template,
    metadata: {
      ...template.metadata,
      version: "25.40",
      updatedAt: `2026-07-${String(29 - (index % 18)).padStart(2, "0")}T12:00:00.000Z`,
      featured: template.metadata.featured ?? index % 4 === 0,
      trending: template.metadata.trending ?? index % 6 === 0,
      access: template.metadata.access ?? (PREMIUM_CATEGORIES.has(template.metadata.category) && index % 5 === 0 ? "premium" : "free"),
      qualityScore: Math.max(94, template.metadata.qualityScore ?? 0),
      tags: [...new Set([...template.metadata.tags, "marketplace ready", "curated", ""])],
    },
  }));
}

export function auditTemplateMarketplace(templates: ProfessionalTemplate[]) {
  return {
    total: templates.length,
    featured: templates.filter(t => t.metadata.featured).length,
    trending: templates.filter(t => t.metadata.trending).length,
    premium: templates.filter(t => t.metadata.access === "premium" || t.metadata.access === "team").length,
    free: templates.filter(t => (t.metadata.access ?? "free") === "free").length,
    categories: new Set(templates.map(t => t.metadata.category)).size,
  };
}

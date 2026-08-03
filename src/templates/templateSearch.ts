import type { ProfessionalTemplate, TemplateQuery, TemplateUsageRecord } from "./types";

const normalized = (value: string) => value.toLowerCase().trim();

export function searchTemplates(templates: ProfessionalTemplate[], query: TemplateQuery, favorites = new Set<string>(), usage: TemplateUsageRecord[] = []): ProfessionalTemplate[] {
  const usageMap = new Map(usage.map(item => [item.templateId, item]));
  let result = templates.filter(template => {
    const m = template.metadata;
    const haystack = normalized([m.name, m.description, m.category, m.subcategory ?? "", m.industry ?? "", ...m.tags].join(" "));
    if (query.text && !haystack.includes(normalized(query.text))) return false;
    if (query.categories?.length && !query.categories.includes(m.category)) return false;
    if (query.industries?.length && (!m.industry || !query.industries.includes(m.industry))) return false;
    if (query.tags?.length && !query.tags.every(tag => m.tags.map(normalized).includes(normalized(tag)))) return false;
    if (query.orientation && m.orientation !== query.orientation) return false;
    if (query.pageSize && m.pageSize !== query.pageSize) return false;
    if (query.access && (m.access ?? "free") !== query.access) return false;
    if (query.favoritesOnly && !favorites.has(m.id)) return false;
    if (query.featuredOnly && !m.featured) return false;
    if (query.trendingOnly && !m.trending) return false;
    return true;
  });
  const sort = query.sort ?? "name";
  result = [...result].sort((a, b) => {
    if (sort === "newest") return b.metadata.createdAt.localeCompare(a.metadata.createdAt);
    if (sort === "updated") return b.metadata.updatedAt.localeCompare(a.metadata.updatedAt);
    if (sort === "popular") return (usageMap.get(b.metadata.id)?.openCount ?? 0) - (usageMap.get(a.metadata.id)?.openCount ?? 0);
    return a.metadata.name.localeCompare(b.metadata.name);
  });
  return result;
}

import type { PublisherTemplate } from "./types";

export type TemplateLicense = "free" | "premium" | "enterprise";
export type TemplatePublicationStatus = "draft" | "review" | "published" | "archived";

export interface TemplateCreatorProfile {
  id: string;
  displayName: string;
  verified: boolean;
  templateCount: number;
  averageRating: number;
}

export interface MarketplaceTemplateRecord {
  templateId: string;
  creatorId: string;
  license: TemplateLicense;
  status: TemplatePublicationStatus;
  featured: boolean;
  trendingScore: number;
  downloadCount: number;
  ratingAverage: number;
  ratingCount: number;
  publishedAt?: string;
  updatedAt: string;
}

export interface TemplateReview {
  id: string;
  templateId: string;
  reviewerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
}

export const createMarketplaceRecord = (
  templateId: string,
  creatorId = "yaposan",
  license: TemplateLicense = "free",
): MarketplaceTemplateRecord => ({
  templateId,
  creatorId,
  license,
  status: "draft",
  featured: false,
  trendingScore: 0,
  downloadCount: 0,
  ratingAverage: 0,
  ratingCount: 0,
  updatedAt: new Date().toISOString(),
});

export const publishMarketplaceTemplate = (
  record: MarketplaceTemplateRecord,
): MarketplaceTemplateRecord => ({
  ...record,
  status: "published",
  publishedAt: record.publishedAt ?? new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const archiveMarketplaceTemplate = (
  record: MarketplaceTemplateRecord,
): MarketplaceTemplateRecord => ({ ...record, status: "archived", updatedAt: new Date().toISOString() });

export const recordTemplateDownload = (
  record: MarketplaceTemplateRecord,
): MarketplaceTemplateRecord => ({
  ...record,
  downloadCount: record.downloadCount + 1,
  trendingScore: record.trendingScore + 2,
  updatedAt: new Date().toISOString(),
});

export const applyTemplateReview = (
  record: MarketplaceTemplateRecord,
  review: TemplateReview,
): MarketplaceTemplateRecord => {
  const total = record.ratingAverage * record.ratingCount + review.rating;
  const ratingCount = record.ratingCount + 1;
  return {
    ...record,
    ratingCount,
    ratingAverage: Number((total / ratingCount).toFixed(2)),
    trendingScore: record.trendingScore + review.rating,
    updatedAt: new Date().toISOString(),
  };
};

export const searchMarketplace = (
  templates: PublisherTemplate[],
  records: MarketplaceTemplateRecord[],
  query: string,
  options: { license?: TemplateLicense; featuredOnly?: boolean } = {},
): PublisherTemplate[] => {
  const normalized = query.trim().toLowerCase();
  const recordByTemplate = new Map(records.map((record) => [record.templateId, record]));
  return templates.filter((template) => {
    const record = recordByTemplate.get(template.metadata.id);
    if (!record || record.status !== "published") return false;
    if (options.license && record.license !== options.license) return false;
    if (options.featuredOnly && !record.featured) return false;
    if (!normalized) return true;
    return [
      template.metadata.name,
      template.metadata.description,
      template.metadata.category,
      template.metadata.industry,
      ...(template.metadata.tags ?? []),
    ].some((value) => String(value ?? "").toLowerCase().includes(normalized));
  });
};

export const rankMarketplaceTemplates = (
  templates: PublisherTemplate[],
  records: MarketplaceTemplateRecord[],
): PublisherTemplate[] => {
  const score = new Map(records.map((record) => [record.templateId, record.trendingScore]));
  return [...templates].sort((a, b) => (score.get(b.metadata.id) ?? 0) - (score.get(a.metadata.id) ?? 0));
};

import type { PublisherPage } from "../types/publisher";

export const TEMPLATE_CATEGORIES = [
  "Business", "Marketing", "Social Media", "Print", "Education", "Church",
  "Restaurant", "Retail", "Healthcare", "Technology", "Fashion", "Sports",
  "Real Estate", "Personal", "Events", "YouTube", "Streaming", "Podcast",
  "AI", "Presentation", "Blank Documents",
] as const;

export type ProfessionalTemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
export type TemplateOrientation = "portrait" | "landscape" | "square";
export type TemplateAccess = "free" | "premium" | "team";

export type TemplateMetadata = {
  id: string;
  name: string;
  category: ProfessionalTemplateCategory;
  subcategory?: string;
  industry?: string;
  description: string;
  tags: string[];
  pageSize: string;
  orientation: TemplateOrientation;
  previewColor: string;
  thumbnailUri?: string;
  author: string;
  version: string;
  editable: boolean;
  featured?: boolean;
  trending?: boolean;
  access?: TemplateAccess;
  createdAt: string;
  updatedAt: string;
  themeId?: string;
  supportedThemeIds?: string[];
  style?: "corporate" | "luxury" | "minimal" | "creative" | "editorial" | "bold" | "elegant" | "professional";
  masterTemplateId?: string;
  palette?: string[];
  fonts?: string[];
  qualityScore?: number;
};

export type ProfessionalTemplate = {
  metadata: TemplateMetadata;
  pages: PublisherPage[];
};

// Backward-compatible alias for template management/marketplace modules.
export type PublisherTemplate = ProfessionalTemplate;

export type TemplateTheme = {
  id: string;
  name: string;
  colors: Record<string, string>;
  fonts: { heading: string; body: string; accent?: string };
};

export type TemplateVariableValue = string | number | boolean;
export type TemplateVariables = Record<string, TemplateVariableValue>;

export type TemplateQuery = {
  text?: string;
  categories?: ProfessionalTemplateCategory[];
  industries?: string[];
  tags?: string[];
  orientation?: TemplateOrientation;
  pageSize?: string;
  access?: TemplateAccess;
  favoritesOnly?: boolean;
  featuredOnly?: boolean;
  trendingOnly?: boolean;
  sort?: "name" | "newest" | "updated" | "popular";
};

export type TemplateValidationIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  pageId?: string;
  elementId?: string;
};

export type TemplateUsageRecord = {
  templateId: string;
  lastOpenedAt: string;
  openCount: number;
  lastEditedAt?: string;
  lastExportedAt?: string;
  pinned?: boolean;
};

import { PHASE4341_ONE_FLAGSHIP_TEMPLATE } from "./templateCatalog4341OneFlagshipTemplate";
import { REAL_PROFESSIONAL_TEMPLATES } from "./realProfessionalTemplates";
import { PHASE4346_ADDITIONAL_PROFESSIONAL_TEMPLATES } from "./templateCatalog4346AdditionalProfessionalTemplates";
import { PHASE4347_FIFTY_PROFESSIONAL_TEMPLATES } from "./templateCatalog4347FiftyProfessionalTemplates";
import { PHASE4348_FIFTY_PROFESSIONAL_TEMPLATES } from "./templateCatalog4348FiftyMoreProfessionalTemplates";
import { PHASE4349_ONE_HUNDRED_PROFESSIONAL_TEMPLATES } from "./templateCatalog4349OneHundredProfessionalTemplates";
import { PHASE4351_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4351Fifty243dTemplates";
import { PHASE4352_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4352Fifty243dTemplates";
import { PHASE4353_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4353Fifty243dTemplates";
import { PHASE4354_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4354Fifty243dTemplates";
import { PHASE4361_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4361Fifty243dTemplates";
import { PHASE4362_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4362Fifty243dTemplates";
import { PHASE4363_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4363Fifty243dTemplates";
import { PHASE4364_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4364Fifty243dTemplates";
import { PHASE4365_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4365Fifty243dTemplates";
import { PHASE4366_FIFTY_PHASE243D_TEMPLATES } from "./templateCatalog4366Fifty243dTemplates";
import { PHASE4371_PROFESSIONAL_BUSINESS_CARDS } from "./templateCatalog4371ProfessionalBusinessCards";
import { PHASE4372_PUBLICATION_TYPE_TEMPLATES } from "./templateCatalog4372PublicationTypeMegaLibrary";
import { PHASE4373_PUBLICATION_TYPE_TEMPLATES } from "./templateCatalog4373PublicationTypeExpansion";
import { PHASE4374_INDUSTRY_TEMPLATES } from "./templateCatalog4374IndustryExpansion";
import { PHASE4375_PUBLICATION_TYPE_TEMPLATES } from "./templateCatalog4375PublicationTypeExpansion";
import { PHASE4376_PUBLICATION_TYPE_TEMPLATES } from "./templateCatalog4376PublicationTypeExpansion";
import { PHASE4378_PUBLICATION_TYPE_TEMPLATES } from "./templateCatalog4378PublicationTypeExpansion";
import { PHASE4378_INDUSTRY_TEMPLATES } from "./templateCatalog4378IndustryExpansion";
import { PHASE4379_PUBLICATION_TYPE_TEMPLATES } from "./templateCatalog4379PublicationTypeExpansion";
import { PHASE4379_INDUSTRY_TEMPLATES } from "./templateCatalog4379IndustryExpansion";
import { PHASE4380_PUBLICATION_TYPE_TEMPLATES } from "./templateCatalog4380PublicationTypeExpansion";
import { PHASE4380_INDUSTRY_TEMPLATES } from "./templateCatalog4380IndustryExpansion";
import type { ProfessionalTemplate } from "./types";

export type Phase43Category = {
  id: string;
  number: number;
  name: string;
  icon: string;
  accent: string;
  countLabel: string;
  templates: ProfessionalTemplate[];
};

const expandedTemplates: ProfessionalTemplate[] = [
  ...REAL_PROFESSIONAL_TEMPLATES,
  ...PHASE4346_ADDITIONAL_PROFESSIONAL_TEMPLATES,
  ...PHASE4347_FIFTY_PROFESSIONAL_TEMPLATES,
  ...PHASE4348_FIFTY_PROFESSIONAL_TEMPLATES,
  ...PHASE4349_ONE_HUNDRED_PROFESSIONAL_TEMPLATES,
  ...PHASE4351_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4352_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4353_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4354_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4361_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4362_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4363_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4364_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4365_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4366_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4371_PROFESSIONAL_BUSINESS_CARDS,
  ...PHASE4372_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4373_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4374_INDUSTRY_TEMPLATES,
  ...PHASE4375_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4376_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4378_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4378_INDUSTRY_TEMPLATES,
  ...PHASE4379_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4379_INDUSTRY_TEMPLATES,
  ...PHASE4380_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4380_INDUSTRY_TEMPLATES,
];
const byExpandedCategory = (category: string) =>
  expandedTemplates.filter((template) => template.metadata.category === category && !template.metadata.id.startsWith("phase4372-"));

const partyTemplates: ProfessionalTemplate[] = [
  PHASE4341_ONE_FLAGSHIP_TEMPLATE,
  ...PHASE4346_ADDITIONAL_PROFESSIONAL_TEMPLATES.filter((template) =>
    template.metadata.category === "Events" || template.metadata.category === "Personal"
  ),
];
const businessCardTemplates = PHASE4371_PROFESSIONAL_BUSINESS_CARDS;
const publicationTypeTemplates = (subcategory: string) => [...PHASE4372_PUBLICATION_TYPE_TEMPLATES, ...PHASE4373_PUBLICATION_TYPE_TEMPLATES, ...PHASE4375_PUBLICATION_TYPE_TEMPLATES, ...PHASE4376_PUBLICATION_TYPE_TEMPLATES, ...PHASE4378_PUBLICATION_TYPE_TEMPLATES, ...PHASE4379_PUBLICATION_TYPE_TEMPLATES, ...PHASE4380_PUBLICATION_TYPE_TEMPLATES].filter((template) => template.metadata.subcategory === subcategory);
const letterheadTemplates = publicationTypeTemplates("Letterheads");
const envelopeTemplates = publicationTypeTemplates("Envelopes");
const certificateTemplates = publicationTypeTemplates("Certificates");
const invoiceTemplates = publicationTypeTemplates("Invoices");
const brochureTemplates = publicationTypeTemplates("Brochures");
const newsletterTemplates = publicationTypeTemplates("Newsletters");
const flyerTemplates = publicationTypeTemplates("Flyers");
const posterTemplates = publicationTypeTemplates("Posters");
const menuTemplates = publicationTypeTemplates("Menus");
const labelTemplates = publicationTypeTemplates("Labels");
const packagingTemplates = publicationTypeTemplates("Packaging");
const calendarTemplates = publicationTypeTemplates("Calendars");
const bookCoverTemplates = publicationTypeTemplates("Book Covers");
const resumeTemplates = publicationTypeTemplates("Resumes");
const presentationCoverTemplates = publicationTypeTemplates("Presentation Covers");
const socialMediaKitTemplates = publicationTypeTemplates("Social Media Kits");
const businessTemplates = byExpandedCategory("Business").filter((template) => template.metadata.subcategory !== "Business Cards");
const marketingTemplates = byExpandedCategory("Marketing");
const printTemplates = byExpandedCategory("Print");
const socialTemplates = byExpandedCategory("Social Media");
const retailTemplates = byExpandedCategory("Retail");
const realEstateTemplates = byExpandedCategory("Real Estate");
const restaurantTemplates = byExpandedCategory("Restaurant");
const healthcareTemplates = byExpandedCategory("Healthcare");
const educationTemplates = byExpandedCategory("Education");
const technologyTemplates = byExpandedCategory("Technology");
const fashionTemplates = byExpandedCategory("Fashion");
const sportsTemplates = byExpandedCategory("Sports");

/**
 * *
 * The template area now includes the complete handcrafted * collection alongside the single premium party poster. The original template
 * objects are reused directly, so their page geometry, image treatment,
 * typography, metadata, editability, and template-loader behavior remain
 * identical to .
 */
export const PHASE43_CATEGORIES: Phase43Category[] = [
  {
    id: "phase43-category-party",
    number: 1,
    name: "Premium Party Templates",
    icon: "balloon-outline",
    accent: "#ff4f86",
    countLabel: `${partyTemplates.length} premium design`,
    templates: partyTemplates,
  },
  {
    id: "phase43-category-business-cards",
    number: 2,
    name: "Business Cards",
    icon: "card-outline",
    accent: "#2563eb",
    countLabel: `${businessCardTemplates.length} front-and-back designs`,
    templates: businessCardTemplates,
  },
  { id: "phase43-category-letterheads", number: 3, name: "Letterheads", icon: "document-text-outline", accent: "#2563eb", countLabel: `${letterheadTemplates.length} professional designs`, templates: letterheadTemplates },
  { id: "phase43-category-envelopes", number: 4, name: "Envelopes", icon: "mail-outline", accent: "#0f766e", countLabel: `${envelopeTemplates.length} professional designs`, templates: envelopeTemplates },
  { id: "phase43-category-certificates", number: 5, name: "Certificates", icon: "ribbon-outline", accent: "#d4af37", countLabel: `${certificateTemplates.length} professional designs`, templates: certificateTemplates },
  { id: "phase43-category-invoices", number: 6, name: "Invoices", icon: "receipt-outline", accent: "#334155", countLabel: `${invoiceTemplates.length} professional designs`, templates: invoiceTemplates },
  { id: "phase43-category-brochures", number: 7, name: "Brochures", icon: "book-outline", accent: "#7c3aed", countLabel: `${brochureTemplates.length} professional designs`, templates: brochureTemplates },
  { id: "phase43-category-newsletters", number: 8, name: "Newsletters", icon: "newspaper-outline", accent: "#0ea5a8", countLabel: `${newsletterTemplates.length} professional designs`, templates: newsletterTemplates },
  { id: "phase43-category-flyers", number: 9, name: "Flyers", icon: "paper-plane-outline", accent: "#f97316", countLabel: `${flyerTemplates.length} professional designs`, templates: flyerTemplates },
  { id: "phase43-category-posters", number: 10, name: "Posters", icon: "image-outline", accent: "#ef4444", countLabel: `${posterTemplates.length} professional designs`, templates: posterTemplates },
  { id: "phase43-category-menus", number: 11, name: "Menus", icon: "restaurant-outline", accent: "#c75b39", countLabel: `${menuTemplates.length} professional designs`, templates: menuTemplates },
  { id: "phase43-category-labels", number: 12, name: "Labels", icon: "pricetag-outline", accent: "#65a30d", countLabel: `${labelTemplates.length} professional designs`, templates: labelTemplates },
  { id: "phase43-category-packaging", number: 13, name: "Packaging", icon: "cube-outline", accent: "#a16207", countLabel: `${packagingTemplates.length} professional designs`, templates: packagingTemplates },
  { id: "phase43-category-calendars", number: 14, name: "Calendars", icon: "calendar-outline", accent: "#0284c7", countLabel: `${calendarTemplates.length} professional designs`, templates: calendarTemplates },
  { id: "phase43-category-book-covers", number: 15, name: "Book Covers", icon: "library-outline", accent: "#9333ea", countLabel: `${bookCoverTemplates.length} professional designs`, templates: bookCoverTemplates },
  { id: "phase43-category-resumes", number: 16, name: "Resumes", icon: "person-outline", accent: "#475569", countLabel: `${resumeTemplates.length} professional designs`, templates: resumeTemplates },
  { id: "phase43-category-presentation-covers", number: 17, name: "Presentation Covers", icon: "easel-outline", accent: "#db2777", countLabel: `${presentationCoverTemplates.length} professional designs`, templates: presentationCoverTemplates },
  { id: "phase43-category-social-media-kits", number: 18, name: "Social Media Kits", icon: "share-social-outline", accent: "#7c3aed", countLabel: `${socialMediaKitTemplates.length} professional designs`, templates: socialMediaKitTemplates },
  {
    id: "phase43-category-business",
    number: 19,
    name: "Professional Business Templates",
    icon: "briefcase-outline",
    accent: "#c9a24c",
    countLabel: `${businessTemplates.length} professional designs`,
    templates: businessTemplates,
  },
  {
    id: "phase43-category-marketing",
    number: 20,
    name: "Marketing Templates",
    icon: "megaphone-outline",
    accent: "#8fbf3f",
    countLabel: `${marketingTemplates.length} professional designs`,
    templates: marketingTemplates,
  },
  {
    id: "phase43-category-print",
    number: 21,
    name: "Print Templates",
    icon: "print-outline",
    accent: "#0b3c5d",
    countLabel: `${printTemplates.length} professional designs`,
    templates: printTemplates,
  },
  {
    id: "phase43-category-social",
    number: 22,
    name: "Social Media Templates",
    icon: "share-social-outline",
    accent: "#1da1d8",
    countLabel: `${socialTemplates.length} professional designs`,
    templates: socialTemplates,
  },
  { id: "phase43-category-retail", number: 23, name: "Retail Templates", icon: "storefront-outline", accent: "#d62828", countLabel: `${retailTemplates.length} professional designs`, templates: retailTemplates },
  { id: "phase43-category-real-estate", number: 24, name: "Real Estate Templates", icon: "home-outline", accent: "#b08d57", countLabel: `${realEstateTemplates.length} professional designs`, templates: realEstateTemplates },
  { id: "phase43-category-restaurant", number: 25, name: "Restaurant Templates", icon: "restaurant-outline", accent: "#c75b39", countLabel: `${restaurantTemplates.length} professional designs`, templates: restaurantTemplates },
  { id: "phase43-category-healthcare", number: 26, name: "Healthcare Templates", icon: "medkit-outline", accent: "#0ea5a8", countLabel: `${healthcareTemplates.length} professional designs`, templates: healthcareTemplates },
  { id: "phase43-category-education", number: 27, name: "Education Templates", icon: "school-outline", accent: "#2563eb", countLabel: `${educationTemplates.length} professional designs`, templates: educationTemplates },
  { id: "phase43-category-technology", number: 28, name: "Technology Templates", icon: "hardware-chip-outline", accent: "#7c3aed", countLabel: `${technologyTemplates.length} professional designs`, templates: technologyTemplates },
  { id: "phase43-category-fashion", number: 29, name: "Fashion Templates", icon: "shirt-outline", accent: "#111111", countLabel: `${fashionTemplates.length} professional designs`, templates: fashionTemplates },
  { id: "phase43-category-sports", number: 30, name: "Sports Templates", icon: "trophy-outline", accent: "#ef4444", countLabel: `${sportsTemplates.length} professional designs`, templates: sportsTemplates },
];

export const PHASE43_TEMPLATES: ProfessionalTemplate[] = [
  PHASE4341_ONE_FLAGSHIP_TEMPLATE,
  ...REAL_PROFESSIONAL_TEMPLATES,
  ...PHASE4346_ADDITIONAL_PROFESSIONAL_TEMPLATES,
  ...PHASE4347_FIFTY_PROFESSIONAL_TEMPLATES,
  ...PHASE4348_FIFTY_PROFESSIONAL_TEMPLATES,
  ...PHASE4349_ONE_HUNDRED_PROFESSIONAL_TEMPLATES,
  ...PHASE4351_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4352_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4353_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4354_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4361_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4362_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4363_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4364_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4365_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4366_FIFTY_PHASE243D_TEMPLATES,
  ...PHASE4371_PROFESSIONAL_BUSINESS_CARDS,
  ...PHASE4372_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4373_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4374_INDUSTRY_TEMPLATES,
  ...PHASE4375_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4376_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4378_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4378_INDUSTRY_TEMPLATES,
  ...PHASE4379_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4379_INDUSTRY_TEMPLATES,
  ...PHASE4380_PUBLICATION_TYPE_TEMPLATES,
  ...PHASE4380_INDUSTRY_TEMPLATES,
];

export const PHASE43_CATEGORY_COUNT = PHASE43_CATEGORIES.length;
export const PHASE43_TEMPLATE_COUNT = PHASE43_TEMPLATES.length;

export function searchPhase43Templates(query: string): ProfessionalTemplate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PHASE43_TEMPLATES;

  return PHASE43_TEMPLATES.filter((template) => {
    const metadata = template.metadata;
    return [
      metadata.name,
      metadata.category,
      metadata.subcategory,
      metadata.industry,
      metadata.description,
      ...(metadata.tags ?? []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized));
  });
}

export function phase43Audit() {
  const ids = PHASE43_TEMPLATES.map((template) => template.metadata.id);
  const uniqueIds = new Set(ids);

  return {
    categoryCount: PHASE43_CATEGORY_COUNT,
    templateCount: PHASE43_TEMPLATE_COUNT,
    phase243dTemplateCount: REAL_PROFESSIONAL_TEMPLATES.length,
    additionalPhase4346TemplateCount: PHASE4346_ADDITIONAL_PROFESSIONAL_TEMPLATES.length,
    additionalPhase4347TemplateCount: PHASE4347_FIFTY_PROFESSIONAL_TEMPLATES.length,
    additionalPhase4348TemplateCount: PHASE4348_FIFTY_PROFESSIONAL_TEMPLATES.length,
    additionalPhase4349TemplateCount: PHASE4349_ONE_HUNDRED_PROFESSIONAL_TEMPLATES.length,
    rebuiltPhase243dTemplateCount: 500,
    phase4371BusinessCardCount: PHASE4371_PROFESSIONAL_BUSINESS_CARDS.length,
    phase4372PublicationTypeCount: PHASE4372_PUBLICATION_TYPE_TEMPLATES.length,
    phase4373PublicationTypeCount: PHASE4373_PUBLICATION_TYPE_TEMPLATES.length,
    phase4374IndustryTemplateCount: PHASE4374_INDUSTRY_TEMPLATES.length,
    phase4378IndustryTemplateCount: PHASE4378_INDUSTRY_TEMPLATES.length,
    phase4375PublicationTemplateCount: PHASE4375_PUBLICATION_TYPE_TEMPLATES.length,
    phase4378PublicationTemplateCount: PHASE4378_PUBLICATION_TYPE_TEMPLATES.length,
    phase4379PublicationTemplateCount: PHASE4379_PUBLICATION_TYPE_TEMPLATES.length,
    phase4379IndustryTemplateCount: PHASE4379_INDUSTRY_TEMPLATES.length,
    phase4380PublicationTemplateCount: PHASE4380_PUBLICATION_TYPE_TEMPLATES.length,
    phase4380IndustryTemplateCount: PHASE4380_INDUSTRY_TEMPLATES.length,
    phase4351_fifty_phase243d_templatesCount: PHASE4351_FIFTY_PHASE243D_TEMPLATES.length,
    phase4352_fifty_phase243d_templatesCount: PHASE4352_FIFTY_PHASE243D_TEMPLATES.length,
    phase4353_fifty_phase243d_templatesCount: PHASE4353_FIFTY_PHASE243D_TEMPLATES.length,
    phase4354_fifty_phase243d_templatesCount: PHASE4354_FIFTY_PHASE243D_TEMPLATES.length,
    phase4361_fifty_phase243d_templatesCount: PHASE4361_FIFTY_PHASE243D_TEMPLATES.length,
    phase4362_fifty_phase243d_templatesCount: PHASE4362_FIFTY_PHASE243D_TEMPLATES.length,
    phase4363_fifty_phase243d_templatesCount: PHASE4363_FIFTY_PHASE243D_TEMPLATES.length,
    phase4364_fifty_phase243d_templatesCount: PHASE4364_FIFTY_PHASE243D_TEMPLATES.length,
    phase4365_fifty_phase243d_templatesCount: PHASE4365_FIFTY_PHASE243D_TEMPLATES.length,
    phase4366_fifty_phase243d_templatesCount: PHASE4366_FIFTY_PHASE243D_TEMPLATES.length,
    partyTemplateCount: partyTemplates.length,
    duplicateTemplateIds: ids.length - uniqueIds.size,
    allTemplatesEditable: PHASE43_TEMPLATES.every((template) => template.metadata.editable),
    allTemplatesHavePages: PHASE43_TEMPLATES.every((template) => template.pages.length > 0),
  };
}

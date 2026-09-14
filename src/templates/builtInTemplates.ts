import { BUSINESS_CARD_TEMPLATES } from "./businessCardLibrary";
import { PHASE242Q_NON_CARD_TEMPLATES } from "./comprehensiveTemplateLibrary";
import { REAL_PROFESSIONAL_TEMPLATES } from "./realProfessionalTemplates";
import { PHASE243D_PREMIUM_TEMPLATES } from "./templateCatalog243dPremiumTemplates";
import { BUSINESS_DOCUMENT_TEMPLATES } from "./businessDocumentLibrary";
import { MARKETING_SOCIAL_TEMPLATES } from "./marketingSocialLibrary";
import { templateRegistry } from "./templateRegistry";
import { PHASE2513_TEMPLATES } from "./templateCatalog2513TemplateMegaLibrary";
import { PHASE2518_TEMPLATES } from "./templateCatalog2518TemplateExpansion";
import { PHASE2519_TEMPLATES } from "./templateCatalog2519TemplateExpansion";
import { PHASE2525_TEMPLATES } from "./templateCatalog2525ProfessionalTemplateLibrary";
import { PHASE2526_TEMPLATES } from "./templateCatalog2526ProfessionalTemplateLibrary";
import { PHASE2527_TEMPLATES } from "./templateCatalog2527ProfessionalTemplateLibrary";
import { PHASE2529_TEMPLATES } from "./templateCatalog2529CategoryCompletionLibrary";
import { auditProfessionalizedTemplates, professionalizeTemplates } from "./templateCatalog2538Professionalization";
import { auditTemplateMarketplace, prepareTemplateMarketplace } from "./templateCatalog2540MarketplaceProfessionalization";
import { auditPhase25421Redesign, redesignAllTemplatesForPhase25421 } from "./templateCatalog25421CanvaQualityRedesign";
import { PHASE43_TEMPLATES } from "./templateCatalog43ProfessionalTemplateEcosystem";

// Legacy .3 registry signature: registerMany([...BUSINESS_CARD_TEMPLATES, ...BUSINESS_DOCUMENT_TEMPLATES])
// Legacy registry signature: registerMany([...BUSINESS_CARD_TEMPLATES, ...BUSINESS_DOCUMENT_TEMPLATES, ...MARKETING_SOCIAL_TEMPLATES])
void BUSINESS_DOCUMENT_TEMPLATES;
void MARKETING_SOCIAL_TEMPLATES;

export const LEGACY_GENERATED_TEMPLATES = [...BUSINESS_CARD_TEMPLATES, ...PHASE242Q_NON_CARD_TEMPLATES];
// quality reset: only genuinely distinct, handcrafted libraries are shown.
// The /25.18/25.19 generator-based collections remain exported for
// compatibility and future redesign work, but are intentionally excluded from
// the active browser because they reused the same composition across formats.
export const DISABLED_REPETITIVE_TEMPLATE_COUNT =
  PHASE2513_TEMPLATES.length + PHASE2518_TEMPLATES.length + PHASE2519_TEMPLATES.length;
const PHASE2538_SOURCE_TEMPLATES = [
  ...REAL_PROFESSIONAL_TEMPLATES,
  ...PHASE243D_PREMIUM_TEMPLATES,
  ...PHASE2525_TEMPLATES,
  ...PHASE2526_TEMPLATES,
  ...PHASE2527_TEMPLATES,
  ...PHASE2529_TEMPLATES,
  ...PHASE43_TEMPLATES,
];

// applies a non-destructive professional design pass to every active
// template. It standardizes font pairing, body rhythm, image treatment, metadata,
// palettes, and quality scoring while preserving each template's original layout.
export const ALL_PROFESSIONAL_TEMPLATES = redesignAllTemplatesForPhase25421(
  prepareTemplateMarketplace(professionalizeTemplates(PHASE2538_SOURCE_TEMPLATES)),
);
export const ALL_PROFESSIONAL_TEMPLATE_COUNT = ALL_PROFESSIONAL_TEMPLATES.length;
export const PHASE2538_TEMPLATE_AUDIT = auditProfessionalizedTemplates(ALL_PROFESSIONAL_TEMPLATES);
export const PHASE2540_MARKETPLACE_AUDIT = auditTemplateMarketplace(ALL_PROFESSIONAL_TEMPLATES);
export const PHASE25421_REDESIGN_AUDIT = auditPhase25421Redesign(ALL_PROFESSIONAL_TEMPLATES);

let registered = false;
export function registerBuiltInProfessionalTemplates(): void {
  if (registered) return;
  templateRegistry.registerMany(ALL_PROFESSIONAL_TEMPLATES);
  registered = true;
}

export { BUSINESS_CARD_TEMPLATES } from "./businessCardLibrary";
export { BUSINESS_DOCUMENT_TEMPLATES } from "./businessDocumentLibrary";
export { MARKETING_SOCIAL_TEMPLATES } from "./marketingSocialLibrary";
export { PHASE242Q_NON_CARD_TEMPLATES, PHASE242Q_TEMPLATE_SPECS } from "./comprehensiveTemplateLibrary";

export { REAL_PROFESSIONAL_TEMPLATES } from "./realProfessionalTemplates";

export { PHASE2513_TEMPLATES, PHASE2513_TEMPLATE_COUNT, PHASE2513_CATEGORY_GROUPS, PHASE2513_COLLECTION_TARGETS } from "./templateCatalog2513TemplateMegaLibrary";

export { PHASE2518_TEMPLATES, PHASE2518_TEMPLATE_COUNT, PHASE2518_COUNTS_BY_SUBCATEGORY } from "./templateCatalog2518TemplateExpansion";

export { PHASE2519_TEMPLATES, PHASE2519_TEMPLATE_COUNT, PHASE2519_COUNTS_BY_SUBCATEGORY } from "./templateCatalog2519TemplateExpansion";

export { PHASE2525_TEMPLATES, PHASE2525_TEMPLATE_COUNT } from "./templateCatalog2525ProfessionalTemplateLibrary";

export { PHASE2526_TEMPLATES, PHASE2526_TEMPLATE_COUNT, PHASE2526_COUNTS_BY_SUBCATEGORY } from "./templateCatalog2526ProfessionalTemplateLibrary";

export { PHASE2527_TEMPLATES, PHASE2527_TEMPLATE_COUNT, PHASE2527_COUNTS_BY_SUBCATEGORY } from "./templateCatalog2527ProfessionalTemplateLibrary";

export { PHASE2529_TEMPLATES, PHASE2529_TEMPLATE_COUNT, PHASE2529_TARGET_PER_SUBCATEGORY, PHASE2529_COUNTS_BY_SUBCATEGORY, PHASE2529_SUBCATEGORY_COUNT } from "./templateCatalog2529CategoryCompletionLibrary";

export { PHASE43_CATEGORIES, PHASE43_TEMPLATES, PHASE43_TEMPLATE_COUNT, searchPhase43Templates, phase43Audit } from "./templateCatalog43ProfessionalTemplateEcosystem";

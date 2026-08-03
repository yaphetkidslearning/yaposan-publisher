export type AiDesignTask = "layout" | "branding" | "image" | "content" | "assistant" | "audit";
export type AiProviderKind = "local" | "openai-compatible" | "custom";
export type AiDesignProvider = { id: string; name: string; kind: AiProviderKind; enabled: boolean; endpoint?: string; model?: string; supports: AiDesignTask[] };
export type BrandProfile = { id: string; name: string; colors: string[]; fonts: string[]; tone: string; keywords: string[]; logoAssetId?: string };
export type LayoutBrief = { documentType: string; audience: string; objective: string; pageCount: number; style: string; requiredSections: string[] };
export type GeneratedLayout = { id: string; name: string; score: number; rationale: string; columns: number; hierarchy: string[]; palette: string[]; suggestions: string[] };
export type ContentSuggestion = { id: string; kind: "headline" | "body" | "cta" | "caption"; text: string; confidence: number; rationale: string };
export type AiDesignIssue = { id: string; severity: "error" | "warning" | "info"; message: string; fix: string };
export type AiDesignAudit = { score: number; issues: AiDesignIssue[]; strengths: string[] };
export type AiDesignSession = { id: string; createdAt: number; task: AiDesignTask; prompt: string; providerId: string; status: "draft" | "ready" | "applied" | "failed"; outputs: string[] };

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const DEFAULT_AI_PROVIDERS: AiDesignProvider[] = [
  { id: "local-design-intelligence", name: "Yaposan Local Design Intelligence", kind: "local", enabled: true, model: "layout-rules-v1", supports: ["layout", "branding", "content", "assistant", "audit"] },
  { id: "image-provider-adapter", name: "Image Generation Provider", kind: "custom", enabled: false, supports: ["image"] },
  { id: "language-provider-adapter", name: "Language Provider", kind: "openai-compatible", enabled: false, supports: ["content", "assistant", "branding"] },
];

export const DEFAULT_BRAND_PROFILE: BrandProfile = {
  id: "brand-yaposan", name: "Yaposan Professional", colors: ["#0F766E", "#14B8A6", "#0F172A", "#F8FAFC"],
  fonts: ["Inter", "Source Serif 4"], tone: "professional, clear, modern", keywords: ["publishing", "precision", "creative", "professional"], logoAssetId: "asset-brand-logo",
};

export function generateLayoutConcepts(brief: LayoutBrief, brand: BrandProfile = DEFAULT_BRAND_PROFILE): GeneratedLayout[] {
  const sections = brief.requiredSections.length ? brief.requiredSections : ["Hero", "Overview", "Details", "Call to action"];
  const base = clamp(72 + Math.min(brief.pageCount, 12) + Math.min(sections.length * 2, 10));
  return [
    { id: id("layout"), name: "Editorial Grid", score: base + 4, rationale: `A disciplined editorial system for ${brief.audience}.`, columns: 6, hierarchy: sections, palette: brand.colors, suggestions: ["Use a modular 6-column grid", "Reserve one accent color for calls to action", "Keep body measure between 45 and 75 characters"] },
    { id: id("layout"), name: "Modern Showcase", score: base, rationale: `A visual-first composition supporting the ${brief.objective} objective.`, columns: 4, hierarchy: sections, palette: [...brand.colors].reverse(), suggestions: ["Use one dominant image per spread", "Create strong type-size contrast", "Align captions to image edges"] },
    { id: id("layout"), name: "Accessible Information", score: base + 2, rationale: "A high-readability system with predictable navigation and strong contrast.", columns: 3, hierarchy: sections, palette: brand.colors.slice(0, 3), suggestions: ["Use minimum 4.5:1 text contrast", "Keep navigation positions consistent", "Use descriptive headings and alt text"] },
  ];
}

export function generateBrandDirections(name: string, keywords: string[], tone: string): BrandProfile[] {
  const clean = name.trim() || "Untitled Brand";
  const words = keywords.map((x) => x.trim().toLowerCase()).filter(Boolean);
  return [
    { id: id("brand"), name: `${clean} Core`, colors: ["#0F766E", "#2DD4BF", "#0F172A", "#F8FAFC"], fonts: ["Inter", "Source Serif 4"], tone, keywords: words },
    { id: id("brand"), name: `${clean} Bold`, colors: ["#1D4ED8", "#F59E0B", "#111827", "#FFFFFF"], fonts: ["Inter", "Georgia"], tone: `${tone}, confident`, keywords: words },
    { id: id("brand"), name: `${clean} Refined`, colors: ["#7C3AED", "#C4B5FD", "#1F2937", "#FAFAF9"], fonts: ["Source Serif 4", "Inter"], tone: `${tone}, editorial`, keywords: words },
  ];
}

export function suggestContent(topic: string, audience: string, objective: string): ContentSuggestion[] {
  const subject = topic.trim() || "your idea";
  const target = audience.trim() || "your audience";
  return [
    { id: id("copy"), kind: "headline", text: `${subject}: designed for ${target}`, confidence: 91, rationale: "States the subject and audience directly." },
    { id: id("copy"), kind: "body", text: `Present ${subject} with a clear hierarchy, concise supporting details, and a visual path that guides ${target} toward ${objective || "the next step"}.`, confidence: 86, rationale: "Balances clarity, context, and action." },
    { id: id("copy"), kind: "cta", text: objective ? `Start ${objective}` : "Learn more", confidence: 82, rationale: "Uses a direct, action-oriented phrase." },
  ];
}

export function buildImageGenerationRequest(prompt: string, brand: BrandProfile, format: "square" | "portrait" | "landscape") {
  const dimensions = format === "square" ? { width: 1024, height: 1024 } : format === "portrait" ? { width: 1024, height: 1536 } : { width: 1536, height: 1024 };
  return { id: id("image-request"), prompt: `${prompt.trim()}. Brand mood: ${brand.tone}. Preferred palette: ${brand.colors.join(", ")}. No embedded text unless explicitly requested.`, format, ...dimensions, providerRequired: true };
}

export function auditDesign(input: { contrastRatio: number; fontCount: number; alignmentConsistency: number; overflowCount: number; imageResolutionWarnings: number; hasBrandProfile: boolean }): AiDesignAudit {
  const issues: AiDesignIssue[] = [];
  if (input.contrastRatio < 4.5) issues.push({ id: "contrast", severity: "error", message: "Text contrast is below the accessible target.", fix: "Increase foreground/background contrast to at least 4.5:1 for normal text." });
  if (input.fontCount > 4) issues.push({ id: "fonts", severity: "warning", message: `${input.fontCount} font families may weaken visual consistency.`, fix: "Reduce the document to two or three coordinated font families." });
  if (input.alignmentConsistency < 80) issues.push({ id: "alignment", severity: "warning", message: "Object alignment is inconsistent.", fix: "Apply shared guides, grids, and edge alignment." });
  if (input.overflowCount > 0) issues.push({ id: "overflow", severity: "error", message: `${input.overflowCount} text frames have overset content.`, fix: "Resize frames, edit copy, or continue text into linked frames." });
  if (input.imageResolutionWarnings > 0) issues.push({ id: "resolution", severity: "warning", message: `${input.imageResolutionWarnings} images may print below target resolution.`, fix: "Replace or resize images to maintain production DPI." });
  if (!input.hasBrandProfile) issues.push({ id: "brand", severity: "info", message: "No active brand profile is assigned.", fix: "Create or assign a brand profile for consistent colors, fonts, and tone." });
  const penalty = issues.reduce((sum, item) => sum + (item.severity === "error" ? 18 : item.severity === "warning" ? 8 : 3), 0);
  return { score: clamp(100 - penalty), issues, strengths: ["Structured design analysis", "Production-aware recommendations", "Non-destructive suggestions"] };
}

export function createAiDesignSession(task: AiDesignTask, prompt: string, providerId = "local-design-intelligence"): AiDesignSession {
  return { id: id("ai-session"), createdAt: Date.now(), task, prompt: prompt.trim(), providerId, status: "ready", outputs: [] };
}

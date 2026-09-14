import type { ProfessionalTemplate } from "./types";

export type SocialPlatformPreset = { id: string; label: string; width: number; height: number; safeMargin: number };
export const SOCIAL_PLATFORM_PRESETS: SocialPlatformPreset[] = [
  { id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080, safeMargin: 80 },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920, safeMargin: 120 },
  { id: "facebook-post", label: "Facebook Post", width: 1200, height: 630, safeMargin: 60 },
  { id: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 1200, safeMargin: 72 },
  { id: "x-post", label: "X Post", width: 1600, height: 900, safeMargin: 72 },
  { id: "pinterest-pin", label: "Pinterest Pin", width: 1000, height: 1500, safeMargin: 70 },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720, safeMargin: 64 },
  { id: "tiktok-cover", label: "TikTok Cover", width: 1080, height: 1920, safeMargin: 140 },
];

export const recommendMarketingTemplates = (templates: ProfessionalTemplate[], query: string, limit = 12): ProfessionalTemplate[] => {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return templates.map((template) => ({ template, score: tokens.reduce((score, token) => score + ([template.metadata.name, template.metadata.description, ...(template.metadata.tags ?? [])].some((value) => value.toLowerCase().includes(token)) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.template);
};

export const createCampaignBundle = (template: ProfessionalTemplate, presetIds: string[]) => presetIds.map((presetId) => {
  const preset = SOCIAL_PLATFORM_PRESETS.find((item) => item.id === presetId);
  if (!preset) throw new Error(`Unknown platform preset: ${presetId}`);
  return { templateId: template.metadata.id, presetId, name: `${template.metadata.name} - ${preset.label}`, width: preset.width, height: preset.height, safeMargin: preset.safeMargin };
});

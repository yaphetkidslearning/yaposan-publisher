export type Phase31PackageId =
  | "31.0" | "31.1" | "31.2" | "31.3" | "31.4" | "31.5" | "31.6"
  | "31.7" | "31.8" | "31.9" | "31.10" | "31.11" | "31.12";

export type Phase31Module = {
  id: Phase31PackageId;
  title: string;
  description: string;
  features: string[];
  route?: string;
};

export type AiProvider = {
  id: string;
  name: string;
  category: "text" | "image" | "video" | "audio" | "local";
  enabled: boolean;
  model: string;
  status: "ready" | "configuration-required" | "offline";
};

export type CreativeCloudJob = {
  id: string;
  kind: "ai" | "export" | "automation" | "analysis";
  title: string;
  status: "queued" | "processing" | "paused" | "completed" | "failed" | "cancelled";
  progress: number;
  createdAt: string;
  provider?: string;
};

export type SmartAsset = {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document" | "template";
  tags: string[];
  colors: string[];
  qualityScore: number;
  duplicateGroup?: string;
  version: number;
};

export type ExportProfile = {
  id: string;
  name: string;
  format: "PDF" | "DOCX" | "PPTX" | "PNG" | "JPG" | "TIFF" | "BMP" | "WEBP" | "SVG" | "EPS" | "AI" | "PSD" | "MP4" | "MOV" | "WEBM" | "GIF" | "HTML" | "ZIP" | "PWA";
  quality: number;
  background: "transparent" | "white" | "project";
};

export const PHASE31_MODULES: Phase31Module[] = [
  { id: "31.0", title: "AI Core Platform", description: "Providers, models, credits, cost controls and command center.", features: ["AI Command Center", "Provider Manager", "Model Selector", "Usage & Cost Dashboard", "API and Local Provider Settings"] },
  { id: "31.1", title: "AI Workflow Engine", description: "Durable background jobs, batch processing and scheduling.", features: ["Background Queue", "Batch Processing", "Scheduler", "Retry / Resume / Cancel", "Job History"] },
  { id: "31.2", title: "AI Everywhere", description: "Shared AI actions available across every creative studio.", features: ["Improve", "Rewrite", "Generate", "Expand", "Translate", "Explain", "Fix", "Summarize", "Brainstorm"] },
  { id: "31.3", title: "Smart Asset Library", description: "Search, analysis, tagging, similarity and asset versions.", features: ["OCR Search", "Face & Object Metadata", "Color Search", "Duplicate Detection", "Smart Collections", "Version History"] },
  { id: "31.4", title: "Brand Center Pro", description: "Govern logos, typography, colors, kits and approvals.", features: ["Brand Kits", "Logo Rules", "Typography Rules", "Color Rules", "Shared Libraries", "Approval Workflow"] },
  { id: "31.5", title: "AI Automation Center", description: "One-click multi-asset campaign and document generation.", features: ["Flyer Generator", "Presentation Generator", "Website Generator", "Social Campaigns", "Product Listings", "Marketing Packages"] },
  { id: "31.6", title: "Plugin Marketplace", description: "Installable extensions with manifests, permissions and lifecycle.", features: ["Plugin Manager", "Installer", "Updates", "SDK Foundation", "Extension Loader", "Permissions"] },
  { id: "31.7", title: "Workspace Manager", description: "Save and restore professional workspace modes and panel layouts.", features: ["Dockable Panels", "Floating Panels", "Saved Layouts", "Workspace Modes", "Import / Export Layouts", "Multi-monitor Metadata"] },
  { id: "31.8", title: "Universal Export Center", description: "One export queue for document, image, graphics, video and web formats.", features: ["Batch Export", "Scheduled Export", "Background Export", "Export Profiles", "Export Queue", "Export History"] },
  { id: "31.9", title: "Productivity Center", description: "Command palette, search, shortcuts, workflows and macros.", features: ["Ctrl+K Command Palette", "Universal Search", "Shortcut Manager", "Workflow Builder", "Macro Recorder", "Notification Center"] },
  { id: "31.10", title: "Recovery & Performance", description: "Autosave recovery and platform resource visibility.", features: ["Autosave Timeline", "Snapshots", "Crash Recovery", "CPU / Memory / GPU Metrics", "Storage Monitor", "Render Monitor"] },
  { id: "31.11", title: "Production Integration", description: "Connect Phase 31 services to navigation, studios and shared state.", features: ["Sidebar Integration", "Ribbon Integration", "Studio Integration", "Shared Queue", "Shared Assets", "Shared Export Center"] },
  { id: "31.12", title: "Production Certification", description: "Regression coverage, upgrade notes and production validation.", features: ["Integration Tests", "Workflow Tests", "Export Tests", "Asset Tests", "Plugin Tests", "Documentation"] },
];

export const DEFAULT_AI_PROVIDERS: AiProvider[] = [
  { id: "openai", name: "OpenAI", category: "text", enabled: true, model: "Configurable", status: "configuration-required" },
  { id: "gemini", name: "Google Gemini", category: "text", enabled: false, model: "Configurable", status: "configuration-required" },
  { id: "claude", name: "Anthropic Claude", category: "text", enabled: false, model: "Configurable", status: "configuration-required" },
  { id: "stability", name: "Stability AI", category: "image", enabled: false, model: "Configurable", status: "configuration-required" },
  { id: "runway", name: "Runway", category: "video", enabled: false, model: "Configurable", status: "configuration-required" },
  { id: "elevenlabs", name: "ElevenLabs", category: "audio", enabled: false, model: "Configurable", status: "configuration-required" },
  { id: "replicate", name: "Replicate", category: "image", enabled: false, model: "Configurable", status: "configuration-required" },
  { id: "huggingface", name: "Hugging Face", category: "local", enabled: false, model: "Configurable", status: "configuration-required" },
  { id: "ollama", name: "Ollama", category: "local", enabled: false, model: "Local", status: "offline" },
  { id: "lmstudio", name: "LM Studio", category: "local", enabled: false, model: "Local", status: "offline" },
];

export const DEFAULT_EXPORT_PROFILES: ExportProfile[] = [
  { id: "print-pdf", name: "Print PDF", format: "PDF", quality: 100, background: "project" },
  { id: "social-png", name: "Social PNG", format: "PNG", quality: 95, background: "project" },
  { id: "transparent-png", name: "Transparent PNG", format: "PNG", quality: 100, background: "transparent" },
  { id: "web-package", name: "Web Package", format: "ZIP", quality: 90, background: "project" },
  { id: "video-web", name: "Web Video", format: "WEBM", quality: 85, background: "project" },
];

export function createPhase31Job(title: string, kind: CreativeCloudJob["kind"] = "ai", provider?: string): CreativeCloudJob {
  return { id: `p31-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind, title, status: "queued", progress: 0, createdAt: new Date().toISOString(), provider };
}

export function advancePhase31Job(job: CreativeCloudJob, amount = 25): CreativeCloudJob {
  if (["completed", "failed", "cancelled"].includes(job.status)) return job;
  const progress = Math.min(100, Math.max(0, job.progress + amount));
  return { ...job, progress, status: progress >= 100 ? "completed" : "processing" };
}

export function searchSmartAssets(assets: SmartAsset[], query: string): SmartAsset[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return assets;
  return assets.filter((asset) => [asset.name, asset.type, ...asset.tags, ...asset.colors].some((value) => value.toLowerCase().includes(normalized)));
}

export function findDuplicateAssets(assets: SmartAsset[]): SmartAsset[][] {
  const groups = new Map<string, SmartAsset[]>();
  assets.forEach((asset) => { if (asset.duplicateGroup) groups.set(asset.duplicateGroup, [...(groups.get(asset.duplicateGroup) ?? []), asset]); });
  return [...groups.values()].filter((group) => group.length > 1);
}

export function getPhase31Completion(): number {
  return Math.round((PHASE31_MODULES.length / 13) * 100);
}

export type Phase51Item = { id: string; title: string; description: string; status: "Ready" | "Foundation"; icon: any };

export const PHASE51_PLUGIN_ITEMS: Phase51Item[] = [
  {
    "id": "sdk",
    "title": "Typed Plugin SDK",
    "description": "Manifest, lifecycle, permission, compatibility, command, and extension-point contracts.",
    "status": "Ready",
    "icon": "code-slash-outline"
  },
  {
    "id": "manager",
    "title": "Plugin Manager",
    "description": "Install-state registry, enable and disable controls, compatibility status, and dependency visibility.",
    "status": "Ready",
    "icon": "extension-puzzle-outline"
  },
  {
    "id": "api",
    "title": "Editor Extension APIs",
    "description": "Contracts for document, page, selection, history, export, asset, template, and notification access.",
    "status": "Ready",
    "icon": "git-network-outline"
  },
  {
    "id": "samples",
    "title": "Starter Plugin Catalog",
    "description": "QR, barcode, calendar, palette, lorem ipsum, watermark, and social export examples.",
    "status": "Ready",
    "icon": "albums-outline"
  },
  {
    "id": "distribution",
    "title": "Signed Plugin Distribution",
    "description": "Production signing, remote catalog hosting, trust review, and developer payouts remain external services.",
    "status": "Foundation",
    "icon": "storefront-outline"
  }
] as Phase51Item[];

export const PHASE51_PLUGIN_ENGINE = {
  phase: 51,
  label: "Plugin SDK & Developer Platform",
  summary: "Phase 51 \u00b7 Extensible editor APIs, plugin lifecycle, starter extensions, and honest distribution gates",
  score: Math.round((PHASE51_PLUGIN_ITEMS.filter(item => item.status === "Ready").length / PHASE51_PLUGIN_ITEMS.length) * 100),
  completed: PHASE51_PLUGIN_ITEMS.filter(item => item.status === "Ready").length,
  total: PHASE51_PLUGIN_ITEMS.length,
} as const;

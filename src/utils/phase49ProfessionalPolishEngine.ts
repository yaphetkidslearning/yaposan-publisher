export type Phase49Item = { id: string; title: string; description: string; status: "Ready" | "Foundation"; icon: any };

export const PHASE49_POLISH_ITEMS: Phase49Item[] = [
  {
    "id": "ui",
    "title": "Professional UI Polish",
    "description": "Consistent interaction states, transitions, loading feedback, empty states, and notification patterns.",
    "status": "Ready",
    "icon": "sparkles-outline"
  },
  {
    "id": "onboarding",
    "title": "Onboarding & Quick Actions",
    "description": "First-run guidance, recent-work shortcuts, contextual tips, and command discovery.",
    "status": "Ready",
    "icon": "compass-outline"
  },
  {
    "id": "workspace",
    "title": "Workspace Preferences",
    "description": "Saved workspace presets, panel visibility, appearance, autosave, and editor preferences.",
    "status": "Ready",
    "icon": "options-outline"
  },
  {
    "id": "accessibility",
    "title": "Accessibility Foundation",
    "description": "Keyboard navigation, visible focus, scalable interface controls, and screen-reader labels.",
    "status": "Ready",
    "icon": "accessibility-outline"
  },
  {
    "id": "diagnostics",
    "title": "Diagnostics Center",
    "description": "System information, cache controls, error summaries, and performance status in one place.",
    "status": "Ready",
    "icon": "pulse-outline"
  }
] as Phase49Item[];

export const PHASE49_POLISH_ENGINE = {
  phase: 49,
  label: "Professional Polish Center",
  summary: "Phase 49 \u00b7 Product-wide user experience and diagnostics",
  score: Math.round((PHASE49_POLISH_ITEMS.filter(item => item.status === "Ready").length / PHASE49_POLISH_ITEMS.length) * 100),
  completed: PHASE49_POLISH_ITEMS.filter(item => item.status === "Ready").length,
  total: PHASE49_POLISH_ITEMS.length,
} as const;

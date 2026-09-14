export type Phase50Item = { id: string; title: string; description: string; status: "Ready" | "Foundation"; icon: any };

export const PHASE50_RELEASE_ITEMS: Phase50Item[] = [
  {
    "id": "release",
    "title": "Release Readiness",
    "description": "Tracks source version, required configuration, critical modules, and unresolved release blockers.",
    "status": "Ready",
    "icon": "checkmark-circle-outline"
  },
  {
    "id": "manifest",
    "title": "Build Manifest",
    "description": "Creates a deterministic inventory for web, desktop, mobile, documentation, and release artifacts.",
    "status": "Ready",
    "icon": "list-outline"
  },
  {
    "id": "docs",
    "title": "Documentation Index",
    "description": "Central release documentation registry for users, administrators, developers, and upgrades.",
    "status": "Ready",
    "icon": "book-outline"
  },
  {
    "id": "backup",
    "title": "Backup & Recovery",
    "description": "Defines project archive, restore, migration, and recovery verification workflows.",
    "status": "Ready",
    "icon": "cloud-download-outline"
  },
  {
    "id": "external",
    "title": "External Dependency Gates",
    "description": "Keeps credentials, signing, app-store approval, billing, and cloud deployment marked as external requirements.",
    "status": "Foundation",
    "icon": "shield-checkmark-outline"
  }
] as Phase50Item[];

export const PHASE50_RELEASE_ENGINE = {
  phase: 50,
  label: "Yaposan Release Center",
  summary: "\u00b7 Honest release readiness, manifests, documentation, and recovery",
  score: Math.round((PHASE50_RELEASE_ITEMS.filter(item => item.status === "Ready").length / PHASE50_RELEASE_ITEMS.length) * 100),
  completed: PHASE50_RELEASE_ITEMS.filter(item => item.status === "Ready").length,
  total: PHASE50_RELEASE_ITEMS.length,
} as const;

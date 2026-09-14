/** product-boundary contract. UI work in + should consume these concepts. */
export const YAPOSAN_ENTRY_PATHS = [
  { id: "ai-page", label: "Create My AI Page", description: "Create a personal AI-powered page, workspace, audience, studios, and business." },
  { id: "creator", label: "Open Yaposan Creator", description: "Use Yaposan's creative and publishing tools without creating an AI page." },
] as const;

export const DEFAULT_FREE_CAPABILITIES = [
  "publisher",
  "publisher.templates",
  "publisher.pages",
  "publisher.websites",
  "tools.background-remover",
  "tools.catalog-creator",
  "profile.public-page",
] as const;

export const SPACE_VISIBILITY = ["private", "team", "public", "paid"] as const;
export const SPACE_ROLES = ["owner", "admin", "editor", "store_manager", "viewer"] as const;

// "Space" remains the internal architecture term; "AI Page" is the customer-facing term.
export const SPACE_CUSTOMER_LABEL = "AI Page" as const;

import type { CreationKind, EditableProjectDraft } from "./creativeCreationEngine";

export type CreationAction =
  | "edit"
  | "regenerate"
  | "variations"
  | "change-style"
  | "resize"
  | "translate"
  | "animate"
  | "export"
  | "publish";

export const CREATION_RESULT_ACTIONS: CreationAction[] = [
  "edit",
  "regenerate",
  "variations",
  "change-style",
  "resize",
  "translate",
  "animate",
  "export",
  "publish",
];

export type AgentWorkflow = {
  id: string;
  name: string;
  trigger: "manual" | "schedule" | "event";
  schedule?: string;
  steps: Array<{ id: string; action: string; studio: string }>;
  enabled: boolean;
};

export function buildCrossStudioWorkflow(project: EditableProjectDraft) {
  const routes: Partial<Record<CreationKind, string[]>> = {
    video: ["Yaposan AI", "Photo Studio", "AI Video Studio", "Audio Studio", "Video Studio"],
    marketing: ["Yaposan AI", "Photo Studio", "Marketing Center", "Publisher"],
    social: ["Yaposan AI", "Photo Studio", "Marketing Center", "Publisher"],
    website: ["Yaposan AI", "Photo Studio", "Web Studio"],
    presentation: ["Yaposan AI", "Photo Studio", "Presentation Studio"],
    design: ["Yaposan AI", "Photo Studio", "Publisher"],
    image: ["Yaposan AI", "AI Image Studio", "Photo Studio"],
    document: ["Yaposan AI", "Document Tools"],
    audio: ["Yaposan AI", "Audio Studio"],
    app: ["Yaposan AI", "App Studio"],
    automation: ["Yaposan AI", "Automation Center"],
  };
  return routes[project.projectType] ?? ["Yaposan AI", project.destination];
}

export function createAgentWorkflow(
  name: string,
  steps: Array<{ action: string; studio: string }>,
  trigger: AgentWorkflow["trigger"] = "manual",
  schedule?: string,
): AgentWorkflow {
  return {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    trigger,
    schedule,
    steps: steps.map((item, index) => ({ id: `step-${index + 1}`, ...item })),
    enabled: true,
  };
}

export type AppProjectDraft = {
  type: "app";
  name: string;
  screens: string[];
  dataEntities: Array<{ name: string; fields: string[] }>;
  features: string[];
  auth: { enabled: boolean; roles: string[] };
  workflows: string[];
  integrations: string[];
  deployment: string[];
  editable: true;
};

export function createAppProjectDraft(prompt: string): AppProjectDraft {
  const normalized = prompt.toLowerCase();
  const inventory = /inventory|warehouse|stock/.test(normalized);
  const booking = /booking|appointment|reservation/.test(normalized);
  const screens = inventory
    ? ["Dashboard", "Inventory", "Item Detail", "Receive / Adjust Stock", "Reports", "Settings"]
    : booking
      ? ["Dashboard", "Calendar", "Customers", "Booking Detail", "Services", "Settings"]
      : ["Dashboard", "Records", "Detail", "Create / Edit", "Reports", "Settings"];
  const entities = inventory
    ? [
        { name: "User", fields: ["id", "name", "email", "role"] },
        { name: "InventoryItem", fields: ["id", "sku", "name", "quantity", "location", "updatedAt"] },
        { name: "StockMovement", fields: ["id", "itemId", "type", "quantity", "createdAt"] },
      ]
    : [
        { name: "User", fields: ["id", "name", "email", "role"] },
        { name: "Record", fields: ["id", "title", "status", "ownerId", "createdAt", "updatedAt"] },
      ];
  return {
    type: "app",
    name: prompt.trim().replace(/^(create|build|make)\s+(an?\s+)?/i, "").slice(0, 64) || "Untitled App",
    screens,
    dataEntities: entities,
    features: [
      "Responsive UI",
      "Forms and validation",
      "Search, sort, and filtering",
      "Role-based permissions",
      "API-ready data layer",
      "Editable workflow actions",
    ],
    auth: { enabled: true, roles: ["Admin", "Editor", "Viewer"] },
    workflows: ["Create record", "Update record", "Archive record", "Notify on important changes"],
    integrations: ["REST API", "Webhook", "CSV import/export"],
    deployment: ["Web", "PWA-ready", "Environment configuration"],
    editable: true,
  };
}

export type ResultActionResolution = {
  action: CreationAction;
  route?: string;
  nextPrompt?: string;
  message: string;
};

export function resolveCreationAction(
  action: CreationAction,
  project: EditableProjectDraft,
): ResultActionResolution {
  switch (action) {
    case "edit":
      return { action, route: project.route, message: `Opening ${project.destination}.` };
    case "regenerate":
      return { action, nextPrompt: project.sourcePrompt, message: "Regenerating this project." };
    case "variations":
      return { action, nextPrompt: `${project.sourcePrompt}\nCreate three clearly different editable variations.`, message: "Creating variations." };
    case "change-style":
      return { action, nextPrompt: `${project.sourcePrompt}\nCreate a new visual style while preserving the original content and purpose.`, message: "Preparing a style variation." };
    case "resize":
      return { action, route: project.route, message: "Open the editable project and choose a target size or channel preset." };
    case "translate":
      return { action, nextPrompt: `${project.sourcePrompt}\nPrepare this project for translation while preserving layout and editable text.`, message: "Preparing a translation-ready version." };
    case "animate":
      return { action, route: project.projectType === "video" ? "/ai-video-studio" : project.route, message: "Opening animation-capable editing tools." };
    case "export":
      return { action, route: project.route, message: "Opening the project with export controls available." };
    case "publish":
      return { action, route: project.projectType === "website" ? "/web-studio" : project.route, message: "Opening the project with publishing controls available." };
  }
}

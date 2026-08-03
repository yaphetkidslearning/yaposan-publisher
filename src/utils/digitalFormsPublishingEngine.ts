import type { PublisherProject } from "../types/publisher";
import { normalizeInteractiveWebPublishing } from "./interactiveWebPublishingEngine";
import type { ResponsiveBreakpointId } from "./responsiveWebPublishingEngine";

export type DigitalFormFieldType = "text" | "email" | "phone" | "number" | "textarea" | "select" | "checkbox" | "radio" | "date" | "consent";
export type DigitalFormSubmitAction = "store-local" | "email" | "webhook" | "download-csv";

export type DigitalFormFieldOption = { id: string; label: string; value: string };

export type DigitalFormField = {
  id: string;
  name: string;
  label: string;
  type: DigitalFormFieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: DigitalFormFieldOption[];
  min?: number;
  max?: number;
  pattern?: string;
  defaultValue?: string | boolean | number;
  autocomplete?: string;
  order: number;
  enabled: boolean;
};

export type DigitalFormDefinition = {
  id: string;
  name: string;
  pageId: string;
  containerElementId?: string;
  fields: DigitalFormField[];
  breakpointIds: ResponsiveBreakpointId[];
  submitLabel: string;
  successMessage: string;
  failureMessage: string;
  submitAction: DigitalFormSubmitAction;
  destination?: string;
  requireConsent: boolean;
  consentText?: string;
  honeypotEnabled: boolean;
  rateLimitPerMinute: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export type DigitalFormsPublishingState = {
  version: "22.3";
  initializedAt: number;
  updatedAt: number;
  forms: DigitalFormDefinition[];
  privacyNotice?: string;
  retainSubmissionsDays: number;
  encryptStoredSubmissions: boolean;
  revision: number;
};

export type DigitalFormIssue = {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  formId?: string;
  fieldId?: string;
  pageId?: string;
  elementId?: string;
  fix?: string;
};

export type DigitalFormsManifest = {
  version: "22.3";
  generatedAt: number;
  projectId: string;
  projectName: string;
  revision: number;
  forms: DigitalFormDefinition[];
  privacy: {
    notice?: string;
    retainSubmissionsDays: number;
    encryptStoredSubmissions: boolean;
  };
  checksum: string;
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `df-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createDigitalFormsPublishingState(now = Date.now()): DigitalFormsPublishingState {
  return {
    version: "22.3",
    initializedAt: now,
    updatedAt: now,
    forms: [],
    retainSubmissionsDays: 30,
    encryptStoredSubmissions: true,
    revision: 1,
  };
}

export function normalizeDigitalFormsPublishing(project: PublisherProject): PublisherProject {
  const interactive = normalizeInteractiveWebPublishing(project);
  const now = Date.now();
  const fallback = createDigitalFormsPublishingState(now);
  const current = interactive.digitalFormsPublishing;
  const pageIds = new Set(interactive.pages.map((page) => page.id));
  const elementIds = new Set(interactive.pages.flatMap((page) => page.elements.map((element) => element.id)));
  const forms: DigitalFormDefinition[] = (current?.forms ?? []).filter((form) => pageIds.has(form.pageId) && (!form.containerElementId || elementIds.has(form.containerElementId))).map((form): DigitalFormDefinition => ({
    ...form,
    fields: [...form.fields].sort((a, b) => a.order - b.order),
    breakpointIds: form.breakpointIds.length ? [...form.breakpointIds] : (["mobile", "tablet", "desktop"] as ResponsiveBreakpointId[]),
    rateLimitPerMinute: Math.max(1, form.rateLimitPerMinute || 10),
    submitLabel: form.submitLabel.trim() || "Submit",
    successMessage: form.successMessage.trim() || "Thank you. Your response was submitted.",
    failureMessage: form.failureMessage.trim() || "Your response could not be submitted.",
  }));
  return {
    ...interactive,
    phase22Version: "22.3",
    digitalFormsPublishing: {
      ...fallback,
      ...current,
      version: "22.3",
      updatedAt: now,
      forms,
      retainSubmissionsDays: Math.max(0, current?.retainSubmissionsDays ?? 30),
      encryptStoredSubmissions: current?.encryptStoredSubmissions !== false,
      revision: Math.max(1, current?.revision ?? 1),
    },
  };
}

export function addDigitalForm(
  project: PublisherProject,
  input: Omit<DigitalFormDefinition, "id" | "createdAt" | "updatedAt">,
): PublisherProject {
  const normalized = normalizeDigitalFormsPublishing(project);
  const state = normalized.digitalFormsPublishing!;
  const now = Date.now();
  const form: DigitalFormDefinition = { ...input, id: uid("form"), createdAt: now, updatedAt: now };
  return {
    ...normalized,
    updatedAt: now,
    digitalFormsPublishing: { ...state, forms: [...state.forms, form], updatedAt: now, revision: state.revision + 1 },
  };
}

export function updateDigitalForm(project: PublisherProject, id: string, updates: Partial<Omit<DigitalFormDefinition, "id" | "createdAt">>): PublisherProject {
  const normalized = normalizeDigitalFormsPublishing(project);
  const state = normalized.digitalFormsPublishing!;
  const now = Date.now();
  return {
    ...normalized,
    updatedAt: now,
    digitalFormsPublishing: {
      ...state,
      forms: state.forms.map((form) => form.id === id ? { ...form, ...updates, id: form.id, createdAt: form.createdAt, updatedAt: now } : form),
      updatedAt: now,
      revision: state.revision + 1,
    },
  };
}

export function deleteDigitalForm(project: PublisherProject, id: string): PublisherProject {
  const normalized = normalizeDigitalFormsPublishing(project);
  const state = normalized.digitalFormsPublishing!;
  const now = Date.now();
  return {
    ...normalized,
    updatedAt: now,
    digitalFormsPublishing: { ...state, forms: state.forms.filter((form) => form.id !== id), updatedAt: now, revision: state.revision + 1 },
  };
}

export function validateDigitalFormsPublishing(project: PublisherProject): DigitalFormIssue[] {
  const normalized = normalizeDigitalFormsPublishing(project);
  const state = normalized.digitalFormsPublishing!;
  const pageIds = new Set(normalized.pages.map((page) => page.id));
  const elementIds = new Set(normalized.pages.flatMap((page) => page.elements.map((element) => element.id)));
  const issues: DigitalFormIssue[] = [];
  for (const form of state.forms) {
    if (!pageIds.has(form.pageId)) issues.push({ id: `page-${form.id}`, severity: "error", formId: form.id, pageId: form.pageId, message: "Form references a missing page.", fix: "Select an existing page." });
    if (form.containerElementId && !elementIds.has(form.containerElementId)) issues.push({ id: `container-${form.id}`, severity: "error", formId: form.id, elementId: form.containerElementId, message: "Form container element is missing." });
    if (!form.name.trim()) issues.push({ id: `name-${form.id}`, severity: "warning", formId: form.id, message: "Form has no descriptive name.", fix: "Add an internal form name." });
    if (!form.fields.length) issues.push({ id: `fields-${form.id}`, severity: "error", formId: form.id, message: "Form has no fields.", fix: "Add at least one field." });
    if (!form.breakpointIds.length) issues.push({ id: `breakpoints-${form.id}`, severity: "warning", formId: form.id, message: "Form is not enabled for any responsive breakpoint." });
    if (["email", "webhook"].includes(form.submitAction) && !form.destination?.trim()) issues.push({ id: `destination-${form.id}`, severity: "error", formId: form.id, message: "This submission action requires a destination." });
    if (form.submitAction === "webhook" && !/^https:\/\//i.test(form.destination ?? "")) issues.push({ id: `webhook-${form.id}`, severity: "error", formId: form.id, message: "Webhook destinations must use HTTPS.", fix: "Use a secure HTTPS endpoint." });
    if (form.requireConsent && !form.consentText?.trim()) issues.push({ id: `consent-${form.id}`, severity: "error", formId: form.id, message: "Consent is required but consent text is missing." });
    if (!form.honeypotEnabled) issues.push({ id: `spam-${form.id}`, severity: "warning", formId: form.id, message: "Spam protection is disabled.", fix: "Enable the honeypot field." });
    const names = new Set<string>();
    for (const field of form.fields) {
      const normalizedName = field.name.trim().toLowerCase();
      if (!field.label.trim()) issues.push({ id: `label-${form.id}-${field.id}`, severity: "error", formId: form.id, fieldId: field.id, message: "Field requires an accessible label." });
      if (!normalizedName) issues.push({ id: `field-name-${form.id}-${field.id}`, severity: "error", formId: form.id, fieldId: field.id, message: "Field requires a submission name." });
      else if (names.has(normalizedName)) issues.push({ id: `duplicate-${form.id}-${field.id}`, severity: "error", formId: form.id, fieldId: field.id, message: "Field names must be unique within a form." });
      names.add(normalizedName);
      if (["select", "radio"].includes(field.type) && !(field.options?.length)) issues.push({ id: `options-${form.id}-${field.id}`, severity: "error", formId: form.id, fieldId: field.id, message: "Choice fields require at least one option." });
      if (field.type === "email" && field.autocomplete && field.autocomplete !== "email") issues.push({ id: `autocomplete-${form.id}-${field.id}`, severity: "info", formId: form.id, fieldId: field.id, message: "Email fields should use the email autocomplete token." });
    }
  }
  if (state.forms.length && !state.privacyNotice?.trim()) issues.push({ id: "privacy-notice", severity: "warning", message: "Forms collect data but no privacy notice is configured.", fix: "Add a privacy notice before publishing." });
  if (!state.encryptStoredSubmissions && state.forms.some((form) => form.submitAction === "store-local")) issues.push({ id: "encryption", severity: "warning", message: "Locally stored submissions are not encrypted." });
  return issues;
}

export function createDigitalFormsManifest(project: PublisherProject): DigitalFormsManifest {
  const normalized = normalizeDigitalFormsPublishing(project);
  const state = normalized.digitalFormsPublishing!;
  const body = {
    version: "22.3" as const,
    projectId: normalized.id,
    projectName: normalized.name,
    revision: state.revision,
    forms: state.forms.filter((form) => form.enabled).map((form) => ({ ...form, fields: form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order) })),
    privacy: {
      notice: state.privacyNotice,
      retainSubmissionsDays: state.retainSubmissionsDays,
      encryptStoredSubmissions: state.encryptStoredSubmissions,
    },
  };
  return { ...body, generatedAt: Date.now(), checksum: stableHash(JSON.stringify(body)) };
}

export function exportDigitalFormsPublishing(project: PublisherProject): string {
  const normalized = normalizeDigitalFormsPublishing(project);
  return JSON.stringify({ phase: "22.3", generatedAt: new Date().toISOString(), manifest: createDigitalFormsManifest(normalized), issues: validateDigitalFormsPublishing(normalized) }, null, 2);
}

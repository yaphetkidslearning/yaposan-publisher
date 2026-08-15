export const SUPPORT_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const SUPPORT_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/json",
  "application/zip",
];

export type SupportAttachment = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

export type SupportContext = {
  source?: string;
  page?: string;
  action?: string;
  error?: string;
  category?: string;
};

export function isValidSupportEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isAllowedSupportAttachment(attachment: SupportAttachment): boolean {
  if (attachment.size && attachment.size > SUPPORT_MAX_ATTACHMENT_BYTES) return false;
  if (!attachment.mimeType) return false;
  return SUPPORT_ALLOWED_MIME_TYPES.includes(attachment.mimeType.toLowerCase());
}

export function inferSupportCategory(source = "", page = ""): string {
  const value = `${source} ${page}`.toLowerCase();
  if (value.includes("photo")) return "Photo Studio";
  if (value.includes("provider") || value.includes(" ai") || value.startsWith("ai")) return "AI Provider";
  if (value.includes("project") || value.includes("save")) return "Projects / Saving";
  if (value.includes("export") || value.includes("publish") || value.includes("web")) return "Export / Publishing";
  if (value.includes("account") || value.includes("sign")) return "Account / Sign In";
  if (value.includes("billing") || value.includes("credit")) return "Billing";
  return "Bug / Problem";
}

export function buildContactHref(context: SupportContext): string {
  const params = new URLSearchParams();
  if (context.source) params.set("source", context.source);
  if (context.page) params.set("page", context.page);
  if (context.action) params.set("action", context.action);
  if (context.error) params.set("error", context.error);
  params.set("category", context.category || inferSupportCategory(context.source, context.page));
  const query = params.toString();
  return query ? `/contact?${query}` : "/contact";
}

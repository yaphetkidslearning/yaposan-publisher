export type Phase34Module = { id: string; title: string; description: string; features: string[] };
export type ReleaseJobKind = "deploy" | "render" | "publish" | "billing" | "marketplace" | "certification";
export type ReleaseJobStatus = "queued" | "running" | "completed" | "failed";
export type ReleaseJob = { id: string; title: string; kind: ReleaseJobKind; status: ReleaseJobStatus; progress: number; target?: string; createdAt: string };
export type ReleaseChannel = { id: string; name: string; category: "social" | "commerce" | "website" | "desktop-mobile"; connected: boolean; capabilities: string[] };
export type SubscriptionPlan = { id: string; name: string; monthlyPrice: number; annualPrice: number; aiCredits: number; storageGb: number; teamSeats: number; features: string[] };

export const PHASE34_MODULES: Phase34Module[] = [
  { id: "34.0", title: "Production Deployment", description: "Development, staging and production release orchestration with domains, HTTPS, CDN and monitoring.", features: ["Environment profiles", "Deployment scripts", "Domain and HTTPS", "CDN delivery", "Health and uptime checks"] },
  { id: "34.1", title: "Real Export Rendering", description: "Unified render contracts for documents, images, vector, video, animation and audio output.", features: ["PDF and print output", "PNG, JPG and WebP", "SVG packaging", "MP4, WebM and GIF", "Audio and transparent media"] },
  { id: "34.2", title: "Cloud Rendering Farm", description: "Distributed rendering queues with priority, progress, cancellation, retry and recovery.", features: ["Worker pools", "Priority queues", "Progress events", "Cancellation and retry", "Failed-render recovery"] },
  { id: "34.3", title: "Real Social Publishing", description: "Provider-ready OAuth and scheduled publishing for major social channels.", features: ["YouTube", "TikTok", "Instagram and Facebook", "LinkedIn", "Pinterest"] },
  { id: "34.4", title: "Real Commerce Publishing", description: "Store authorization and product listing workflows for major commerce platforms.", features: ["Shopify", "Etsy", "eBay", "Amazon", "Inventory and listing sync"] },
  { id: "34.5", title: "Website Publishing", description: "Static site, PWA, WordPress and custom-domain deployment with rollback history.", features: ["Custom domains", "Static hosting", "PWA deployment", "WordPress adapter", "Rollback history"] },
  { id: "34.6", title: "Payments and Subscriptions", description: "Stripe-ready plans, credits, billing portal, invoices and failed-payment handling.", features: ["Free and paid plans", "Monthly and annual billing", "AI credits", "Billing portal", "Invoices and dunning"] },
  { id: "34.7", title: "Marketplace Payments", description: "Creator onboarding, product review, licensing, revenue share, refunds and payout foundation.", features: ["Creator accounts", "Product review", "Purchases and downloads", "Platform fees", "Refund and payout ledger"] },
  { id: "34.8", title: "Licensing and Plan Enforcement", description: "Centralized feature gates, quotas and plan-based access controls.", features: ["Feature access", "Storage quotas", "AI and export limits", "Team limits", "Upgrade warnings"] },
  { id: "34.9", title: "Analytics and Business Intelligence", description: "Operational and commercial metrics for users, usage, revenue, publishing and system health.", features: ["User growth", "Retention", "AI and export usage", "Revenue and subscriptions", "Marketplace and performance"] },
  { id: "34.10", title: "Desktop and Mobile Release", description: "Release manifests for web, Windows, macOS, Android and iOS applications.", features: ["Web production build", "Windows and macOS", "Android and iOS", "Deep links", "Update channels"] },
  { id: "34.11", title: "Production Hardening", description: "Performance, security, accessibility and compatibility readiness for large production workloads.", features: ["Large-file optimization", "Caching and indexing", "Security review", "Accessibility review", "Browser and mobile compatibility"] },
  { id: "34.12", title: "Commercial Release Certification", description: "Final regression, payment, publishing, recovery and launch certification.", features: ["TypeScript validation", "Production build validation", "Payment and publishing tests", "Backup and recovery", "Launch checklist"] },
];

export const RELEASE_CHANNELS: ReleaseChannel[] = [
  { id: "youtube", name: "YouTube", category: "social", connected: false, capabilities: ["video", "schedule", "analytics"] },
  { id: "instagram", name: "Instagram", category: "social", connected: false, capabilities: ["image", "video", "schedule"] },
  { id: "tiktok", name: "TikTok", category: "social", connected: false, capabilities: ["video", "schedule"] },
  { id: "facebook", name: "Facebook", category: "social", connected: false, capabilities: ["image", "video", "schedule"] },
  { id: "shopify", name: "Shopify", category: "commerce", connected: false, capabilities: ["products", "inventory", "orders"] },
  { id: "etsy", name: "Etsy", category: "commerce", connected: false, capabilities: ["products", "variations"] },
  { id: "ebay", name: "eBay", category: "commerce", connected: false, capabilities: ["products", "inventory"] },
  { id: "amazon", name: "Amazon", category: "commerce", connected: false, capabilities: ["products", "inventory"] },
  { id: "static-web", name: "Static Web", category: "website", connected: true, capabilities: ["html", "zip", "pwa"] },
  { id: "wordpress", name: "WordPress", category: "website", connected: false, capabilities: ["pages", "media"] },
  { id: "windows", name: "Windows", category: "desktop-mobile", connected: true, capabilities: ["installer", "updates"] },
  { id: "ios", name: "iOS", category: "desktop-mobile", connected: false, capabilities: ["app-store", "deep-links"] },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "free", name: "Free", monthlyPrice: 0, annualPrice: 0, aiCredits: 100, storageGb: 1, teamSeats: 1, features: ["Basic templates", "Standard exports", "Community support"] },
  { id: "professional", name: "Professional", monthlyPrice: 9.99, annualPrice: 99.99, aiCredits: 1000, storageGb: 25, teamSeats: 1, features: ["1,000+ templates", "Premium exports", "Limited AI tools", "Priority support"] },
  { id: "professional-plus", name: "Professional Plus", monthlyPrice: 19.99, annualPrice: 199.99, aiCredits: 5000, storageGb: 100, teamSeats: 5, features: ["5,000+ templates", "Advanced AI tools", "Brand kits and custom fonts", "Advanced exports"] },
  { id: "enterprise", name: "Enterprise", monthlyPrice: 39.99, annualPrice: 399.99, aiCredits: 25000, storageGb: 1000, teamSeats: 25, features: ["Unlimited templates", "Full AI suite", "Team collaboration", "SSO and advanced security", "Dedicated support"] },
];

export function createReleaseJob(title: string, kind: ReleaseJobKind, target?: string): ReleaseJob {
  return { id: `release-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, kind, target, status: "queued", progress: 0, createdAt: new Date().toISOString() };
}

export function advanceReleaseJob(job: ReleaseJob): ReleaseJob {
  if (job.status === "completed") return job;
  const next = Math.min(100, job.progress + 25);
  return { ...job, progress: next, status: next >= 100 ? "completed" : "running" };
}

export function canUseFeature(plan: SubscriptionPlan, feature: "ai" | "commerce" | "team" | "priority-render"): boolean {
  if (feature === "ai") return plan.aiCredits > 0;
  if (feature === "commerce") return plan.id === "professional" || plan.id === "professional-plus" || plan.id === "enterprise";
  if (feature === "team") return plan.teamSeats > 1;
  return plan.id === "enterprise";
}

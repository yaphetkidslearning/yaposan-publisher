import { createHash, randomUUID } from "node:crypto";
import type { DatabaseAdapter } from "./database";
import { organizationContext } from "./commercialPlatform";

export type CreatorProductKind = "template" | "asset" | "plugin";
export type CreatorProductStatus = "draft" | "review" | "approved" | "rejected";
export type CreatorProduct = {
  id: string;
  creatorUserId: string;
  organizationId: string;
  kind: CreatorProductKind;
  name: string;
  description: string;
  priceCents: number;
  license: "personal" | "commercial" | "extended";
  status: CreatorProductStatus;
  downloadHash: string;
  createdAt: string;
  updatedAt: string;
};

type ProductEventMeta = { product: CreatorProduct };
type PurchaseEventMeta = { productId: string; buyerUserId: string; creatorUserId: string; grossCents: number; payoutCents: number; license: string };

const safeProduct = (value: unknown) => value && typeof value === "object" ? value as CreatorProduct : undefined;

export async function listCreatorProducts(db: DatabaseAdapter, options: { creatorUserId?: string; approvedOnly?: boolean } = {}) {
  const events = await db.find("auditEvents", row => row.action === "marketplace.product.snapshot");
  const latest = new Map<string, CreatorProduct>();
  for (const event of events.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const product = safeProduct((event.metadata as ProductEventMeta | undefined)?.product);
    if (product) latest.set(product.id, product);
  }
  return [...latest.values()]
    .filter(product => !options.creatorUserId || product.creatorUserId === options.creatorUserId)
    .filter(product => !options.approvedOnly || product.status === "approved")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function submitCreatorProduct(db: DatabaseAdapter, userId: string, input: { kind?: CreatorProductKind; name: string; description?: string; priceCents?: number; license?: CreatorProduct["license"]; payload?: string }) {
  const { organization } = await organizationContext(db, userId);
  const name = input.name.trim();
  if (!name) throw new Error("PRODUCT_NAME_REQUIRED");
  const kind = ["template", "asset", "plugin"].includes(String(input.kind)) ? input.kind! : "template";
  const priceCents = Math.max(0, Math.min(500000, Math.round(Number(input.priceCents ?? 0))));
  const license = ["personal", "commercial", "extended"].includes(String(input.license)) ? input.license! : "personal";
  const now = new Date().toISOString();
  const product: CreatorProduct = {
    id: randomUUID(), creatorUserId: userId, organizationId: organization.id, kind, name,
    description: String(input.description ?? "").trim().slice(0, 2000), priceCents, license,
    status: "review", downloadHash: createHash("sha256").update(String(input.payload ?? name)).digest("hex"), createdAt: now, updatedAt: now,
  };
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId: userId, action: "marketplace.product.snapshot", target: product.id, metadata: { product } });
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId: userId, action: "marketplace.product.submitted", target: product.id, metadata: { kind, priceCents, license } });
  return product;
}

export async function moderateCreatorProduct(db: DatabaseAdapter, actorUserId: string, productId: string, approved: boolean, adminEmails: string[] = []) {
  const actor = await db.get("users", actorUserId);
  const { membership } = await organizationContext(db, actorUserId);
  const isGlobalAdmin = Boolean(actor && adminEmails.map(x => x.toLowerCase()).includes(actor.email.toLowerCase()));
  if (!isGlobalAdmin && !["owner", "admin"].includes(membership.role)) throw new Error("MARKETPLACE_ADMIN_REQUIRED");
  const current = (await listCreatorProducts(db)).find(product => product.id === productId);
  if (!current) throw new Error("PRODUCT_NOT_FOUND");
  const product = { ...current, status: approved ? "approved" as const : "rejected" as const, updatedAt: new Date().toISOString() };
  await db.insert("auditEvents", { organizationId: current.organizationId, actorUserId, action: "marketplace.product.snapshot", target: product.id, metadata: { product } });
  await db.insert("auditEvents", { organizationId: current.organizationId, actorUserId, action: approved ? "marketplace.product.approved" : "marketplace.product.rejected", target: product.id });
  return product;
}

export async function purchaseCreatorProduct(db: DatabaseAdapter, buyerUserId: string, productId: string) {
  const product = (await listCreatorProducts(db, { approvedOnly: true })).find(item => item.id === productId);
  if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
  const already = await db.find("auditEvents", row => row.action === "marketplace.purchase.completed" && row.actorUserId === buyerUserId && row.target === productId);
  if (already.length) return { product, alreadyOwned: true, payoutCents: Number((already[0].metadata as PurchaseEventMeta | undefined)?.payoutCents ?? 0) };
  const payoutCents = Math.floor(product.priceCents * 0.7);
  const { organization } = await organizationContext(db, buyerUserId);
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId: buyerUserId, action: "marketplace.purchase.completed", target: productId, metadata: { productId, buyerUserId, creatorUserId: product.creatorUserId, grossCents: product.priceCents, payoutCents, license: product.license } satisfies PurchaseEventMeta });
  return { product, alreadyOwned: false, payoutCents };
}

export async function creatorDashboard(db: DatabaseAdapter, userId: string) {
  const products = await listCreatorProducts(db, { creatorUserId: userId });
  const purchases = await db.find("auditEvents", row => row.action === "marketplace.purchase.completed" && String((row.metadata as PurchaseEventMeta | undefined)?.creatorUserId ?? "") === userId);
  const grossCents = purchases.reduce((sum, event) => sum + Number((event.metadata as PurchaseEventMeta | undefined)?.grossCents ?? 0), 0);
  const payoutCents = purchases.reduce((sum, event) => sum + Number((event.metadata as PurchaseEventMeta | undefined)?.payoutCents ?? 0), 0);
  return { products, metrics: { totalProducts: products.length, approvedProducts: products.filter(p => p.status === "approved").length, sales: purchases.length, grossCents, payoutCents } };
}

export async function createReferralCode(db: DatabaseAdapter, userId: string) {
  const existing = (await db.find("auditEvents", row => row.action === "referral.code.created" && row.actorUserId === userId))[0];
  if (existing) return { code: String(existing.metadata?.code ?? "") };
  const code = createHash("sha256").update(`${userId}:${Date.now()}`).digest("hex").slice(0, 10).toUpperCase();
  const { organization } = await organizationContext(db, userId);
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId: userId, action: "referral.code.created", target: userId, metadata: { code } });
  return { code };
}

export async function redeemReferralCode(db: DatabaseAdapter, userId: string, code: string) {
  const event = (await db.find("auditEvents", row => row.action === "referral.code.created" && String(row.metadata?.code ?? "").toUpperCase() === code.trim().toUpperCase()))[0];
  if (!event || !event.actorUserId || event.actorUserId === userId) throw new Error("INVALID_REFERRAL_CODE");
  const prior = await db.find("auditEvents", row => row.action === "referral.code.redeemed" && row.actorUserId === userId);
  if (prior.length) throw new Error("REFERRAL_ALREADY_REDEEMED");
  const { organization } = await organizationContext(db, userId);
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId: userId, action: "referral.code.redeemed", target: event.actorUserId, metadata: { code: code.toUpperCase(), rewardAiCredits: 10 } });
  return { redeemed: true, rewardAiCredits: 10 };
}

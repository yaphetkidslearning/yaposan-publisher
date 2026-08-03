import { createHmac, timingSafeEqual } from "node:crypto";
import { PLAN_CATALOG, type PlanId } from "./billingPlatform.ts";

export type LicensePayload = {
  licenseId: string;
  organizationId: string;
  plan: PlanId;
  seats: number;
  deviceLimit: number;
  issuedAt: number;
  expiresAt: number;
  graceDays: number;
  features?: string[];
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");
const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function issueLicense(payload: LicensePayload, secret: string) {
  if (secret.length < 32) throw new Error("LICENSE_SECRET_TOO_WEAK");
  if (!PLAN_CATALOG[payload.plan]) throw new Error("INVALID_LICENSE_PLAN");
  if (payload.seats < 1 || payload.deviceLimit < 1) throw new Error("INVALID_LICENSE_LIMITS");
  if (payload.expiresAt <= payload.issuedAt) throw new Error("INVALID_LICENSE_EXPIRY");
  const body = encode(payload);
  return `${body}.${sign(body, secret)}`;
}

export function verifyLicense(token: string | undefined, secret: string, now = Date.now()) {
  if (!token || secret.length < 32) return { valid: false as const, status: "invalid" as const };
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(sign(body, secret), signature)) return { valid: false as const, status: "invalid" as const };
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as LicensePayload;
    if (!PLAN_CATALOG[payload.plan] || payload.seats < 1 || payload.deviceLimit < 1) return { valid: false as const, status: "invalid" as const };
    const graceEndsAt = payload.expiresAt + Math.max(0, payload.graceDays) * 86_400_000;
    if (now <= payload.expiresAt) return { valid: true as const, status: "active" as const, payload, graceEndsAt };
    if (now <= graceEndsAt) return { valid: true as const, status: "grace" as const, payload, graceEndsAt };
    return { valid: false as const, status: "expired" as const, payload, graceEndsAt };
  } catch {
    return { valid: false as const, status: "invalid" as const };
  }
}

export function canActivateDevice(payload: LicensePayload, activeDeviceIds: string[], deviceId: string) {
  const unique = new Set(activeDeviceIds.filter(Boolean));
  if (unique.has(deviceId)) return { allowed: true, activeDevices: unique.size };
  return { allowed: unique.size < payload.deviceLimit, activeDevices: unique.size };
}

export function stripePriceForPlan(plan: PlanId, env: NodeJS.ProcessEnv = process.env) {
  const definition = PLAN_CATALOG[plan];
  if (!definition || !definition.stripePriceEnv) throw new Error("PLAN_NOT_PURCHASABLE");
  const priceId = env[definition.stripePriceEnv];
  if (!priceId || !/^price_[A-Za-z0-9]+$/.test(priceId)) throw new Error("STRIPE_PRICE_NOT_CONFIGURED");
  return priceId;
}

export function validateCheckoutSelection(input: { plan: string; quantity?: number; successUrl: string; cancelUrl: string }, env: NodeJS.ProcessEnv = process.env) {
  const plan = input.plan as PlanId;
  if (!PLAN_CATALOG[plan] || plan === "free") throw new Error("INVALID_CHECKOUT_PLAN");
  const quantity = Math.floor(Number(input.quantity ?? 1));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 500) throw new Error("INVALID_CHECKOUT_QUANTITY");
  for (const value of [input.successUrl, input.cancelUrl]) {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("UNSAFE_CHECKOUT_URL");
  }
  return { plan, priceId: stripePriceForPlan(plan, env), quantity };
}

export function commercialDiagnostics(env: NodeJS.ProcessEnv = process.env) {
  const paidPlans = (Object.keys(PLAN_CATALOG) as PlanId[]).filter(plan => plan !== "free");
  const stripePrices = Object.fromEntries(paidPlans.map(plan => {
    const key = PLAN_CATALOG[plan].stripePriceEnv!;
    return [plan, Boolean(env[key] && /^price_[A-Za-z0-9]+$/.test(env[key]!))];
  }));
  return {
    licenseSigning: Boolean(env.LICENSE_SIGNING_SECRET && env.LICENSE_SIGNING_SECRET.length >= 32),
    stripe: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    stripePrices,
    email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
    oauth: {
      microsoft: Boolean(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_TENANT_ID),
      google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      apple: Boolean(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY),
      oidc: Boolean(env.OIDC_ISSUER && env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET),
      saml: Boolean(env.SAML_ENTRY_POINT && env.SAML_ISSUER && env.SAML_CERT),
    },
    mfaIssuer: env.MFA_ISSUER ?? "Yaposan",
  };
}

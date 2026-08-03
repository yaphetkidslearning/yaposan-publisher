import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { DatabaseAdapter, UserRecord } from "./database";

export type SessionClaims = { sub: string; sid: string; type: "access" | "refresh"; exp: number };
export type IdentityConfig = { secret: string; accessTokenMinutes: number; refreshTokenDays: number };

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = <T>(value: string) => JSON.parse(Buffer.from(value, "base64url").toString()) as T;
const signature = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export const hashPassword = (password: string, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
export const verifyPassword = (password: string, stored: string) => { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const a = Buffer.from(hash, "hex"), b = scryptSync(password, salt, 64); return a.length === b.length && timingSafeEqual(a, b); };
export const createToken = (claims: SessionClaims, secret: string) => { const payload = encode(claims); return `${payload}.${signature(payload, secret)}`; };
export const verifyToken = (token: string | undefined, secret: string, type?: SessionClaims["type"]) => { if (!token) return undefined; const raw = token.replace(/^Bearer\s+/i, ""); const [payload, sig] = raw.split("."); if (!payload || !sig || signature(payload, secret) !== sig) return undefined; const claims = decode<SessionClaims>(payload); if (claims.exp <= Date.now() || (type && claims.type !== type)) return undefined; return claims; };

export function issueSession(userId: string, config: IdentityConfig, sessionId: string = randomUUID()) {
  const access = createToken({ sub: userId, sid: sessionId, type: "access", exp: Date.now() + config.accessTokenMinutes * 60_000 }, config.secret);
  const refresh = createToken({ sub: userId, sid: sessionId, type: "refresh", exp: Date.now() + config.refreshTokenDays * 86_400_000 }, config.secret);
  return { accessToken: access, refreshToken: refresh, sessionId };
}

export async function provisionAccount(db: DatabaseAdapter, input: { email: string; password: string; organizationName?: string; region?: string }) {
  return db.transaction(async tx => {
    const user = await tx.insert("users", { email: input.email.toLowerCase(), passwordHash: hashPassword(input.password), emailVerified: false, status: "active" });
    const organization = await tx.insert("organizations", { name: input.organizationName ?? `${input.email.split("@")[0]}'s Organization`, ownerUserId: user.id, plan: "free" });
    await tx.insert("memberships", { organizationId: organization.id, userId: user.id, role: "owner" });
    const workspace = await tx.insert("workspaces", { organizationId: organization.id, name: "My Workspace", region: input.region ?? "us-east" });
    return { user, organization, workspace };
  });
}

export const publicUser = (user: UserRecord) => ({ id: user.id, email: user.email, emailVerified: user.emailVerified, status: user.status });

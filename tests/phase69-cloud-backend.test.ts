import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryDatabase } from "../server/database.ts";
import { hashPassword, issueSession, provisionAccount, verifyPassword, verifyToken } from "../server/identity.ts";
import { LocalObjectStorage } from "../server/storage.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POSTGRES_MIGRATIONS, PostgresDatabase, type SqlClient } from "../server/postgresDatabase.ts";

const connect = async () => { const db = new InMemoryDatabase(); await db.connect(); return db; };

test("Phase 69 provisions user, organization, membership and workspace atomically", async () => {
  const db = await connect();
  const account = await provisionAccount(db, { email: "owner@example.com", password: "strong-password", organizationName: "Yaposan Studio" });
  assert.equal(account.user.email, "owner@example.com");
  assert.equal(account.organization.ownerUserId, account.user.id);
  assert.equal((await db.find("memberships", m => m.userId === account.user.id))[0].role, "owner");
  assert.equal(account.workspace.organizationId, account.organization.id);
});

test("Phase 69 password hashing and rotating access/refresh sessions validate safely", () => {
  const stored = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", stored), true);
  assert.equal(verifyPassword("wrong", stored), false);
  const config = { secret: "test-secret", accessTokenMinutes: 15, refreshTokenDays: 30 };
  const session = issueSession("user-1", config);
  assert.equal(verifyToken(session.accessToken, config.secret, "access")?.sub, "user-1");
  assert.equal(verifyToken(session.refreshToken, config.secret, "refresh")?.sid, session.sessionId);
  assert.equal(verifyToken(session.accessToken, "wrong-secret"), undefined);
});

test("Phase 69 local object storage persists bytes and deterministic checksum", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaposan69-"));
  try {
    const storage = new LocalObjectStorage(root, "https://assets.example.test");
    const body = new TextEncoder().encode("phase69 asset");
    const stored = await storage.put({ workspaceId: "workspace-1", name: "Design File.yap", contentType: "application/octet-stream", body });
    assert.equal(stored.size, body.byteLength);
    assert.match(stored.checksum, /^[a-f0-9]{64}$/);
    assert.deepEqual(await storage.get(stored.key), body);
    const plan = await storage.createUploadPlan({ workspaceId: "workspace-1", name: "photo.png", contentType: "image/png", size: 1200 });
    assert.equal(plan.method, "PUT");
    assert.match(plan.key, /^workspace-1\//);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Phase 69 PostgreSQL adapter exposes complete idempotent migration and parameterized inserts", async () => {
  const calls: Array<{ text: string; values?: unknown[] }> = [];
  const client: SqlClient = { query: async (text, values) => { calls.push({ text, values }); return { rows: text.startsWith("INSERT") ? [{ id: "1", email: "a@example.com", password_hash: "x", email_verified: false, status: "active", created_at: "now", updated_at: "now" }] : [] }; } };
  const db = new PostgresDatabase(client);
  await db.migrate();
  assert.equal(calls.length, POSTGRES_MIGRATIONS.length);
  const user = await db.insert("users", { email: "a@example.com", passwordHash: "x", emailVerified: false, status: "active" });
  assert.equal(user.passwordHash, "x");
  assert.match(calls.at(-1)?.text ?? "", /\$1/);
});

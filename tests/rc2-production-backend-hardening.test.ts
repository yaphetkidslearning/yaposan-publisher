import test from "node:test";
import assert from "node:assert/strict";
import { constantTimeEqual, isConfiguredAdmin, requireProjectAccess, requireWorkspaceAccess } from "../server/authorization.ts";
import { InMemoryDatabase } from "../server/database.ts";
import { loadCloudConfig, validateProductionConfig } from "../server/config.ts";
import { R2ObjectStorage } from "../server/storage.ts";

async function seed() {
  const db = new InMemoryDatabase();
  await db.connect();
  await db.migrate();
  const owner = await db.insert("users", { email: "owner@example.com", passwordHash: "x", emailVerified: true, status: "active" });
  const viewer = await db.insert("users", { email: "viewer@example.com", passwordHash: "x", emailVerified: true, status: "active" });
  const outsider = await db.insert("users", { email: "outside@example.com", passwordHash: "x", emailVerified: true, status: "active" });
  const org = await db.insert("organizations", { name: "Org", ownerUserId: owner.id, plan: "free" });
  await db.insert("memberships", { organizationId: org.id, userId: owner.id, role: "owner" });
  await db.insert("memberships", { organizationId: org.id, userId: viewer.id, role: "viewer" });
  const workspace = await db.insert("workspaces", { organizationId: org.id, name: "Main", region: "us-east" });
  const project = await db.insert("projects", { workspaceId: workspace.id, ownerUserId: owner.id, name: "P", revision: 1, payload: {} });
  return { db, owner, viewer, outsider, workspace, project };
}

test("worker and administrator secrets use exact comparisons", () => {
  assert.equal(constantTimeEqual("secret", "secret"), true);
  assert.equal(constantTimeEqual("secret", "wrong"), false);
  assert.equal(isConfiguredAdmin("ADMIN@EXAMPLE.COM", ["admin@example.com"]), true);
});

test("workspace and project access enforce membership roles", async () => {
  const { db, owner, viewer, outsider, workspace, project } = await seed();
  await assert.doesNotReject(requireWorkspaceAccess(db, owner.id, workspace.id, true));
  await assert.doesNotReject(requireProjectAccess(db, viewer.id, project.id, false));
  await assert.rejects(requireProjectAccess(db, viewer.id, project.id, true), /PROJECT_ACCESS_DENIED/);
  await assert.rejects(requireWorkspaceAccess(db, outsider.id, workspace.id), /WORKSPACE_ACCESS_DENIED/);
});

test("production validation requires worker token and distributed collaboration", () => {
  const config = loadCloudConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgres://example",
    SESSION_SECRET: "a-long-production-secret",
    STORAGE_DRIVER: "r2",
    STORAGE_BUCKET: "assets",
    STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    STRIPE_SECRET_KEY: "stripe",
    STRIPE_WEBHOOK_SECRET: "webhook",
    OPENAI_API_KEY: "openai",
    ADMIN_EMAILS: "admin@example.com",
    EXPORT_WORKER_ENABLED: "true",
    COLLABORATION_DRIVER: "memory",
  } as NodeJS.ProcessEnv);
  const issues = validateProductionConfig(config, "production");
  assert.ok(issues.some(issue => issue.includes("EXPORT_WORKER_TOKEN")));
  assert.ok(issues.some(issue => issue.includes("COLLABORATION_DRIVER=redis")));
});

test("R2 upload plan is AWS SigV4 signed", async () => {
  const storage = new R2ObjectStorage({ endpoint: "https://account.r2.cloudflarestorage.com", bucket: "assets", accessKeyId: "access", secretAccessKey: "secret" });
  const plan = await storage.createUploadPlan({ workspaceId: "workspace", name: "design.pdf", contentType: "application/pdf", size: 100 });
  const url = new URL(plan.uploadUrl);
  assert.equal(plan.method, "PUT");
  assert.equal(url.searchParams.get("X-Amz-Algorithm"), "AWS4-HMAC-SHA256");
  assert.ok(url.searchParams.get("X-Amz-Signature"));
  assert.equal(plan.headers["content-type"], "application/pdf");
});

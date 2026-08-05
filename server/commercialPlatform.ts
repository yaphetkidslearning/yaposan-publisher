import { createHash, randomBytes } from "node:crypto";
import type { DatabaseAdapter, MembershipRecord, ProjectRecord } from "./database";

export type ProjectLifecycle = { archived?: boolean; favorite?: boolean; tags?: string[]; trashedAt?: string };
const lifecycleOf = (project: ProjectRecord): ProjectLifecycle => {
  const payload = project.payload && typeof project.payload === "object" ? project.payload as Record<string, unknown> : {};
  const meta = payload.__yaposanLifecycle;
  return meta && typeof meta === "object" ? meta as ProjectLifecycle : {};
};
export const withLifecycle = (project: ProjectRecord, patch: ProjectLifecycle) => {
  const payload = project.payload && typeof project.payload === "object" ? project.payload as Record<string, unknown> : {};
  return { ...payload, __yaposanLifecycle: { ...lifecycleOf(project), ...patch } };
};

export async function organizationContext(db: DatabaseAdapter, userId: string) {
  const membership = (await db.find("memberships", row => row.userId === userId))[0];
  if (!membership) throw new Error("NO_ORGANIZATION");
  const organization = await db.get("organizations", membership.organizationId);
  if (!organization) throw new Error("NO_ORGANIZATION");
  return { membership, organization };
}

export async function listOrganizationMembers(db: DatabaseAdapter, userId: string) {
  const { organization, membership } = await organizationContext(db, userId);
  const memberships = await db.find("memberships", row => row.organizationId === organization.id);
  const items = await Promise.all(memberships.map(async row => {
    const user = await db.get("users", row.userId);
    return { id: row.id, userId: row.userId, email: user?.email ?? "Unknown user", role: row.role, status: user?.status ?? "disabled", joinedAt: row.createdAt };
  }));
  return { organization, currentRole: membership.role, items };
}

export async function inviteExistingUser(db: DatabaseAdapter, actorUserId: string, input: { email: string; role?: MembershipRecord["role"] }) {
  const { organization, membership } = await organizationContext(db, actorUserId);
  if (!(["owner", "admin"] as string[]).includes(membership.role)) throw new Error("MEMBER_ADMIN_REQUIRED");
  const email = input.email.trim().toLowerCase();
  const user = (await db.find("users", row => row.email.toLowerCase() === email))[0];
  if (!user) throw new Error("INVITED_USER_MUST_REGISTER_FIRST");
  const existing = (await db.find("memberships", row => row.organizationId === organization.id && row.userId === user.id))[0];
  if (existing) return existing;
  const role = input.role && ["admin", "editor", "viewer"].includes(input.role) ? input.role : "editor";
  const created = await db.insert("memberships", { organizationId: organization.id, userId: user.id, role });
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId, action: "team.member.invited", target: user.id, metadata: { email, role } });
  return created;
}

export async function changeMemberRole(db: DatabaseAdapter, actorUserId: string, membershipId: string, role: MembershipRecord["role"]) {
  const { organization, membership } = await organizationContext(db, actorUserId);
  if (!(["owner", "admin"] as string[]).includes(membership.role)) throw new Error("MEMBER_ADMIN_REQUIRED");
  const target = await db.get("memberships", membershipId);
  if (!target || target.organizationId !== organization.id) throw new Error("MEMBER_NOT_FOUND");
  if (target.role === "owner") throw new Error("OWNER_ROLE_IMMUTABLE");
  if (!(["admin", "editor", "viewer"] as string[]).includes(role)) throw new Error("INVALID_MEMBER_ROLE");
  const updated = await db.update("memberships", membershipId, { role });
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId, action: "team.member.role_changed", target: target.userId, metadata: { role } });
  return updated;
}

export async function removeMember(db: DatabaseAdapter, actorUserId: string, membershipId: string) {
  const { organization, membership } = await organizationContext(db, actorUserId);
  if (!(["owner", "admin"] as string[]).includes(membership.role)) throw new Error("MEMBER_ADMIN_REQUIRED");
  const target = await db.get("memberships", membershipId);
  if (!target || target.organizationId !== organization.id) throw new Error("MEMBER_NOT_FOUND");
  if (target.role === "owner") throw new Error("OWNER_CANNOT_BE_REMOVED");
  await db.delete("memberships", target.id);
  await db.insert("auditEvents", { organizationId: organization.id, actorUserId, action: "team.member.removed", target: target.userId });
  return true;
}

export async function updateProjectLifecycle(db: DatabaseAdapter, userId: string, projectId: string, patch: ProjectLifecycle) {
  const project = await db.get("projects", projectId);
  if (!project || project.ownerUserId !== userId) throw new Error("PROJECT_NOT_FOUND");
  const nextPatch: Partial<ProjectRecord> = { payload: withLifecycle(project, patch) };
  if (patch.trashedAt !== undefined) nextPatch.deletedAt = patch.trashedAt || undefined;
  const updated = await db.update("projects", project.id, nextPatch);
  await db.insert("auditEvents", { actorUserId: userId, action: "project.lifecycle.updated", target: project.id, metadata: patch as Record<string, unknown> });
  return updated;
}

export async function restoreProjectVersion(db: DatabaseAdapter, userId: string, projectId: string, versionId: string) {
  const project = await db.get("projects", projectId);
  if (!project || project.ownerUserId !== userId) throw new Error("PROJECT_NOT_FOUND");
  const version = await db.get("versions", versionId);
  if (!version || version.projectId !== project.id) throw new Error("VERSION_NOT_FOUND");
  const revision = project.revision + 1;
  const updated = await db.update("projects", project.id, { payload: version.payload, revision });
  await db.insert("versions", { projectId, revision, payload: version.payload, actorUserId: userId });
  await db.insert("auditEvents", { actorUserId: userId, action: "project.version.restored", target: projectId, metadata: { versionId, revision } });
  return updated;
}

export async function createShareLink(db: DatabaseAdapter, userId: string, input: { projectId: string; access?: "view" | "download"; expiresAt?: string; password?: string }) {
  const project = await db.get("projects", input.projectId);
  if (!project || project.ownerUserId !== userId) throw new Error("PROJECT_NOT_FOUND");
  const rawToken = randomBytes(24).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const record = await db.insert("auditEvents", {
    actorUserId: userId, action: "share.link.created", target: project.id,
    metadata: { tokenHash, access: input.access ?? "view", expiresAt: input.expiresAt, passwordHash: input.password ? createHash("sha256").update(input.password).digest("hex") : undefined, revoked: false }
  });
  return { id: record.id, token: rawToken, access: input.access ?? "view", expiresAt: input.expiresAt };
}

export async function listNotifications(db: DatabaseAdapter, userId: string) {
  const { organization } = await organizationContext(db, userId);
  const events = await db.find("auditEvents", row => row.organizationId === organization.id || row.actorUserId === userId);
  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50).map(event => ({
    id: event.id, type: event.action, title: event.action.split(".").map(word => word[0]?.toUpperCase() + word.slice(1)).join(" "), createdAt: event.createdAt, metadata: event.metadata ?? {}, target: event.target
  }));
}

export async function adminSummary(db: DatabaseAdapter, userId: string, adminEmails: string[] = []) {
  const user = await db.get("users", userId);
  const { organization, membership } = await organizationContext(db, userId);
  const globalAdmin = Boolean(user && adminEmails.map(x => x.toLowerCase()).includes(user.email.toLowerCase()));
  if (!globalAdmin && !(["owner", "admin"] as string[]).includes(membership.role)) throw new Error("ADMIN_REQUIRED");
  const [users, organizations, projects, assets, subscriptions, jobs, events] = await Promise.all([
    db.find("users", () => true), db.find("organizations", () => true), db.find("projects", () => true), db.find("assets", () => true), db.find("subscriptions", () => true), db.find("jobs", () => true), db.find("auditEvents", () => true)
  ]);
  const scopedProjects = globalAdmin ? projects : projects.filter(project => project.workspaceId && project.ownerUserId && project.deletedAt === undefined);
  return {
    scope: globalAdmin ? "global" : organization.name,
    totals: { users: globalAdmin ? users.length : (await db.find("memberships", row => row.organizationId === organization.id)).length, organizations: globalAdmin ? organizations.length : 1, projects: scopedProjects.filter(p => !p.deletedAt).length, trashedProjects: scopedProjects.filter(p => Boolean(p.deletedAt)).length, storageBytes: assets.reduce((sum, asset) => sum + Number(asset.size || 0), 0), activeSubscriptions: subscriptions.filter(sub => ["active", "trialing"].includes(sub.status)).length, queuedJobs: jobs.filter(job => ["queued", "running"].includes(job.status)).length },
    recentActivity: events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20)
  };
}

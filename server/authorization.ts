import { timingSafeEqual } from "node:crypto";
import type { DatabaseAdapter, MembershipRecord, ProjectRecord, WorkspaceRecord } from "./database";
import { canAccessSpace } from "./spaces";

export function constantTimeEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isConfiguredAdmin(email: string | undefined, configuredAdminEmails: readonly string[]) {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;
  return configuredAdminEmails.some(configuredEmail => configuredEmail.trim().toLowerCase() === normalizedEmail);
}


export async function getUserMemberships(db: DatabaseAdapter, userId: string) {
  return db.find("memberships", membership => membership.userId === userId);
}

export async function canAccessWorkspace(db: DatabaseAdapter, userId: string, workspaceId: string, write = false) {
  const workspace = await db.get("workspaces", workspaceId);
  if (!workspace) return false;
  const memberships = await getUserMemberships(db, userId);
  return memberships.some(membership => membership.organizationId === workspace.organizationId && (!write || membership.role !== "viewer"));
}

export async function canAccessProject(db: DatabaseAdapter, userId: string, projectId: string, write = false) {
  const project = await db.get("projects", projectId);
  if (!project || project.deletedAt) return false;
  if (project.ownerUserId === userId) return true;
  if (project.spaceId && await canAccessSpace(db, userId, project.spaceId, write ? "editor" : "viewer")) return true;
  return canAccessWorkspace(db, userId, project.workspaceId, write);
}

export async function requireProjectAccess(db: DatabaseAdapter, userId: string, projectId: string, write = false): Promise<ProjectRecord> {
  const project = await db.get("projects", projectId);
  if (!project || project.deletedAt || !(await canAccessProject(db, userId, projectId, write))) throw new Error("PROJECT_ACCESS_DENIED");
  return project;
}

export async function requireWorkspaceAccess(db: DatabaseAdapter, userId: string, workspaceId: string, write = false): Promise<WorkspaceRecord> {
  const workspace = await db.get("workspaces", workspaceId);
  if (!workspace || !(await canAccessWorkspace(db, userId, workspaceId, write))) throw new Error("WORKSPACE_ACCESS_DENIED");
  return workspace;
}

export async function resolveOrganizationRole(db: DatabaseAdapter, userId: string, organizationId: string): Promise<MembershipRecord["role"] | undefined> {
  const membership = (await db.find("memberships", item => item.userId === userId && item.organizationId === organizationId))[0];
  return membership?.role;
}

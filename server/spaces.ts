import type { DatabaseAdapter, SpaceKind, SpaceRecord, SpaceRole, SpaceVisibility } from "./database";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "space";
const ROLE_CAPABILITIES: Record<SpaceRole, Set<SpaceRole>> = {
  owner: new Set(["owner","admin","editor","store_manager","viewer"]),
  admin: new Set(["admin","editor","store_manager","viewer"]),
  editor: new Set(["editor","viewer"]),
  store_manager: new Set(["store_manager","viewer"]),
  viewer: new Set(["viewer"]),
};

export async function listUserSpaces(db: DatabaseAdapter, userId: string) {
  const memberships = await db.find("spaceMemberships", row => row.userId === userId);
  const ids = new Set(memberships.map(row => row.spaceId));
  return db.find("spaces", row => ids.has(row.id) && row.status === "active");
}

async function uniqueSlug(db: DatabaseAdapter, requested: string) {
  const base = slugify(requested);
  let candidate = base;
  for (let n = 2; (await db.find("spaces", row => row.slug === candidate)).length; n += 1) candidate = `${base}-${n}`;
  return candidate;
}

export async function createSpace(db: DatabaseAdapter, input: { userId: string; organizationId: string; name: string; slug?: string; kind?: SpaceKind; visibility?: SpaceVisibility }) {
  const orgMembership = (await db.find("memberships", row => row.userId === input.userId && row.organizationId === input.organizationId))[0];
  if (!orgMembership) throw new Error("SPACE_ORGANIZATION_ACCESS_DENIED");
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) throw new Error("SPACE_NAME_REQUIRED");
  return db.transaction(async tx => {
    const space = await tx.insert("spaces", {
      organizationId: input.organizationId,
      ownerUserId: input.userId,
      name,
      slug: await uniqueSlug(tx, input.slug || name),
      kind: input.kind ?? "personal",
      visibility: input.visibility === "team" ? "team" : "private",
      status: "active",
    });
    await tx.insert("spaceMemberships", { spaceId: space.id, userId: input.userId, role: "owner" });
    await tx.insert("spacePrivacySettings", { spaceId: space.id, publicPageEnabled: false, discoverable: false, showFollowerCount: false, profileAudience: "private", dmAudience: "followers", defaultPostVisibility: "private", externalSharingEnabled: false });
    await tx.insert("auditEvents", { organizationId: input.organizationId, actorUserId: input.userId, action: "space.created", target: space.id, metadata: { slug: space.slug, kind: space.kind } });
    return space;
  });
}

export async function resolveSpaceRole(db: DatabaseAdapter, userId: string, spaceId: string): Promise<SpaceRole | undefined> {
  const membership = (await db.find("spaceMemberships", row => row.spaceId === spaceId && row.userId === userId))[0];
  return membership?.role;
}

export async function canAccessSpace(db: DatabaseAdapter, userId: string, spaceId: string, required: SpaceRole = "viewer") {
  const space = await db.get("spaces", spaceId);
  if (!space || space.status !== "active") return false;
  if (space.ownerUserId === userId) return true;
  const role = await resolveSpaceRole(db, userId, spaceId);
  return Boolean(role && ROLE_CAPABILITIES[role].has(required));
}

export async function requireSpaceAccess(db: DatabaseAdapter, userId: string, spaceId: string, required: SpaceRole = "viewer"): Promise<SpaceRecord> {
  const space = await db.get("spaces", spaceId);
  if (!space || !(await canAccessSpace(db, userId, spaceId, required))) throw new Error("SPACE_ACCESS_DENIED");
  return space;
}

export async function updateSpace(db: DatabaseAdapter, userId: string, spaceId: string, patch: { name?: string; visibility?: SpaceVisibility; status?: "active"|"archived" }) {
  const space = await requireSpaceAccess(db, userId, spaceId, "admin");
  const next = await db.update("spaces", spaceId, {
    name: patch.name?.trim().slice(0, 80) || undefined,
    visibility: patch.visibility === "team" ? "team" : patch.visibility === "private" ? "private" : undefined,
    status: patch.status,
  });
  await db.insert("auditEvents", { organizationId: space.organizationId, actorUserId: userId, action: "space.updated", target: space.id, metadata: patch });
  return next;
}

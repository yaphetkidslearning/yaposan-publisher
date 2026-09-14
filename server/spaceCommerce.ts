import type { DatabaseAdapter, SpaceRole, SpaceStoreProductKind } from "./database";
import { canAccessSpace, requireSpaceAccess, resolveSpaceRole } from "./spaces";

const MEMBER_ROLES: Exclude<SpaceRole,"owner">[]=["admin","editor","store_manager","viewer"];
const PRODUCT_KINDS: SpaceStoreProductKind[]=["ai","studio","template","workflow","digital_product","service"];
const publicMember=(user:{id:string;email:string},membership:{id:string;userId:string;role:SpaceRole})=>({id:membership.id,userId:user.id,email:user.email,role:membership.role});

export async function getSpaceTeam(db:DatabaseAdapter,userId:string,spaceId:string){
  await requireSpaceAccess(db,userId,spaceId,"viewer");
  const memberships=await db.find("spaceMemberships",m=>m.spaceId===spaceId);
  const members=[] as {id:string;userId:string;email:string;role:SpaceRole}[];
  for(const m of memberships){const u=await db.get("users",m.userId);if(u)members.push(publicMember(u,m));}
  const canAdmin=await canAccessSpace(db,userId,spaceId,"admin");
  const invites=canAdmin?await db.find("spaceInvites",i=>i.spaceId===spaceId&&i.status==="pending"):[];
  return {members:members.sort((a,b)=>a.role==="owner"?-1:b.role==="owner"?1:a.email.localeCompare(b.email)),invites};
}
export async function inviteSpaceMember(db:DatabaseAdapter,userId:string,spaceId:string,emailInput:string,roleInput:string){
  const space=await requireSpaceAccess(db,userId,spaceId,"admin");
  const email=emailInput.trim().toLowerCase(); if(!email.includes("@"))throw new Error("TEAM_EMAIL_REQUIRED");
  const role=(MEMBER_ROLES.includes(roleInput as any)?roleInput:"viewer") as Exclude<SpaceRole,"owner">;
  const existingUser=(await db.find("users",u=>u.email.toLowerCase()===email))[0];
  if(existingUser){
    const existing=(await db.find("spaceMemberships",m=>m.spaceId===spaceId&&m.userId===existingUser.id))[0];
    if(existing){if(existing.role==="owner")return {member:publicMember(existingUser,existing),accepted:true};const updated=await db.update("spaceMemberships",existing.id,{role});return {member:publicMember(existingUser,updated),accepted:true};}
    const membership=await db.insert("spaceMemberships",{spaceId,userId:existingUser.id,role});
    await db.insert("auditEvents",{organizationId:space.organizationId,actorUserId:userId,action:"space.member.added",target:existingUser.id,metadata:{spaceId,role}});
    return {member:publicMember(existingUser,membership),accepted:true};
  }
  const prior=(await db.find("spaceInvites",i=>i.spaceId===spaceId&&i.email.toLowerCase()===email&&i.status==="pending"))[0];
  const invite=prior?await db.update("spaceInvites",prior.id,{role}):await db.insert("spaceInvites",{spaceId,email,role,invitedByUserId:userId,status:"pending"});
  await db.insert("auditEvents",{organizationId:space.organizationId,actorUserId:userId,action:"space.invite.created",target:invite.id,metadata:{spaceId,email,role}});
  return {invite,accepted:false};
}
export async function updateSpaceMemberRole(db:DatabaseAdapter,userId:string,spaceId:string,membershipId:string,roleInput:string){
  const space=await requireSpaceAccess(db,userId,spaceId,"admin"); const actorRole=await resolveSpaceRole(db,userId,spaceId);
  const membership=await db.get("spaceMemberships",membershipId); if(!membership||membership.spaceId!==spaceId)throw new Error("TEAM_MEMBER_NOT_FOUND");
  if(membership.role==="owner")throw new Error("TEAM_OWNER_ROLE_LOCKED");
  if(membership.role==="admin" && actorRole!=="owner" && space.ownerUserId!==userId)throw new Error("TEAM_OWNER_REQUIRED_FOR_ADMIN");
  const role=(MEMBER_ROLES.includes(roleInput as any)?roleInput:null) as Exclude<SpaceRole,"owner">|null; if(!role)throw new Error("TEAM_ROLE_INVALID");
  if(role==="admin" && actorRole!=="owner" && space.ownerUserId!==userId)throw new Error("TEAM_OWNER_REQUIRED_FOR_ADMIN");
  const updated=await db.update("spaceMemberships",membershipId,{role});
  await db.insert("auditEvents",{organizationId:space.organizationId,actorUserId:userId,action:"space.member.role_changed",target:membership.userId,metadata:{spaceId,role}}); return updated;
}
export async function removeSpaceMember(db:DatabaseAdapter,userId:string,spaceId:string,membershipId:string){
  const space=await requireSpaceAccess(db,userId,spaceId,"admin"); const membership=await db.get("spaceMemberships",membershipId); if(!membership||membership.spaceId!==spaceId)throw new Error("TEAM_MEMBER_NOT_FOUND"); if(membership.role==="owner")throw new Error("TEAM_OWNER_CANNOT_REMOVE");
  const actorRole=await resolveSpaceRole(db,userId,spaceId); if(membership.role==="admin" && actorRole!=="owner" && space.ownerUserId!==userId)throw new Error("TEAM_OWNER_REQUIRED_FOR_ADMIN");
  await db.delete("spaceMemberships",membershipId); await db.insert("auditEvents",{organizationId:space.organizationId,actorUserId:userId,action:"space.member.removed",target:membership.userId,metadata:{spaceId}}); return {removed:true};
}
export async function listMySpaceInvites(db:DatabaseAdapter,userId:string){const user=await db.get("users",userId);if(!user)return [];return (await db.find("spaceInvites",i=>i.email.toLowerCase()===user.email.toLowerCase()&&i.status==="pending")).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
export async function acceptSpaceInvite(db:DatabaseAdapter,userId:string,inviteId:string){const user=await db.get("users",userId);if(!user)throw new Error("TEAM_USER_NOT_FOUND");const invite=await db.get("spaceInvites",inviteId);if(!invite||invite.status!=="pending"||invite.email.toLowerCase()!==user.email.toLowerCase())throw new Error("TEAM_INVITE_NOT_FOUND");const existing=(await db.find("spaceMemberships",m=>m.spaceId===invite.spaceId&&m.userId===userId))[0];const membership=existing?await db.update("spaceMemberships",existing.id,{role:invite.role}):await db.insert("spaceMemberships",{spaceId:invite.spaceId,userId,role:invite.role});await db.update("spaceInvites",invite.id,{status:"accepted"});return membership;}
export async function revokeSpaceInvite(db:DatabaseAdapter,userId:string,spaceId:string,inviteId:string){await requireSpaceAccess(db,userId,spaceId,"admin");const invite=await db.get("spaceInvites",inviteId);if(!invite||invite.spaceId!==spaceId)throw new Error("TEAM_INVITE_NOT_FOUND");return db.update("spaceInvites",inviteId,{status:"revoked"});}

export async function getSpaceStore(db:DatabaseAdapter,userId:string,spaceId:string){
  await requireSpaceAccess(db,userId,spaceId,"store_manager"); const products=(await db.find("spaceStoreProducts",p=>p.spaceId===spaceId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const orders=(await db.find("spaceStoreOrders",o=>o.spaceId===spaceId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); const paid=orders.filter(o=>o.status==="paid");
  return {products,orders,metrics:{products:products.length,active:products.filter(p=>p.status==="active").length,orders:orders.length,grossCents:paid.reduce((s,o)=>s+o.grossCents,0),creatorNetCents:paid.reduce((s,o)=>s+o.creatorNetCents,0)}};
}
export async function createStoreProduct(db:DatabaseAdapter,userId:string,spaceId:string,b:any){
  await requireSpaceAccess(db,userId,spaceId,"store_manager"); const kind=PRODUCT_KINDS.includes(b.kind)?b.kind:"digital_product"; const name=String(b.name||"").trim().slice(0,140); if(!name)throw new Error("STORE_PRODUCT_NAME_REQUIRED");
  const priceCents=Math.max(0,Math.min(10000000,Math.round(Number(b.priceCents||0)))); const visibility=b.visibility==="public"?"public":"private"; const status=["draft","active","archived"].includes(b.status)?b.status:"draft";
  return db.insert("spaceStoreProducts",{spaceId,ownerUserId:userId,kind,name,description:b.description?String(b.description).slice(0,3000):undefined,priceCents,currency:"USD",visibility,marketplaceListed:false,status,resourceId:b.resourceId?String(b.resourceId).slice(0,200):undefined});
}
export async function updateStoreProduct(db:DatabaseAdapter,userId:string,spaceId:string,productId:string,b:any){
  await requireSpaceAccess(db,userId,spaceId,"store_manager"); const p=await db.get("spaceStoreProducts",productId); if(!p||p.spaceId!==spaceId)throw new Error("STORE_PRODUCT_NOT_FOUND");
  const visibility=b.visibility==="public"?"public":b.visibility==="private"?"private":p.visibility;
  const status=["draft","active","archived"].includes(b.status)?b.status:p.status;
  let marketplaceListed=typeof b.marketplaceListed==="boolean"?b.marketplaceListed:Boolean(p.marketplaceListed);
  if(visibility!=="public"||status!=="active") marketplaceListed=false;
  if(b.marketplaceListed===true&&(visibility!=="public"||status!=="active")) throw new Error("MARKETPLACE_LISTING_REQUIRES_PUBLIC_ACTIVE_PRODUCT");
  return db.update("spaceStoreProducts",productId,{name:b.name===undefined?p.name:String(b.name).trim().slice(0,140)||p.name,description:b.description===undefined?p.description:String(b.description).slice(0,3000),priceCents:b.priceCents===undefined?p.priceCents:Math.max(0,Math.min(10000000,Math.round(Number(b.priceCents)))),visibility,marketplaceListed,status});
}
export async function createStoreOrder(db:DatabaseAdapter,userId:string,spaceId:string,productId:string){
  const product=await db.get("spaceStoreProducts",productId); if(!product||product.spaceId!==spaceId||product.status!=="active"||product.visibility!=="public")throw new Error("STORE_PRODUCT_NOT_AVAILABLE"); if(product.ownerUserId===userId)throw new Error("STORE_SELF_PURCHASE_NOT_ALLOWED");
  const platformFeeCents=Math.floor(product.priceCents*0.10), creatorNetCents=product.priceCents-platformFeeCents;
  return db.insert("spaceStoreOrders",{spaceId,productId,buyerUserId:userId,sellerUserId:product.ownerUserId,quantity:1,grossCents:product.priceCents,platformFeeCents,creatorNetCents,currency:product.currency,status:"pending"});
}

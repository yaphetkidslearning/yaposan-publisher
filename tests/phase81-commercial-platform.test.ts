import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryDatabase } from "../server/database";
import { changeMemberRole, createShareLink, inviteExistingUser, listNotifications, listOrganizationMembers, restoreProjectVersion, updateProjectLifecycle } from "../server/commercialPlatform";
import { provisionAccount } from "../server/identity";

test("Phase 81 team roles, project lifecycle, share links and notifications work", async()=>{
 const db=new InMemoryDatabase();await db.connect();await db.migrate();
 const owner=await provisionAccount(db,{email:"owner@example.com",password:"StrongPass123!"});
 const member=await provisionAccount(db,{email:"member@example.com",password:"StrongPass123!"});
 const joined=await inviteExistingUser(db,owner.user.id,{email:member.user.email,role:"editor"});
 assert.equal(joined.role,"editor");
 const changed=await changeMemberRole(db,owner.user.id,joined.id,"viewer");assert.equal(changed.role,"viewer");
 const roster=await listOrganizationMembers(db,owner.user.id);assert.equal(roster.items.length,2);
 const project=await db.insert("projects",{workspaceId:owner.workspace.id,ownerUserId:owner.user.id,name:"Campaign",revision:1,payload:{pages:[]}});
 const version=await db.insert("versions",{projectId:project.id,revision:1,payload:project.payload,actorUserId:owner.user.id});
 const archived=await updateProjectLifecycle(db,owner.user.id,project.id,{archived:true,favorite:true,tags:["marketing"]});
 assert.equal((archived.payload as any).__yaposanLifecycle.favorite,true);
 const restored=await restoreProjectVersion(db,owner.user.id,project.id,version.id);assert.equal(restored.revision,2);
 const share=await createShareLink(db,owner.user.id,{projectId:project.id,access:"view"});assert.ok(share.token.length>20);
 const notices=await listNotifications(db,owner.user.id);assert.ok(notices.length>=4);
});

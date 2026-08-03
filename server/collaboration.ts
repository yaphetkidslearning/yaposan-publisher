import { randomUUID } from "node:crypto";
import type { DatabaseAdapter } from "./database";
import { createRedisCommandClient } from "./redisClient.ts";

export type PresenceState={userId:string;projectId:string;sessionId:string;displayName:string;color:string;cursor?:{x:number;y:number};selectionIds:string[];lastSeenAt:string};
export type CollaborationOperation={id:string;projectId:string;actorUserId:string;baseRevision:number;kind:"patch"|"replace"|"checkpoint";payload:unknown;createdAt:string};
export type CommentRecord={id:string;projectId:string;authorUserId:string;body:string;mentions:string[];resolved:boolean;parentId?:string;createdAt:string;updatedAt:string};
export type ApprovalRecord={id:string;projectId:string;reviewerUserId:string;status:"requested"|"approved"|"changes_requested";note?:string;updatedAt:string};

type CollaborationState={presence:PresenceState[];operations:CollaborationOperation[];comments:CommentRecord[];approvals:ApprovalRecord[]};
export interface CollaborationStore {
 getProjectState(projectId:string):Promise<CollaborationState>;
 setProjectState(projectId:string,state:CollaborationState):Promise<void>;
 getSession(sessionId:string):Promise<PresenceState|undefined>;
 setSession(session:PresenceState,ttlSeconds:number):Promise<void>;
 deleteSession(sessionId:string):Promise<boolean>;
}
const emptyState=():CollaborationState=>({presence:[],operations:[],comments:[],approvals:[]});

export class MemoryCollaborationStore implements CollaborationStore {
 private projects=new Map<string,CollaborationState>(); private sessions=new Map<string,PresenceState>();
 async getProjectState(projectId:string){return structuredClone(this.projects.get(projectId)??emptyState())}
 async setProjectState(projectId:string,state:CollaborationState){this.projects.set(projectId,structuredClone(state))}
 async getSession(sessionId:string){const value=this.sessions.get(sessionId);return value?structuredClone(value):undefined}
 async setSession(session:PresenceState){this.sessions.set(session.sessionId,structuredClone(session));const state=await this.getProjectState(session.projectId);state.presence=state.presence.filter(x=>x.sessionId!==session.sessionId);state.presence.push(session);await this.setProjectState(session.projectId,state)}
 async deleteSession(sessionId:string){const current=this.sessions.get(sessionId);if(!current)return false;this.sessions.delete(sessionId);const state=await this.getProjectState(current.projectId);state.presence=state.presence.filter(x=>x.sessionId!==sessionId);await this.setProjectState(current.projectId,state);return true}
}

type RedisClientLike={connect?():Promise<unknown>;get(key:string):Promise<string|null>;set(key:string,value:string,options?:{EX?:number}):Promise<unknown>;del(key:string):Promise<number>};
export class RedisCollaborationStore implements CollaborationStore {
 private client:RedisClientLike; private prefix:string;
 constructor(client:RedisClientLike,prefix="yaposan:collaboration"){this.client=client;this.prefix=prefix}
 private projectKey(id:string){return `${this.prefix}:project:${id}`}; private sessionKey(id:string){return `${this.prefix}:session:${id}`}
 async getProjectState(projectId:string){const raw=await this.client.get(this.projectKey(projectId));if(!raw)return emptyState();try{return JSON.parse(raw) as CollaborationState}catch{throw new Error("COLLABORATION_STATE_CORRUPT")}}
 async setProjectState(projectId:string,state:CollaborationState){await this.client.set(this.projectKey(projectId),JSON.stringify(state))}
 async getSession(sessionId:string){const raw=await this.client.get(this.sessionKey(sessionId));return raw?JSON.parse(raw) as PresenceState:undefined}
 async setSession(session:PresenceState,ttlSeconds:number){await this.client.set(this.sessionKey(session.sessionId),JSON.stringify(session),{EX:ttlSeconds});const state=await this.getProjectState(session.projectId);state.presence=state.presence.filter(x=>x.sessionId!==session.sessionId);state.presence.push(session);await this.setProjectState(session.projectId,state)}
 async deleteSession(sessionId:string){const current=await this.getSession(sessionId);if(!current)return false;await this.client.del(this.sessionKey(sessionId));const state=await this.getProjectState(current.projectId);state.presence=state.presence.filter(x=>x.sessionId!==sessionId);await this.setProjectState(current.projectId,state);return true}
}

let store:CollaborationStore=new MemoryCollaborationStore();
export function setCollaborationStore(next:CollaborationStore){store=next}
export async function configureCollaborationStore(input:{driver:"memory"|"redis";redisUrl?:string}){
 if(input.driver==="memory"){store=new MemoryCollaborationStore();return store}
 if(!input.redisUrl)throw new Error("REDIS_URL_REQUIRED");
 const client=createRedisCommandClient(input.redisUrl);store=new RedisCollaborationStore(client);return store;
}

export async function joinCollaboration(input:Omit<PresenceState,"sessionId"|"lastSeenAt">){const state:PresenceState={...input,sessionId:randomUUID(),lastSeenAt:new Date().toISOString()};await store.setSession(state,90);return state}
export async function updatePresence(sessionId:string,userId:string,patch:Partial<Pick<PresenceState,"cursor"|"selectionIds"|"displayName">>){const current=await store.getSession(sessionId);if(!current)throw new Error("COLLABORATION_SESSION_NOT_FOUND");if(current.userId!==userId)throw new Error("COLLABORATION_SESSION_FORBIDDEN");const next={...current,...patch,lastSeenAt:new Date().toISOString()};await store.setSession(next,90);return next}
export async function leaveCollaboration(sessionId:string,userId:string){const current=await store.getSession(sessionId);if(!current)return false;if(current.userId!==userId)throw new Error("COLLABORATION_SESSION_FORBIDDEN");return store.deleteSession(sessionId)}
export async function listPresence(projectId:string,ttlMs=45_000){const state=await store.getProjectState(projectId);const cutoff=Date.now()-ttlMs;const active=state.presence.filter(x=>Date.parse(x.lastSeenAt)>=cutoff);if(active.length!==state.presence.length){state.presence=active;await store.setProjectState(projectId,state)}return active}

export async function applyCollaborationOperation(db:DatabaseAdapter,input:{projectId:string;actorUserId:string;baseRevision:number;kind:"patch"|"replace"|"checkpoint";payload:unknown}){
 return db.transaction(async tx=>{const project=await tx.get("projects",input.projectId);if(!project)throw new Error("PROJECT_NOT_FOUND");if(project.revision!==input.baseRevision)throw new Error("REVISION_CONFLICT");const nextPayload=input.kind==="patch"&&typeof project.payload==="object"&&project.payload&&typeof input.payload==="object"&&input.payload?{...(project.payload as Record<string,unknown>),...(input.payload as Record<string,unknown>)}:input.payload;const updated=await tx.update("projects",project.id,{payload:nextPayload,revision:project.revision+1});await tx.insert("versions",{projectId:project.id,revision:updated.revision,payload:updated.payload,actorUserId:input.actorUserId});const op:CollaborationOperation={id:randomUUID(),...input,createdAt:new Date().toISOString()};const state=await store.getProjectState(project.id);state.operations.push(op);state.operations=state.operations.slice(-500);await store.setProjectState(project.id,state);return {project:updated,operation:op}})
}
export async function listOperations(projectId:string,afterRevision=0){return (await store.getProjectState(projectId)).operations.filter(x=>x.baseRevision>=afterRevision)}
export async function createComment(input:{projectId:string;authorUserId:string;body:string;mentions?:string[];parentId?:string}){const now=new Date().toISOString();const record:CommentRecord={id:randomUUID(),projectId:input.projectId,authorUserId:input.authorUserId,body:input.body.trim(),mentions:[...new Set(input.mentions??[])],resolved:false,parentId:input.parentId,createdAt:now,updatedAt:now};if(!record.body)throw new Error("COMMENT_BODY_REQUIRED");const state=await store.getProjectState(input.projectId);state.comments.push(record);await store.setProjectState(input.projectId,state);return record}
export async function resolveComment(projectId:string,commentId:string,resolved=true){const state=await store.getProjectState(projectId);const index=state.comments.findIndex(x=>x.id===commentId);if(index<0)throw new Error("COMMENT_NOT_FOUND");state.comments[index]={...state.comments[index],resolved,updatedAt:new Date().toISOString()};await store.setProjectState(projectId,state);return state.comments[index]}
export async function listComments(projectId:string){return (await store.getProjectState(projectId)).comments}
export async function setApproval(input:{projectId:string;reviewerUserId:string;status:ApprovalRecord["status"];note?:string}){const state=await store.getProjectState(input.projectId);const found=state.approvals.findIndex(x=>x.reviewerUserId===input.reviewerUserId);const record:ApprovalRecord={id:found>=0?state.approvals[found].id:randomUUID(),...input,updatedAt:new Date().toISOString()};if(found>=0)state.approvals[found]=record;else state.approvals.push(record);await store.setProjectState(input.projectId,state);return record}
export async function listApprovals(projectId:string){return (await store.getProjectState(projectId)).approvals}

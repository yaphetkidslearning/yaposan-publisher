import { randomUUID } from "node:crypto";

export type EntityName = "users"|"organizations"|"memberships"|"workspaces"|"projects"|"assets"|"versions"|"subscriptions"|"auditEvents"|"jobs";
export type RecordBase = { id:string; createdAt:string; updatedAt:string };
export type UserRecord = RecordBase & { email:string; passwordHash:string; emailVerified:boolean; mfaSecret?:string; status:"active"|"disabled" };
export type OrganizationRecord = RecordBase & { name:string; ownerUserId:string; plan:"free"|"creator"|"pro"|"business" };
export type MembershipRecord = RecordBase & { organizationId:string; userId:string; role:"owner"|"admin"|"editor"|"viewer" };
export type WorkspaceRecord = RecordBase & { organizationId:string; name:string; region:string };
export type ProjectRecord = RecordBase & { workspaceId:string; ownerUserId:string; name:string; revision:number; payload:unknown; deletedAt?:string };
export type AssetRecord = RecordBase & { workspaceId:string; ownerUserId:string; name:string; mimeType:string; size:number; storageKey:string; checksum?:string };
export type VersionRecord = RecordBase & { projectId:string; revision:number; payload:unknown; actorUserId:string };
export type SubscriptionRecord = RecordBase & { organizationId:string; providerCustomerId?:string; providerSubscriptionId?:string; plan:string; status:string; seats:number };
export type AuditEventRecord = RecordBase & { organizationId?:string; actorUserId?:string; action:string; target?:string; requestId?:string; metadata?:Record<string,unknown> };
export type JobRecord = RecordBase & { kind:"export"|"ai"|"image"|"video"|"notification"; status:"queued"|"running"|"succeeded"|"failed"|"cancelled"; progress:number; attempts:number; payload:unknown; result?:unknown; error?:string; workerId?:string; leaseExpiresAt?:string; heartbeatAt?:string };
export type DatabaseSchema = {
 users:UserRecord; organizations:OrganizationRecord; memberships:MembershipRecord; workspaces:WorkspaceRecord; projects:ProjectRecord; assets:AssetRecord; versions:VersionRecord; subscriptions:SubscriptionRecord; auditEvents:AuditEventRecord; jobs:JobRecord;
};

export interface DatabaseAdapter {
 connect():Promise<void>; close():Promise<void>; migrate():Promise<number>;
 insert<K extends EntityName>(table:K, value:Omit<DatabaseSchema[K], keyof RecordBase> & Partial<RecordBase>):Promise<DatabaseSchema[K]>;
 get<K extends EntityName>(table:K,id:string):Promise<DatabaseSchema[K]|undefined>;
 find<K extends EntityName>(table:K,predicate:(row:DatabaseSchema[K])=>boolean):Promise<DatabaseSchema[K][]>;
 update<K extends EntityName>(table:K,id:string,patch:Partial<DatabaseSchema[K]>):Promise<DatabaseSchema[K]>;
 delete<K extends EntityName>(table:K,id:string):Promise<boolean>;
 transaction<T>(fn:(db:DatabaseAdapter)=>Promise<T>):Promise<T>;
 claimNextJob?(kind:JobRecord["kind"],workerId:string,leaseSeconds:number):Promise<JobRecord|undefined>;
 recoverStaleJobs?(kind:JobRecord["kind"],now?:Date):Promise<number>;
}

export class InMemoryDatabase implements DatabaseAdapter {
 private connected=false;
 private tables:{[K in EntityName]:Map<string,DatabaseSchema[K]>} = {
  users:new Map(),organizations:new Map(),memberships:new Map(),workspaces:new Map(),projects:new Map(),assets:new Map(),versions:new Map(),subscriptions:new Map(),auditEvents:new Map(),jobs:new Map()
 };
 async connect(){this.connected=true}
 async close(){this.connected=false}
 async migrate(){this.assertConnected();return MIGRATIONS.length}
 private assertConnected(){if(!this.connected) throw new Error("DATABASE_NOT_CONNECTED")}
 async insert<K extends EntityName>(table:K,value:Omit<DatabaseSchema[K],keyof RecordBase>&Partial<RecordBase>){this.assertConnected();const now=new Date().toISOString();const row={...value,id:value.id??randomUUID(),createdAt:value.createdAt??now,updatedAt:now} as DatabaseSchema[K];(this.tables[table] as Map<string,DatabaseSchema[K]>).set(row.id,row);return structuredClone(row)}
 async get<K extends EntityName>(table:K,id:string){this.assertConnected();const row=(this.tables[table] as Map<string,DatabaseSchema[K]>).get(id);return row?structuredClone(row):undefined}
 async find<K extends EntityName>(table:K,predicate:(row:DatabaseSchema[K])=>boolean){this.assertConnected();return [...(this.tables[table] as Map<string,DatabaseSchema[K]>).values()].filter(predicate).map(x=>structuredClone(x))}
 async update<K extends EntityName>(table:K,id:string,patch:Partial<DatabaseSchema[K]>){this.assertConnected();const map=this.tables[table] as Map<string,DatabaseSchema[K]>;const current=map.get(id);if(!current)throw new Error("RECORD_NOT_FOUND");const next={...current,...patch,id,updatedAt:new Date().toISOString()} as DatabaseSchema[K];map.set(id,next);return structuredClone(next)}
 async delete<K extends EntityName>(table:K,id:string){this.assertConnected();return (this.tables[table] as Map<string,DatabaseSchema[K]>).delete(id)}

 async claimNextJob(kind:JobRecord["kind"],workerId:string,leaseSeconds:number){const candidates=[...this.tables.jobs.values()].filter(j=>j.kind===kind&&j.status==="queued").sort((a,b)=>a.createdAt.localeCompare(b.createdAt));const job=candidates[0];if(!job)return undefined;return this.update("jobs",job.id,{status:"running",attempts:job.attempts+1,progress:1,workerId,heartbeatAt:new Date().toISOString(),leaseExpiresAt:new Date(Date.now()+leaseSeconds*1000).toISOString()})}
 async recoverStaleJobs(kind:JobRecord["kind"],now=new Date()){let count=0;for(const job of this.tables.jobs.values()){if(job.kind===kind&&job.status==="running"&&job.leaseExpiresAt&&Date.parse(job.leaseExpiresAt)<=now.getTime()){await this.update("jobs",job.id,{status:"queued",progress:0,workerId:undefined,heartbeatAt:undefined,leaseExpiresAt:undefined,error:"Recovered after worker lease expired"});count++}}return count}
 async transaction<T>(fn:(db:DatabaseAdapter)=>Promise<T>):Promise<T>{this.assertConnected();const snapshots=structuredClone(this.tables);try{return await fn(this)}catch(error){this.tables=snapshots;throw error}}
}

export const MIGRATIONS=[
 {id:1,name:"identity-organizations-workspaces"},{id:2,name:"projects-assets-version-history"},{id:3,name:"subscriptions-audit-jobs"}
] as const;

let singleton:DatabaseAdapter|undefined;
export async function getDatabase(){
 if(!singleton){
  if(process.env.DATABASE_URL){
   const {createPostgresDatabase}=await import("./postgresDatabase");
   singleton=await createPostgresDatabase(process.env.DATABASE_URL);
  }else{
   singleton=new InMemoryDatabase();await singleton.connect();await singleton.migrate();
  }
 }
 return singleton
}
export function setDatabaseAdapter(adapter:DatabaseAdapter){singleton=adapter}

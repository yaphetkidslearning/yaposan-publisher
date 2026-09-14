import type { DatabaseAdapter, ProfileFieldAudience, SpaceDataGrantRecord, SpacePostRecord, SpacePrivacySettingsRecord, SpaceVisibility } from './database';
import { requireSpaceAccess } from './spaces';
import { sanitizeSpecificAudience } from './postAudience';

export type PrivacyResourceType = 'post'|'ai'|'studio'|'product'|'project';
const POST_VISIBILITIES = new Set(['private','followers','specific','public','team','unlisted']);
const PROFILE_AUDIENCES = new Set<ProfileFieldAudience>(['private','followers','public']);
const RESOURCE_VISIBILITIES = new Set<SpaceVisibility>(['private','team','unlisted','public','paid']);
const DATA_SCOPES = new Set(['profile_public','selected_ai','selected_studios','selected_projects','selected_files']);

export async function getOrCreatePrivacySettings(db:DatabaseAdapter,spaceId:string):Promise<SpacePrivacySettingsRecord>{
  const existing=(await db.find('spacePrivacySettings',x=>x.spaceId===spaceId))[0];
  if(existing){
    if(existing.defaultPostVisibility==='friends') return db.update('spacePrivacySettings',existing.id,{defaultPostVisibility:'followers'});
    return existing;
  }
  return db.insert('spacePrivacySettings',{spaceId,publicPageEnabled:false,discoverable:false,showFollowerCount:false,profileAudience:'private',dmAudience:'followers',defaultPostVisibility:'private',externalSharingEnabled:false});
}

export async function getSpacePrivacy(db:DatabaseAdapter,userId:string,spaceId:string){
  await requireSpaceAccess(db,userId,spaceId,'viewer');
  const settings=await getOrCreatePrivacySettings(db,spaceId);
  const [posts,ai,studios,products,projects,connections,grants]=await Promise.all([
    db.find('spacePosts',x=>x.spaceId===spaceId),
    db.find('spaceAIAgents',x=>x.spaceId===spaceId),
    db.find('spaceStudios',x=>x.spaceId===spaceId),
    db.find('spaceStoreProducts',x=>x.spaceId===spaceId),
    db.find('projects',x=>x.spaceId===spaceId&&!x.deletedAt),
    db.find('spaceConnections',x=>x.spaceId===spaceId),
    db.find('spaceDataGrants',x=>x.spaceId===spaceId&&x.status==='active'),
  ]);
  const projectVisibility=(p:any):SpaceVisibility=>RESOURCE_VISIBILITIES.has(p?.payload?.publication?.visibility)?p.payload.publication.visibility:'private';
  return {settings,inventory:{
    posts:posts.map(x=>({id:x.id,label:x.body.slice(0,80),visibility:x.visibility})),
    ai:ai.map(x=>({id:x.id,label:x.name,visibility:x.visibility,enabled:x.enabled})),
    studios:studios.map(x=>({id:x.id,label:x.name,visibility:x.visibility,status:x.status})),
    products:products.map(x=>({id:x.id,label:x.name,visibility:x.visibility,status:x.status})),
    projects:projects.map(x=>({id:x.id,label:x.name,visibility:projectVisibility(x)})),
  },connections:connections.map(c=>({id:c.id,name:c.name,kind:c.kind,status:c.status,billing:c.billing,hasCredential:Boolean(c.credentialRef),grant:grants.find(g=>g.connectionId===c.id)}))};
}

export async function updateSpacePrivacy(db:DatabaseAdapter,userId:string,spaceId:string,patch:any){
  const space=await requireSpaceAccess(db,userId,spaceId,'admin');
  const current=await getOrCreatePrivacySettings(db,spaceId);
  const next=await db.update('spacePrivacySettings',current.id,{
    publicPageEnabled:typeof patch.publicPageEnabled==='boolean'?patch.publicPageEnabled:current.publicPageEnabled,
    discoverable:typeof patch.discoverable==='boolean'?patch.discoverable:current.discoverable,
    showFollowerCount:typeof patch.showFollowerCount==='boolean'?patch.showFollowerCount:current.showFollowerCount,
    profileAudience:PROFILE_AUDIENCES.has(String(patch.profileAudience) as ProfileFieldAudience)?patch.profileAudience:(current.profileAudience??'private'),
    dmAudience:['everyone','followers','nobody'].includes(String(patch.dmAudience))?patch.dmAudience:(current.dmAudience??'followers'),
    defaultPostVisibility:['private','followers','specific','public','team'].includes(patch.defaultPostVisibility)?patch.defaultPostVisibility:(current.defaultPostVisibility==='friends'?'followers':current.defaultPostVisibility),
    externalSharingEnabled:typeof patch.externalSharingEnabled==='boolean'?patch.externalSharingEnabled:current.externalSharingEnabled,
    displayName:typeof patch.displayName==='string'?patch.displayName.trim().slice(0,80):current.displayName,
    bio:typeof patch.bio==='string'?patch.bio.trim().slice(0,500):current.bio,
    website:typeof patch.website==='string'?patch.website.trim().slice(0,300):current.website,
    location:typeof patch.location==='string'?patch.location.trim().slice(0,120):current.location,
    displayNameAudience:PROFILE_AUDIENCES.has(String(patch.displayNameAudience) as ProfileFieldAudience)?patch.displayNameAudience:(current.displayNameAudience??'private'),
    emailAudience:PROFILE_AUDIENCES.has(String(patch.emailAudience) as ProfileFieldAudience)?patch.emailAudience:(current.emailAudience??'private'),
    bioAudience:PROFILE_AUDIENCES.has(String(patch.bioAudience) as ProfileFieldAudience)?patch.bioAudience:(current.bioAudience??'private'),
    websiteAudience:PROFILE_AUDIENCES.has(String(patch.websiteAudience) as ProfileFieldAudience)?patch.websiteAudience:(current.websiteAudience??'private'),
    locationAudience:PROFILE_AUDIENCES.has(String(patch.locationAudience) as ProfileFieldAudience)?patch.locationAudience:(current.locationAudience??'private'),
    avatarAudience:PROFILE_AUDIENCES.has(String(patch.avatarAudience) as ProfileFieldAudience)?patch.avatarAudience:(current.avatarAudience??'private'),
    coverAudience:PROFILE_AUDIENCES.has(String(patch.coverAudience) as ProfileFieldAudience)?patch.coverAudience:(current.coverAudience??'private'),
    avatarUri:typeof patch.avatarUri==='string'?patch.avatarUri.trim().slice(0,1000):current.avatarUri,
    coverUri:typeof patch.coverUri==='string'?patch.coverUri.trim().slice(0,1000):current.coverUri,
    coverX:Number.isFinite(Number(patch.coverX))?Math.max(-1000,Math.min(1000,Number(patch.coverX))):current.coverX,
    coverY:Number.isFinite(Number(patch.coverY))?Math.max(-1000,Math.min(1000,Number(patch.coverY))):current.coverY,
    coverZoom:Number.isFinite(Number(patch.coverZoom))?Math.max(0.5,Math.min(4,Number(patch.coverZoom))):current.coverZoom,
  });
  await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'space.privacy.updated',target:spaceId,metadata:{publicPageEnabled:next.publicPageEnabled,discoverable:next.discoverable,showFollowerCount:next.showFollowerCount,dmAudience:next.dmAudience,defaultPostVisibility:next.defaultPostVisibility,externalSharingEnabled:next.externalSharingEnabled}});
  return next;
}

export async function setResourceVisibility(db:DatabaseAdapter,userId:string,spaceId:string,type:PrivacyResourceType,resourceId:string,visibilityInput:string,audienceUserIdsInput?:unknown){
  const normalizedInput=visibilityInput==='friends'?'followers':visibilityInput;
  const postVisibility=(POST_VISIBILITIES.has(normalizedInput)?normalizedInput:'private') as SpacePostRecord['visibility'];
  const resourceVisibility=(RESOURCE_VISIBILITIES.has(visibilityInput as SpaceVisibility)?visibilityInput:'private') as SpaceVisibility;
  const required=(type==='post'?postVisibility==='public':resourceVisibility==='public'||resourceVisibility==='unlisted'||resourceVisibility==='paid')?'admin':'editor';
  const space=await requireSpaceAccess(db,userId,spaceId,required);
  let item:any;
  if(type==='post'){
    const post=await db.get('spacePosts',resourceId);if(!post||post.spaceId!==spaceId)throw new Error('PRIVACY_RESOURCE_NOT_FOUND');
    const audienceUserIds=postVisibility==='specific'?await sanitizeSpecificAudience(db,userId,audienceUserIdsInput):[];
    if(postVisibility==='specific'&&!audienceUserIds.length)throw new Error('SPECIFIC_AUDIENCE_REQUIRED');
    item=await db.update('spacePosts',resourceId,{visibility:postVisibility,audienceUserIds});
  }else if(type==='ai'){
    const row=await db.get('spaceAIAgents',resourceId);if(!row||row.spaceId!==spaceId)throw new Error('PRIVACY_RESOURCE_NOT_FOUND');
    item=await db.update('spaceAIAgents',resourceId,{visibility:resourceVisibility});
  }else if(type==='studio'){
    const row=await db.get('spaceStudios',resourceId);if(!row||row.spaceId!==spaceId)throw new Error('PRIVACY_RESOURCE_NOT_FOUND');
    item=await db.update('spaceStudios',resourceId,{visibility:resourceVisibility,status:resourceVisibility==='public'||resourceVisibility==='unlisted'||resourceVisibility==='paid'?'published':row.status});
  }else if(type==='product'){
    const row=await db.get('spaceStoreProducts',resourceId);if(!row||row.spaceId!==spaceId)throw new Error('PRIVACY_RESOURCE_NOT_FOUND');
    const v=resourceVisibility==='public'?'public':'private'; item=await db.update('spaceStoreProducts',resourceId,{visibility:v,marketplaceListed:v==='private'?false:row.marketplaceListed,status:v==='public'?'active':row.status});
  }else{
    const row=await db.get('projects',resourceId);if(!row||row.spaceId!==spaceId)throw new Error('PRIVACY_RESOURCE_NOT_FOUND');
    const payload=(row.payload&&typeof row.payload==='object'?row.payload:{}) as Record<string,unknown>;
    item=await db.update('projects',resourceId,{payload:{...payload,publication:{...((payload.publication&&typeof payload.publication==='object')?payload.publication as object:{}),visibility:resourceVisibility}}});
  }
  await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'space.resource.visibility_changed',target:resourceId,metadata:{spaceId,type,visibility:type==='post'?postVisibility:resourceVisibility}});
  return item;
}

export async function updateConnectionDataGrant(db:DatabaseAdapter,userId:string,spaceId:string,connectionId:string,input:any):Promise<SpaceDataGrantRecord>{
  const space=await requireSpaceAccess(db,userId,spaceId,'admin');
  const connection=await db.get('spaceConnections',connectionId);if(!connection||connection.spaceId!==spaceId)throw new Error('CONNECTION_NOT_FOUND');
  const settings=await getOrCreatePrivacySettings(db,spaceId);
  const scopes:string[]=Array.isArray(input.scopes)?[...new Set<string>(input.scopes.map((x:unknown)=>String(x)).filter((x:string)=>DATA_SCOPES.has(x)))].slice(0,10):[];
  const requestedIds:string[]=Array.isArray(input.resourceIds)?[...new Set<string>(input.resourceIds.map((x:unknown)=>String(x)).filter((x:string)=>Boolean(x)))].slice(0,100):[];
  const [ai,studios,projects,assets]=await Promise.all([db.find('spaceAIAgents',x=>x.spaceId===spaceId),db.find('spaceStudios',x=>x.spaceId===spaceId),db.find('projects',x=>x.spaceId===spaceId&&!x.deletedAt),db.find('assets',x=>x.spaceId===spaceId)]);
  const allowedIds=new Set([...ai,...studios,...projects,...assets].map(x=>x.id));
  const resourceIds=requestedIds.filter(id=>allowedIds.has(id));
  if(resourceIds.length!==requestedIds.length)throw new Error('DATA_GRANT_RESOURCE_OUTSIDE_SPACE');
  if(scopes.length&&!settings.externalSharingEnabled)throw new Error('EXTERNAL_DATA_SHARING_DISABLED');
  const prior=(await db.find('spaceDataGrants',x=>x.spaceId===spaceId&&x.connectionId===connectionId))[0];
  const values={scopes,resourceIds,purpose:input.purpose?String(input.purpose).trim().slice(0,300):undefined,status:(scopes.length?'active':'revoked') as 'active'|'revoked'};
  const grant=prior?await db.update('spaceDataGrants',prior.id,values):await db.insert('spaceDataGrants',{spaceId,connectionId,grantedByUserId:userId,...values});
  await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'space.connection.data_grant_changed',target:connectionId,metadata:{spaceId,scopes,resourceCount:resourceIds.length,status:grant.status}});
  return grant;
}

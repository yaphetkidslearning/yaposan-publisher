import type { DatabaseAdapter } from './database';
import { getOrCreatePrivacySettings } from './privacy';


export async function getPublicCreator(db:DatabaseAdapter, slug:string){
  const space=(await db.find('spaces',s=>s.slug===slug&&s.status==='active'))[0];
  if(!space) throw new Error('PUBLIC_PAGE_NOT_FOUND');
  const privacy=(await db.find('spacePrivacySettings',x=>x.spaceId===space.id))[0];
  if(!privacy?.publicPageEnabled) throw new Error('PUBLIC_PAGE_NOT_FOUND');
  const [studios,ai,posts,followers,projects,products,owner]=await Promise.all([
    db.find('spaceStudios',s=>s.spaceId===space.id&&s.status==='published'&&s.visibility==='public'),
    db.find('spaceAIAgents',a=>a.spaceId===space.id&&a.enabled&&a.visibility==='public'),
    db.find('spacePosts',p=>p.spaceId===space.id&&p.visibility==='public'),
    db.find('spaceFollows',f=>f.spaceId===space.id),
    db.find('projects',p=>p.spaceId===space.id&&!p.deletedAt&&Boolean((p.payload as any)?.publication?.visibility==='public')),
    db.find('spaceStoreProducts',p=>p.spaceId===space.id&&p.status==='active'&&p.visibility==='public'),
    db.get('users',space.ownerUserId),
  ]);
  return {
    space:{id:space.id,name:space.name,slug:space.slug,kind:space.kind},
    privacy:{discoverable:privacy.discoverable,showFollowerCount:privacy.showFollowerCount,dmAudience:privacy.dmAudience??'followers',displayName:(privacy.displayNameAudience??'private')==='public'?privacy.displayName:undefined,email:(privacy.emailAudience??'private')==='public'?owner?.email:undefined,bio:(privacy.bioAudience??'private')==='public'?privacy.bio:undefined,website:(privacy.websiteAudience??'private')==='public'?privacy.website:undefined,location:(privacy.locationAudience??'private')==='public'?privacy.location:undefined,avatarUri:(privacy.avatarAudience??'private')==='public'?privacy.avatarUri:undefined,coverUri:(privacy.coverAudience??'private')==='public'?privacy.coverUri:undefined,coverX:privacy.coverX??0,coverY:privacy.coverY??0,coverZoom:privacy.coverZoom??1},
    followersCount:privacy.showFollowerCount?followers.length:undefined,
    studios:studios.map(s=>({id:s.id,name:s.name,description:s.description,version:s.version,stepCount:s.nodes.length})),
    ai:ai.map(a=>({id:a.id,name:a.name,provider:a.provider,model:a.model})),
    posts:posts.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,30).map(p=>({id:p.id,body:p.body,createdAt:p.createdAt})),
    creations:projects.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,24).map(p=>({id:p.id,name:p.name,updatedAt:p.updatedAt})),
    store:products.map(p=>({id:p.id,kind:p.kind,name:p.name,description:p.description,priceCents:p.priceCents,currency:p.currency})),
  };
}

export async function publishSpace(db:DatabaseAdapter,userId:string,spaceId:string){
  const {requireSpaceAccess}=await import('./spaces');
  const space=await requireSpaceAccess(db,userId,spaceId,'admin');
  const privacy=await getOrCreatePrivacySettings(db,spaceId);
  const next=await db.update('spacePrivacySettings',privacy.id,{publicPageEnabled:true});
  await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'space.public_page.enabled',target:spaceId,metadata:{slug:space.slug}});
  return {space,privacy:next};
}

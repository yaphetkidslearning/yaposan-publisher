import type { DatabaseAdapter } from './database';
import { enrichPostSocial } from './social108';
import { canViewPost } from './postAudience';

async function isBlocked(db:DatabaseAdapter,a:string,b:string){
 const rows=await db.find('socialBlocks',x=>(x.userId===a&&x.targetUserId===b)||(x.userId===b&&x.targetUserId===a)); return rows.length>0;
}
async function accessibleProfileSpace(db:DatabaseAdapter,userId:string,spaceId:string,forFollow=false){
 const space=await db.get('spaces',spaceId); if(!space||space.status!=='active') throw new Error('SPACE_NOT_FOUND');
 const privacy=(await db.find('spacePrivacySettings',x=>x.spaceId===spaceId))[0]; const audience=privacy?.profileAudience??(privacy?.publicPageEnabled?'public':'private');
 if(space.ownerUserId===userId)return space;
 if(forFollow){if(space.visibility==='public'||privacy?.publicPageEnabled||privacy?.discoverable)return space;throw new Error('SPACE_NOT_FOLLOWABLE')}
 if(space.visibility==='public'||audience==='public'||privacy?.publicPageEnabled)return space;
 if(audience==='followers'){const followed=(await db.find('spaceFollows',x=>x.spaceId===spaceId&&x.followerUserId===userId))[0];if(followed)return space}
 throw new Error('SPACE_NOT_VISIBLE');
}
export async function getPublicProfile(db:DatabaseAdapter,userId:string,spaceId:string){
 const space=await accessibleProfileSpace(db,userId,spaceId); if(await isBlocked(db,userId,space.ownerUserId)) throw new Error('SOCIAL_BLOCKED');
 const followers=await db.find('spaceFollows',x=>x.spaceId===spaceId); const allPosts=(await db.find('spacePosts',x=>x.spaceId===spaceId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));const posts:typeof allPosts=[];for(const post of allPosts)if(await canViewPost(db,userId,post))posts.push(post);
 const meta=await enrichPostSocial(db,userId,spaceId,posts.map(x=>x.id)); const comments=await db.find('spaceComments',()=>true); const tags=await db.find('spacePostHashtags',x=>x.spaceId===spaceId);
 const privacy=(await db.find('spacePrivacySettings',x=>x.spaceId===spaceId))[0];const following=followers.some(x=>x.followerUserId===userId);const owner=await db.get('users',space.ownerUserId);const canSee=(audience:unknown)=>audience==='public'||(audience==='followers'&&following)||space.ownerUserId===userId;const profile={displayName:canSee(privacy?.displayNameAudience)?privacy?.displayName:undefined,email:canSee(privacy?.emailAudience)?owner?.email:undefined,bio:canSee(privacy?.bioAudience)?privacy?.bio:undefined,website:canSee(privacy?.websiteAudience)?privacy?.website:undefined,location:canSee(privacy?.locationAudience)?privacy?.location:undefined,avatarUri:canSee(privacy?.avatarAudience)?privacy?.avatarUri:undefined,coverUri:canSee(privacy?.coverAudience)?privacy?.coverUri:undefined};return {space,followersCount:followers.length,following,profile,posts:posts.map(p=>({...p,...meta[p.id],hashtags:tags.filter(t=>t.postId===p.id).map(t=>t.tag),comments:comments.filter(c=>c.postId===p.id)}))};
}
export async function togglePublicFollow(db:DatabaseAdapter,userId:string,spaceId:string){const space=await accessibleProfileSpace(db,userId,spaceId,true);if(await isBlocked(db,userId,space.ownerUserId))throw new Error('SOCIAL_BLOCKED');if(space.ownerUserId===userId)throw new Error('CANNOT_FOLLOW_SELF');const row=(await db.find('spaceFollows',x=>x.spaceId===spaceId&&x.followerUserId===userId))[0];if(row){await db.delete('spaceFollows',row.id);return {following:false}}await db.insert('spaceFollows',{spaceId,followerUserId:userId});return {following:true}}
export async function getExploreFeed(db:DatabaseAdapter,userId:string,mode:'explore'|'following'|'saved'='explore'){
 const spaces=await db.find('spaces',x=>x.status==='active'); const privacy=await db.find('spacePrivacySettings',()=>true); const publicIds=new Set(spaces.filter(s=>s.visibility==='public'||privacy.some(p=>p.spaceId===s.id&&p.publicPageEnabled&&p.discoverable)).map(s=>s.id));
 const follows=await db.find('spaceFollows',x=>x.followerUserId===userId);const followedIds=new Set(follows.map(x=>x.spaceId));
 let posts=await db.find('spacePosts',()=>true);
 if(mode==='saved'){const saved=await db.find('spacePostBookmarks',x=>x.userId===userId);const ids=new Set(saved.map(x=>x.postId));posts=posts.filter(p=>ids.has(p.id));}
 else if(mode==='explore'){posts=posts.filter(p=>publicIds.has(p.spaceId)&&p.visibility==='public');}
 else {posts=posts.filter(p=>followedIds.has(p.spaceId)||p.authorUserId===userId);}
 const visible:typeof posts=[];for(const p of posts)if(await canViewPost(db,userId,p))visible.push(p);posts=visible;
 const blocks=await db.find('socialBlocks',x=>x.userId===userId||x.targetUserId===userId);const blocked=new Set(blocks.map(x=>x.userId===userId?x.targetUserId:x.userId));posts=posts.filter(p=>!blocked.has(p.authorUserId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100);
 const grouped=new Map<string,string[]>();for(const p of posts){const a=grouped.get(p.spaceId)??[];a.push(p.id);grouped.set(p.spaceId,a)}const meta:Record<string,any>={};for(const [sid,ids] of grouped)Object.assign(meta,await enrichPostSocial(db,userId,sid,ids));const tags=await db.find('spacePostHashtags',()=>true);const comments=await db.find('spaceComments',()=>true);
 return posts.map(p=>({...p,...meta[p.id],space:spaces.find(s=>s.id===p.spaceId),hashtags:tags.filter(t=>t.postId===p.id).map(t=>t.tag),comments:comments.filter(c=>c.postId===p.id)}));
}
export async function searchSocial(db:DatabaseAdapter,userId:string,qInput:string){const q=qInput.trim().toLowerCase().slice(0,80);if(!q)return {spaces:[],posts:[],hashtags:[]};const spaces=await db.find('spaces',s=>s.status==='active'&&s.name.toLowerCase().includes(q));const privacy=await db.find('spacePrivacySettings',()=>true);const publicSpaces=spaces.filter(s=>s.visibility==='public'||privacy.some(p=>p.spaceId===s.id&&p.discoverable&&((p.profileAudience??(p.publicPageEnabled?'public':'private'))!=='private'))).slice(0,20);const ids=new Set(publicSpaces.map(s=>s.id));const posts=(await db.find('spacePosts',p=>p.visibility==='public'&&(p.body.toLowerCase().includes(q)||ids.has(p.spaceId)))).slice(0,30);const allTags=await db.find('spacePostHashtags',t=>t.tag.includes(q.replace(/^#/,'')));return {spaces:publicSpaces,posts,hashtags:[...new Set(allTags.map(t=>t.tag))].slice(0,20)}}
export async function getHashtagFeed(db:DatabaseAdapter,userId:string,tagInput:string){const tag=tagInput.toLowerCase().replace(/^#/,'').replace(/[^\p{L}\p{N}_-]/gu,'').slice(0,64);const rows=await db.find('spacePostHashtags',x=>x.tag===tag);const ids=new Set(rows.map(x=>x.postId));return (await getExploreFeed(db,userId,'explore')).filter((p:any)=>ids.has(p.id))}
export async function assertNotBlocked(db:DatabaseAdapter,a:string,b:string){if(await isBlocked(db,a,b))throw new Error('SOCIAL_BLOCKED')}

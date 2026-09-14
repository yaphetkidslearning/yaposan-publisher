import type { DatabaseAdapter, SpacePostRecord } from "./database";
import { getOrCreatePrivacySettings } from './privacy';
import { requireSpaceAccess } from "./spaces";
import { enrichPostSocial, recordPostMetadata } from './social108';
import { canViewPost, normalizePostAudience, sanitizeSpecificAudience } from './postAudience';

export async function getSpaceSocial(db:DatabaseAdapter,userId:string,spaceId:string){
  await requireSpaceAccess(db,userId,spaceId,"viewer");
  const posts=(await db.find("spacePosts",p=>p.spaceId===spaceId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const comments=await db.find("spaceComments",()=>true);
  const commentReactions=await db.find('spaceCommentReactions',x=>comments.some(c=>c.id===x.commentId));
  const followers=await db.find("spaceFollows",f=>f.spaceId===spaceId);
  const metadata=await enrichPostSocial(db,userId,spaceId,posts.map(p=>p.id));
  const hashtagRows=await db.find('spacePostHashtags',x=>x.spaceId===spaceId);
  return {followersCount:followers.length,following:followers.some(f=>f.followerUserId===userId),posts:posts.map(post=>({...post,...metadata[post.id],hashtags:hashtagRows.filter(x=>x.postId===post.id).map(x=>x.tag),comments:comments.filter(c=>c.postId===post.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(c=>{const rows=commentReactions.filter(r=>r.commentId===c.id);const counts:Record<string,number>={};for(const r of rows)counts[r.kind]=(counts[r.kind]??0)+1;return {...c,reactions:counts,myReaction:rows.find(r=>r.userId===userId)?.kind};})}))};
}
export async function createSpacePost(db:DatabaseAdapter,userId:string,spaceId:string,body:string,visibilityInput?:string,mediaUrlInput?:string,mediaTypeInput?:string,quotePostId?:string,audienceUserIdsInput?:unknown){
  const space=await requireSpaceAccess(db,userId,spaceId,"editor");const clean=body.trim().slice(0,4000);if(!clean)throw new Error("POST_BODY_REQUIRED");
  const privacy=await getOrCreatePrivacySettings(db,spaceId);const requested=normalizePostAudience(visibilityInput??privacy.defaultPostVisibility);
  if(requested==='specific'&&!(Array.isArray(audienceUserIdsInput)&&audienceUserIdsInput.length))throw new Error('SPECIFIC_AUDIENCE_REQUIRED');
  if(requested==='public'&&!(await (await import('./spaces')).canAccessSpace(db,userId,spaceId,'admin')))throw new Error('SPACE_ADMIN_REQUIRED_TO_PUBLISH');
  const mediaUrl=mediaUrlInput?.trim().slice(0,2048)||undefined; const mediaType=(['image','video','audio'].includes(String(mediaTypeInput))?mediaTypeInput:undefined) as 'image'|'video'|'audio'|undefined;
  const audienceUserIds=requested==='specific'?await sanitizeSpecificAudience(db,userId,audienceUserIdsInput):[];if(requested==='specific'&&!audienceUserIds.length)throw new Error('SPECIFIC_AUDIENCE_REQUIRED');
  const post=await db.insert("spacePosts",{spaceId,authorUserId:userId,body:clean,visibility:requested,audienceUserIds,mediaUrl,mediaType,quotePostId:quotePostId?.trim()||undefined});await recordPostMetadata(db,userId,spaceId,post.id,clean);
  await db.insert('auditEvents',{organizationId:space.organizationId,actorUserId:userId,action:'space.post.created',target:post.id,metadata:{spaceId,visibility:requested}});return post;
}
export async function createSpaceComment(db:DatabaseAdapter,userId:string,spaceId:string,postId:string,body:string,parentCommentId?:string){
  const post=await db.get("spacePosts",postId);if(!post||post.spaceId!==spaceId)throw new Error("POST_NOT_FOUND");if(!(await canViewPost(db,userId,post)))throw new Error('POST_ACCESS_DENIED');
  const clean=body.trim().slice(0,2000);if(!clean)throw new Error("COMMENT_BODY_REQUIRED");let parent:string|undefined;if(parentCommentId){const row=await db.get("spaceComments",parentCommentId);if(!row||row.postId!==postId)throw new Error("PARENT_COMMENT_NOT_FOUND");parent=row.id}const comment=await db.insert("spaceComments",{postId,authorUserId:userId,body:clean,parentCommentId:parent});
  if(post.authorUserId!==userId) await db.insert('socialNotifications',{spaceId,userId:post.authorUserId,actorUserId:userId,kind:'comment',resourceType:'post',resourceId:postId,readAt:undefined});return comment;
}

export async function toggleSpaceCommentReaction(db:DatabaseAdapter,userId:string,spaceId:string,commentId:string,kindInput:string){
  const comment=await db.get('spaceComments',commentId);if(!comment)throw new Error('COMMENT_NOT_FOUND');
  const post=await db.get('spacePosts',comment.postId);if(!post||post.spaceId!==spaceId)throw new Error('COMMENT_NOT_FOUND');if(!(await canViewPost(db,userId,post)))throw new Error('POST_ACCESS_DENIED');
  const allowed=new Set(['like','dislike','love','laugh','wow','fire']);const kind=kindInput as 'like'|'dislike'|'love'|'laugh'|'wow'|'fire';if(!allowed.has(kind))throw new Error('REACTION_INVALID');
  const current=(await db.find('spaceCommentReactions',x=>x.commentId===commentId&&x.userId===userId))[0];
  if(current?.kind===kind){await db.delete('spaceCommentReactions',current.id);return {reaction:null};}
  if(current)await db.update('spaceCommentReactions',current.id,{kind});else await db.insert('spaceCommentReactions',{spaceId,commentId,userId,kind});
  return {reaction:kind};
}

export async function toggleSpaceFollow(db:DatabaseAdapter,userId:string,spaceId:string){await requireSpaceAccess(db,userId,spaceId,"viewer");const existing=(await db.find("spaceFollows",f=>f.spaceId===spaceId&&f.followerUserId===userId))[0];if(existing){await db.delete("spaceFollows",existing.id);return {following:false};}await db.insert("spaceFollows",{spaceId,followerUserId:userId});return {following:true};}

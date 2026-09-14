import type { DatabaseAdapter, SocialMediaKind } from './database';
import type { ObjectStorage } from './storage';
import { requireSpaceAccess } from './spaces';
import { assertNotBlocked, getExploreFeed } from './social109';
import { createSpacePost } from './spaceSocial';

const MIME_KIND:Record<string,SocialMediaKind>={
 'image/jpeg':'image','image/png':'image','image/webp':'image','image/gif':'image',
 'video/mp4':'video','video/webm':'video','video/quicktime':'video',
 'audio/mpeg':'audio','audio/mp4':'audio','audio/ogg':'audio','audio/wav':'audio'
};
export const SOCIAL_MEDIA_MAX_BYTES=100*1024*1024;
export const STORY_LIFETIME_MS=24*60*60*1000;

export async function uploadSocialMedia(db:DatabaseAdapter,storage:ObjectStorage,userId:string,spaceId:string,input:{name:string;mimeType:string;bytes:Uint8Array;caption?:string;altText?:string;durationMs?:number;width?:number;height?:number}){
 await requireSpaceAccess(db,userId,spaceId,'editor');
 const kind=MIME_KIND[input.mimeType.toLowerCase()]; if(!kind)throw new Error('SOCIAL_MEDIA_TYPE_UNSUPPORTED');
 if(!input.bytes.length||input.bytes.length>SOCIAL_MEDIA_MAX_BYTES)throw new Error('SOCIAL_MEDIA_SIZE_INVALID');
 const stored=await storage.put({workspaceId:`social/${spaceId}/${userId}`,name:input.name.slice(0,120)||'media',contentType:input.mimeType,body:input.bytes});
 const asset=await db.insert('socialMediaAssets',{spaceId,ownerUserId:userId,kind,storageKey:stored.key,url:undefined,mimeType:input.mimeType,size:stored.size,caption:input.caption?.trim().slice(0,2200)||undefined,altText:input.altText?.trim().slice(0,1000)||undefined,width:input.width,height:input.height,durationMs:input.durationMs,processingStatus:kind==='image'?'ready':'processing',moderationStatus:'pending'});
 return db.update('socialMediaAssets',asset.id,{url:`/api/v1/public/social-media/${asset.id}`});
}
export async function attachPostMedia(db:DatabaseAdapter,userId:string,spaceId:string,postId:string,mediaAssetIds:string[]){
 await requireSpaceAccess(db,userId,spaceId,'editor'); const post=await db.get('spacePosts',postId);if(!post||post.spaceId!==spaceId)throw new Error('POST_NOT_FOUND');
 const unique=[...new Set(mediaAssetIds)].slice(0,10); for(let i=0;i<unique.length;i++){const a=await db.get('socialMediaAssets',unique[i]);if(!a||a.spaceId!==spaceId)throw new Error('SOCIAL_MEDIA_NOT_FOUND');await db.insert('socialPostMedia',{spaceId,postId,mediaAssetId:a.id,position:i});} return listPostMedia(db,postId);
}
export async function listPostMedia(db:DatabaseAdapter,postId:string){const links=(await db.find('socialPostMedia',x=>x.postId===postId)).sort((a,b)=>a.position-b.position);const out=[];for(const l of links){const a=await db.get('socialMediaAssets',l.mediaAssetId);if(a)out.push({...a,position:l.position})}return out}
export async function createStory(db:DatabaseAdapter,userId:string,spaceId:string,input:{mediaAssetId?:string;body?:string;visibility?:string;highlightId?:string}){
 await requireSpaceAccess(db,userId,spaceId,'editor'); if(input.mediaAssetId){const a=await db.get('socialMediaAssets',input.mediaAssetId);if(!a||a.spaceId!==spaceId)throw new Error('SOCIAL_MEDIA_NOT_FOUND')} const body=input.body?.trim().slice(0,1000)||undefined;if(!body&&!input.mediaAssetId)throw new Error('STORY_CONTENT_REQUIRED'); const visibility=(['private','public','followers','team'].includes(String(input.visibility))?input.visibility:'private') as 'private'|'public'|'followers'|'team';return db.insert('socialStories',{spaceId,authorUserId:userId,mediaAssetId:input.mediaAssetId,body,visibility,expiresAt:new Date(Date.now()+STORY_LIFETIME_MS).toISOString(),highlightId:input.highlightId});
}
export async function getActiveStories(db:DatabaseAdapter,userId:string){
 const now=Date.now();const stories=(await db.find('socialStories',x=>Date.parse(x.expiresAt)>now)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));const spaces=await db.find('spaces',x=>x.status==='active');const follows=await db.find('spaceFollows',x=>x.followerUserId===userId);const followed=new Set(follows.map(x=>x.spaceId));const memberships=await db.find('spaceMemberships',x=>x.userId===userId);const memberSpaces=new Set(memberships.map(x=>x.spaceId));const blocks=await db.find('socialBlocks',x=>x.userId===userId||x.targetUserId===userId);const blocked=new Set(blocks.map(x=>x.userId===userId?x.targetUserId:x.userId));const visible=stories.filter(st=>!blocked.has(st.authorUserId)&&(st.authorUserId===userId||st.visibility==='public'||(st.visibility==='followers'&&followed.has(st.spaceId))||(st.visibility==='team'&&memberSpaces.has(st.spaceId))));const assets=await db.find('socialMediaAssets',()=>true);return visible.slice(0,100).map(st=>({...st,space:spaces.find(s=>s.id===st.spaceId),media:assets.find(a=>a.id===st.mediaAssetId)}));
}
export async function viewStory(db:DatabaseAdapter,userId:string,spaceId:string,storyId:string){const story=await db.get('socialStories',storyId);if(!story||story.spaceId!==spaceId||Date.parse(story.expiresAt)<=Date.now())throw new Error('STORY_NOT_FOUND');await assertNotBlocked(db,userId,story.authorUserId);const existing=(await db.find('socialStoryViews',x=>x.storyId===storyId&&x.userId===userId))[0];if(existing)return existing;return db.insert('socialStoryViews',{storyId,userId,viewedAt:new Date().toISOString()})}
export async function createHighlight(db:DatabaseAdapter,userId:string,spaceId:string,nameInput:string,coverMediaAssetId?:string){await requireSpaceAccess(db,userId,spaceId,'editor');const name=nameInput.trim().slice(0,80);if(!name)throw new Error('HIGHLIGHT_NAME_REQUIRED');if(coverMediaAssetId){const a=await db.get('socialMediaAssets',coverMediaAssetId);if(!a||a.spaceId!==spaceId)throw new Error('SOCIAL_MEDIA_NOT_FOUND')}return db.insert('socialHighlights',{spaceId,ownerUserId:userId,name,coverMediaAssetId})}
export async function createReel(db:DatabaseAdapter,userId:string,spaceId:string,input:{mediaAssetId:string;caption?:string;audioTitle?:string;durationMs?:number;visibility?:string}){const a=await db.get('socialMediaAssets',input.mediaAssetId);if(!a||a.spaceId!==spaceId||a.kind!=='video')throw new Error('REEL_VIDEO_REQUIRED');const post=await createSpacePost(db,userId,spaceId,input.caption||'Reel',input.visibility||'private',a.url,'video');await attachPostMedia(db,userId,spaceId,post.id,[a.id]);return db.insert('socialReels',{spaceId,postId:post.id,authorUserId:userId,mediaAssetId:a.id,caption:input.caption?.trim().slice(0,2200)||undefined,audioTitle:input.audioTitle?.trim().slice(0,200)||undefined,durationMs:input.durationMs,status:'published'})}
export async function getReelsFeed(db:DatabaseAdapter,userId:string){const publicPosts=await getExploreFeed(db,userId,'explore');const allowed=new Set(publicPosts.map((p:any)=>p.id));const reels=(await db.find('socialReels',r=>r.status==='published'&&allowed.has(r.postId))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));const assets=await db.find('socialMediaAssets',()=>true);return reels.slice(0,100).map(r=>({...r,post:publicPosts.find((p:any)=>p.id===r.postId),media:assets.find(a=>a.id===r.mediaAssetId)}))}

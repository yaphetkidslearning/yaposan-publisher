import type { DatabaseAdapter, SocialReactionKind } from './database';
import { canAccessSpace, requireSpaceAccess } from './spaces';
import { canViewPost } from './postAudience';


async function assertNotBlocked(db:DatabaseAdapter,a:string,b:string){const rows=await db.find('socialBlocks',x=>(x.userId===a&&x.targetUserId===b)||(x.userId===b&&x.targetUserId===a));if(rows.length)throw new Error('SOCIAL_BLOCKED')}
const REACTIONS = new Set<SocialReactionKind>(['like','dislike','love','laugh','wow','fire']);
const normalizeTag = (value:string) => value.trim().replace(/^#/,'').toLowerCase().replace(/[^\p{L}\p{N}_-]/gu,'').slice(0,64);
export const extractHashtags = (body:string) => [...new Set(Array.from(body.matchAll(/(?:^|\s)#([\p{L}\p{N}_-]{1,64})/gu),m=>normalizeTag(m[1])).filter(Boolean))].slice(0,20);
export const extractMentions = (body:string) => [...new Set(Array.from(body.matchAll(/(?:^|\s)@([A-Za-z0-9._-]{1,64})/g),m=>m[1].toLowerCase()))].slice(0,20);

async function requirePost(db:DatabaseAdapter,spaceId:string,postId:string){
  const post=await db.get('spacePosts',postId);
  if(!post||post.spaceId!==spaceId) throw new Error('POST_NOT_FOUND');
  return post;
}

async function notify(db:DatabaseAdapter,spaceId:string,userId:string,actorUserId:string,kind:'reaction'|'comment'|'mention'|'repost'|'message',resourceType:string,resourceId:string){
  if(userId===actorUserId) return;
  await db.insert('socialNotifications',{spaceId,userId,actorUserId,kind,resourceType,resourceId,readAt:undefined});
}

export async function enrichPostSocial(db:DatabaseAdapter,userId:string,spaceId:string,postIds:string[]){
  const reactions=await db.find('spacePostReactions',x=>postIds.includes(x.postId));
  const bookmarks=await db.find('spacePostBookmarks',x=>x.userId===userId&&postIds.includes(x.postId));
  const reposts=await db.find('spacePostReposts',x=>postIds.includes(x.postId));
  return Object.fromEntries(postIds.map(postId=>{
    const mine=reactions.find(r=>r.postId===postId&&r.userId===userId)?.kind;
    const counts:Record<string,number>={};
    for(const r of reactions.filter(x=>x.postId===postId)) counts[r.kind]=(counts[r.kind]??0)+1;
    return [postId,{reactions:counts,myReaction:mine,bookmarked:bookmarks.some(x=>x.postId===postId),repostsCount:reposts.filter(x=>x.postId===postId).length,hashtags:[]}];
  }));
}

export async function togglePostReaction(db:DatabaseAdapter,userId:string,spaceId:string,postId:string,kindInput:string){
  const post=await requirePost(db,spaceId,postId); if(!(await canViewPost(db,userId,post))) throw new Error('POST_ACCESS_DENIED');
  await assertNotBlocked(db,userId,post.authorUserId);
  const kind=kindInput as SocialReactionKind; if(!REACTIONS.has(kind)) throw new Error('REACTION_INVALID');
  const current=(await db.find('spacePostReactions',x=>x.postId===postId&&x.userId===userId))[0];
  if(current?.kind===kind){await db.delete('spacePostReactions',current.id);return {reaction:null};}
  if(current){await db.update('spacePostReactions',current.id,{kind});}else{await db.insert('spacePostReactions',{spaceId,postId,userId,kind});}
  await notify(db,spaceId,post.authorUserId,userId,'reaction','post',postId); return {reaction:kind};
}
export async function togglePostBookmark(db:DatabaseAdapter,userId:string,spaceId:string,postId:string){
  const post=await requirePost(db,spaceId,postId); if(!(await canViewPost(db,userId,post))) throw new Error('POST_ACCESS_DENIED');
  const current=(await db.find('spacePostBookmarks',x=>x.postId===postId&&x.userId===userId))[0];
  if(current){await db.delete('spacePostBookmarks',current.id);return {bookmarked:false};}
  await db.insert('spacePostBookmarks',{spaceId,postId,userId});return {bookmarked:true};
}
export async function togglePostRepost(db:DatabaseAdapter,userId:string,spaceId:string,postId:string){
  const post=await requirePost(db,spaceId,postId); if(!(await canViewPost(db,userId,post))) throw new Error('POST_ACCESS_DENIED');
  await assertNotBlocked(db,userId,post.authorUserId);
  const current=(await db.find('spacePostReposts',x=>x.postId===postId&&x.userId===userId))[0];
  if(current){await db.delete('spacePostReposts',current.id);return {reposted:false};}
  await db.insert('spacePostReposts',{spaceId,postId,userId});await notify(db,spaceId,post.authorUserId,userId,'repost','post',postId);return {reposted:true};
}
export async function recordPostMetadata(db:DatabaseAdapter,userId:string,spaceId:string,postId:string,body:string){
  for(const tag of extractHashtags(body)) await db.insert('spacePostHashtags',{spaceId,postId,tag});
  const users=await db.find('users',()=>true);
  for(const handle of extractMentions(body)){
    const mentioned=users.find(u=>u.email.toLowerCase().split('@')[0]===handle);
    if(mentioned) await notify(db,spaceId,mentioned.id,userId,'mention','post',postId);
  }
}
export async function getTrendingHashtags(db:DatabaseAdapter,userId:string,spaceId:string){
  await requireSpaceAccess(db,userId,spaceId,'viewer'); const rows=await db.find('spacePostHashtags',x=>x.spaceId===spaceId);const map=new Map<string,number>();
  for(const r of rows) map.set(r.tag,(map.get(r.tag)??0)+1);
  return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,20).map(([tag,count])=>({tag,count}));
}
export async function listSocialNotifications(db:DatabaseAdapter,userId:string,spaceId:string){await requireSpaceAccess(db,userId,spaceId,'viewer');return (await db.find('socialNotifications',x=>x.spaceId===spaceId&&x.userId===userId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100)}
export async function markNotificationRead(db:DatabaseAdapter,userId:string,spaceId:string,id:string){await requireSpaceAccess(db,userId,spaceId,'viewer');const n=await db.get('socialNotifications',id);if(!n||n.spaceId!==spaceId||n.userId!==userId)throw new Error('NOTIFICATION_NOT_FOUND');return db.update('socialNotifications',id,{readAt:new Date().toISOString()})}

async function canStartPageDm(db:DatabaseAdapter,userId:string,spaceId:string){
  const space=await db.get('spaces',spaceId);if(!space||space.status!=='active')return false;
  if(space.ownerUserId===userId||await canAccessSpace(db,userId,spaceId,'viewer'))return true;
  const privacy=(await db.find('spacePrivacySettings',x=>x.spaceId===spaceId))[0];const policy=privacy?.dmAudience??'followers';
  if(policy==='nobody')return false;if(policy==='everyone')return true;
  return Boolean((await db.find('spaceFollows',x=>x.spaceId===spaceId&&x.followerUserId===userId))[0]);
}
export async function createConversation(db:DatabaseAdapter,userId:string,spaceId:string,participantUserIds:string[]){
  const space=await db.get('spaces',spaceId);if(!space||space.status!=='active')throw new Error('PAGE_NOT_FOUND');
  if(!(await canStartPageDm(db,userId,spaceId)))throw new Error('DM_NOT_ALLOWED');
  const unique=[...new Set([userId,...participantUserIds])].slice(0,25);
  for(const id of unique){if(id!==userId&&id!==space.ownerUserId&&!(await canAccessSpace(db,id,spaceId,'viewer')))throw new Error('DM_PARTICIPANT_NOT_ALLOWED');if(id!==userId)await assertNotBlocked(db,userId,id);}
  const existingMemberships=await db.find('socialConversationMembers',x=>x.userId===userId);const existingIds=new Set(existingMemberships.map(x=>x.conversationId));
  const c=await db.insert('socialConversations',{spaceId,createdByUserId:userId,title:undefined});
  for(const id of unique) await db.insert('socialConversationMembers',{conversationId:c.id,userId:id,lastReadAt:id===userId?new Date().toISOString():undefined});
  return c;
}
export async function createOwnerConversation(db:DatabaseAdapter,userId:string,spaceId:string){
  const space=await db.get('spaces',spaceId);if(!space||space.status!=='active')throw new Error('PAGE_NOT_FOUND');if(space.ownerUserId===userId)throw new Error('CANNOT_DM_SELF');
  if(!(await canStartPageDm(db,userId,spaceId)))throw new Error('DM_NOT_ALLOWED');await assertNotBlocked(db,userId,space.ownerUserId);
  const mine=await db.find('socialConversationMembers',x=>x.userId===userId);const owner=await db.find('socialConversationMembers',x=>x.userId===space.ownerUserId);const mineIds=new Set(mine.map(x=>x.conversationId));
  for(const member of owner){if(!mineIds.has(member.conversationId))continue;const conversation=await db.get('socialConversations',member.conversationId);if(!conversation||conversation.spaceId!==spaceId)continue;const all=await db.find('socialConversationMembers',x=>x.conversationId===conversation.id);if(all.length===2)return conversation;}
  return createConversation(db,userId,spaceId,[space.ownerUserId]);
}
export async function listConversations(db:DatabaseAdapter,userId:string,spaceId:string){
  const memberships=await db.find('socialConversationMembers',x=>x.userId===userId);const allowed=new Set(memberships.map(x=>x.conversationId));
  const conversations=(await db.find('socialConversations',x=>x.spaceId===spaceId&&allowed.has(x.id))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const messages=await db.find('socialMessages',x=>allowed.has(x.conversationId));
  return conversations.map(c=>({...c,lastMessage:messages.filter(m=>m.conversationId===c.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]}));
}
export async function sendMessage(db:DatabaseAdapter,userId:string,spaceId:string,conversationId:string,bodyInput:string){
  const c=await db.get('socialConversations',conversationId);if(!c||c.spaceId!==spaceId)throw new Error('CONVERSATION_NOT_FOUND');
  const member=(await db.find('socialConversationMembers',x=>x.conversationId===conversationId&&x.userId===userId))[0];if(!member)throw new Error('CONVERSATION_ACCESS_DENIED');
  const membersForBlock=await db.find('socialConversationMembers',x=>x.conversationId===conversationId);for(const m of membersForBlock)if(m.userId!==userId)await assertNotBlocked(db,userId,m.userId);
  const body=bodyInput.trim().slice(0,4000);if(!body)throw new Error('MESSAGE_BODY_REQUIRED');const msg=await db.insert('socialMessages',{spaceId,conversationId,senderUserId:userId,body});await db.update('socialConversations',conversationId,{});
  const members=await db.find('socialConversationMembers',x=>x.conversationId===conversationId);for(const m of members) await notify(db,spaceId,m.userId,userId,'message','conversation',conversationId);return msg;
}
export async function listMessages(db:DatabaseAdapter,userId:string,spaceId:string,conversationId:string){const member=(await db.find('socialConversationMembers',x=>x.conversationId===conversationId&&x.userId===userId))[0];if(!member)throw new Error('CONVERSATION_ACCESS_DENIED');return (await db.find('socialMessages',x=>x.conversationId===conversationId)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).slice(-500)}

export async function toggleUserBlock(db:DatabaseAdapter,userId:string,spaceId:string,targetUserId:string){await requireSpaceAccess(db,userId,spaceId,'viewer');if(targetUserId===userId)throw new Error('CANNOT_BLOCK_SELF');const current=(await db.find('socialBlocks',x=>x.spaceId===spaceId&&x.userId===userId&&x.targetUserId===targetUserId))[0];if(current){await db.delete('socialBlocks',current.id);return {blocked:false};}await db.insert('socialBlocks',{spaceId,userId,targetUserId});return {blocked:true}}
export async function reportSocialContent(db:DatabaseAdapter,userId:string,spaceId:string,resourceTypeInput:string,resourceId:string,reasonInput:string){await requireSpaceAccess(db,userId,spaceId,'viewer');const resourceType=(resourceTypeInput==='user'||resourceTypeInput==='comment'||resourceTypeInput==='message')?resourceTypeInput:'post';const reason=reasonInput.trim().slice(0,1000);if(!reason)throw new Error('REPORT_REASON_REQUIRED');return db.insert('socialReports',{spaceId,reporterUserId:userId,resourceType,resourceId,reason,status:'open'})}


export async function listGlobalDmInbox(db:DatabaseAdapter,userId:string){
  const memberships=await db.find('socialConversationMembers',x=>x.userId===userId);
  const ids=new Set(memberships.map(x=>x.conversationId));
  const conversations=(await db.find('socialConversations',x=>ids.has(x.id))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const [messages,spaces,users,allMembers,privacy,followers]=await Promise.all([
    db.find('socialMessages',x=>ids.has(x.conversationId)),
    db.find('spaces',()=>true),
    db.find('users',()=>true),
    db.find('socialConversationMembers',x=>ids.has(x.conversationId)),
    db.find('spacePrivacySettings',()=>true),
    db.find('spaceFollows',()=>true),
  ]);
  return conversations.map(c=>{
    const mine=memberships.find(m=>m.conversationId===c.id);
    const threadMessages=messages.filter(m=>m.conversationId===c.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    const lastMessage=threadMessages[threadMessages.length-1];
    const participants=allMembers.filter(m=>m.conversationId===c.id&&m.userId!==userId).map(m=>{const u=users.find(x=>x.id===m.userId);return {userId:m.userId,email:u?.email??'Yaposan user',displayName:u?.email?.split('@')[0]??'Yaposan user'};});
    const unreadCount=threadMessages.filter(m=>m.senderUserId!==userId&&(!mine?.lastReadAt||m.createdAt>mine.lastReadAt)).length;
    const space=spaces.find(s=>s.id===c.spaceId);
    const isOwner=space?.ownerUserId===userId;
    const starterFollowsPage=followers.some(f=>f.spaceId===c.spaceId&&f.followerUserId===c.createdByUserId);
    const dmAudience=privacy.find(p=>p.spaceId===c.spaceId)?.dmAudience??'followers';
    const isRequest=Boolean(isOwner&&c.createdByUserId!==userId&&!starterFollowsPage&&dmAudience==='everyone');
    return {...c,space:{id:c.spaceId,name:space?.name??'Page',slug:space?.slug??''},participants,lastMessage,unreadCount,isRequest};
  });
}

export async function markConversationRead(db:DatabaseAdapter,userId:string,conversationId:string){
  const member=(await db.find('socialConversationMembers',x=>x.conversationId===conversationId&&x.userId===userId))[0];
  if(!member)throw new Error('CONVERSATION_ACCESS_DENIED');
  return db.update('socialConversationMembers',member.id,{lastReadAt:new Date().toISOString()});
}

import type { DatabaseAdapter, SpacePostRecord } from './database';
import { canAccessSpace } from './spaces';

export const NEW_POST_AUDIENCES = new Set(['private','followers','specific','public']);

export function normalizePostAudience(value:unknown):SpacePostRecord['visibility']{
  const v=String(value??'private');
  if(v==='friends') return 'followers'; // legacy records migrate to follower visibility
  if(NEW_POST_AUDIENCES.has(v)||v==='team'||v==='unlisted') return v as SpacePostRecord['visibility'];
  return 'private';
}

export async function isFollowingSpace(db:DatabaseAdapter,userId:string,spaceId:string){
  return Boolean((await db.find('spaceFollows',x=>x.spaceId===spaceId&&x.followerUserId===userId))[0]);
}

export async function canViewPost(db:DatabaseAdapter,userId:string,post:SpacePostRecord){
  if(userId===post.authorUserId)return true;
  switch(post.visibility){
    case 'public': return true;
    case 'followers': return isFollowingSpace(db,userId,post.spaceId);
    case 'friends': return isFollowingSpace(db,userId,post.spaceId); // legacy compatibility
    case 'specific': return Boolean(post.audienceUserIds?.includes(userId));
    case 'team': return canAccessSpace(db,userId,post.spaceId,'viewer');
    case 'unlisted': return true; // backward compatibility for older unlisted posts
    default: return canAccessSpace(db,userId,post.spaceId,'admin');
  }
}

export async function sanitizeSpecificAudience(db:DatabaseAdapter,userId:string,idsInput:unknown){
  if(!Array.isArray(idsInput))return [];
  const ids=[...new Set(idsInput.map(String).filter(Boolean))].filter(id=>id!==userId).slice(0,100);
  if(!ids.length)return [];
  const active=await db.find('users',u=>ids.includes(u.id)&&u.status==='active');
  return active.map(u=>u.id);
}

import type { DatabaseAdapter } from './database.ts';
const limit=(name:string,fallback:number)=>Math.max(1,Number(process.env[name]??fallback));
export async function enforceCommunityRateLimits(db:DatabaseAdapter,args:{organizationId?:string;userId?:string;now?:Date}){
 const now=args.now??new Date();const hour=new Date(now.getTime()-3600_000).toISOString();const day=new Date(now.getTime()-86400_000).toISOString();const month=now.toISOString().slice(0,7);
 const rows=await db.find('aiCommunityTransactions',x=>x.kind==='reserve');
 const user=(since:string)=>rows.filter(x=>x.createdAt>=since&&String(x.metadata?.userId??'')===args.userId).length;
 const org=(since:string)=>rows.filter(x=>x.createdAt>=since&&x.organizationId===args.organizationId).length;
 if(args.userId&&user(hour)>=limit('AI_COMMUNITY_USER_REQUESTS_PER_HOUR',20))throw new Error('COMMUNITY_AI_USER_RATE_LIMIT');
 if(args.organizationId&&org(hour)>=limit('AI_COMMUNITY_ORG_REQUESTS_PER_HOUR',100))throw new Error('COMMUNITY_AI_ORG_RATE_LIMIT');
 if(args.userId&&user(day)>=limit('AI_COMMUNITY_USER_REQUESTS_PER_DAY',50))throw new Error('COMMUNITY_AI_USER_DAILY_LIMIT');
 if(args.organizationId&&org(day)>=limit('AI_COMMUNITY_ORG_REQUESTS_PER_DAY',250))throw new Error('COMMUNITY_AI_ORG_DAILY_LIMIT');
 const monthRows=rows.filter(x=>x.month===month);if(args.organizationId&&monthRows.filter(x=>x.organizationId===args.organizationId).length>=limit('AI_COMMUNITY_ORG_REQUESTS_PER_MONTH',2000))throw new Error('COMMUNITY_AI_ORG_MONTHLY_LIMIT');
}

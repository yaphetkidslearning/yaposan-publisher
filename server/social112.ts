import type { DatabaseAdapter } from './database';
import { requireSpaceAccess } from './spaces';
import { runAiGateway } from './aiPlatform';

const slug=(v:string)=>v.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'ai';
const clean=(v:unknown,n:number)=>String(v??'').trim().slice(0,n);

export async function createAiSocialProfile(db:DatabaseAdapter,userId:string,spaceId:string,input:{agentId:string;displayName?:string;handle?:string;bio?:string}){
 await requireSpaceAccess(db,userId,spaceId,'editor');
 const agent=await db.get('spaceAIAgents',input.agentId);if(!agent||agent.spaceId!==spaceId)throw new Error('AI_AGENT_NOT_FOUND');
 const existing=(await db.find('socialAiProfiles',x=>x.agentId===agent.id))[0];if(existing)return existing;
 const displayName=clean(input.displayName||agent.name,80)||agent.name;const handleBase=slug(input.handle||displayName);
 const taken=await db.find('socialAiProfiles',x=>x.handle===handleBase);const handle=taken.length?`${handleBase}-${agent.id.slice(0,6)}`:handleBase;
 return db.insert('socialAiProfiles',{spaceId,agentId:agent.id,ownerUserId:userId,displayName,handle,bio:clean(input.bio||agent.instructions,1000)||undefined,identityType:'ai',disclosure:'AI agent',autonomousPosting:false,status:'active'});
}

export async function listAiSocialProfiles(db:DatabaseAdapter){
 const profiles=await db.find('socialAiProfiles',x=>x.status==='active');const agents=await db.find('spaceAIAgents',x=>x.enabled&&['public','unlisted'].includes(x.visibility));
 const allowed=new Set(agents.map(a=>a.id));return profiles.filter(p=>allowed.has(p.agentId)).slice(0,100);
}

export async function socialAiAssist(db:DatabaseAdapter,userId:string,input:{spaceId:string;kind?:string;prompt?:string;sourceText?:string;agentId?:string;language?:string;accessMode?:string}){
 const space=await requireSpaceAccess(db,userId,input.spaceId,'viewer');const org=await db.get('organizations',space.organizationId);if(!org)throw new Error('ORGANIZATION_NOT_FOUND');
 const kind=(['ask','caption','reply','translate','summary','search'].includes(String(input.kind))?input.kind:'ask') as 'ask'|'caption'|'reply'|'translate'|'summary'|'search';
 let agentName='Yaposan AI';let instructions='Be helpful, concise, safe, and never claim to be human.';
 if(input.agentId){const agent=await db.get('spaceAIAgents',input.agentId);if(!agent||agent.spaceId!==space.id||!agent.enabled)throw new Error('AI_AGENT_NOT_FOUND');agentName=agent.name;instructions=agent.instructions||instructions;}
 const source=clean(input.sourceText,12000);const prompt=clean(input.prompt,6000);const target=clean(input.language,80);
 const task=kind==='translate'?'translate':'write';
 const instructionByKind={ask:'Answer the user using only appropriate public/social context.',caption:'Create a social-media caption with optional hashtags. Do not fabricate claims.',reply:'Draft a respectful social-media reply.',translate:`Translate the supplied social content${target?` to ${target}`:''}. Preserve meaning and tone.`,summary:'Summarize the supplied social content clearly.',search:'Turn the request into concise search concepts and synonyms.'}[kind];
 const fullPrompt=`You are ${agentName}, an AI identity on Yaposan. You must disclose that you are AI when speaking as the agent. ${instructions}\nTask: ${instructionByKind}\nUser request: ${prompt}\nSource content: ${source}`;
 const result=await runAiGateway(db,{organizationId:space.organizationId,userId,plan:org.plan,task,prompt:fullPrompt,maxTokens:700,accessMode:input.accessMode==='credits'?'credits':input.accessMode==='provider'?'provider':'community'});
 const output=typeof result.output==='string'?result.output:JSON.stringify(result.output);
 const row=await db.insert('socialAiGenerations',{spaceId:space.id,userId,agentId:input.agentId,kind,prompt,sourceText:source||undefined,output:output.slice(0,20000),provider:result.provider,model:result.model,aiGenerated:true,status:'completed'});
 return {generation:row,usage:result.usage};
}

export async function aiSocialSearch(db:DatabaseAdapter,userId:string,qInput:string){
 const q=clean(qInput,120).toLowerCase();if(!q)return {profiles:[],posts:[]};const tokens=[...new Set(q.split(/[^a-z0-9]+/).filter(x=>x.length>1))].slice(0,12);
 const profiles=await listAiSocialProfiles(db);const rankedProfiles=profiles.map(p=>({item:p,score:tokens.reduce((n,t)=>n+(p.displayName.toLowerCase().includes(t)?3:0)+(p.handle.includes(t)?3:0)+((p.bio||'').toLowerCase().includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,20).map(x=>x.item);
 const posts=await db.find('spacePosts',p=>p.visibility==='public');const blocks=await db.find('socialBlocks',b=>b.userId===userId||b.targetUserId===userId);const blocked=new Set(blocks.flatMap(b=>[b.userId,b.targetUserId]).filter(id=>id!==userId));
 const rankedPosts=posts.filter(p=>!blocked.has(p.authorUserId)).map(p=>({item:p,score:tokens.reduce((n,t)=>n+(p.body.toLowerCase().includes(t)?2:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.item.createdAt.localeCompare(a.item.createdAt)).slice(0,40).map(x=>x.item);
 return {profiles:rankedProfiles,posts:rankedPosts};
}

export async function aiSocialRecommendations(db:DatabaseAdapter,userId:string){
 const [posts,reactions,bookmarks,reposts,blocks]=await Promise.all([db.find('spacePosts',p=>p.visibility==='public'),db.find('spacePostReactions',()=>true),db.find('spacePostBookmarks',()=>true),db.find('spacePostReposts',()=>true),db.find('socialBlocks',b=>b.userId===userId||b.targetUserId===userId)]);const blocked=new Set(blocks.flatMap(b=>[b.userId,b.targetUserId]).filter(id=>id!==userId));
 return posts.filter(p=>!blocked.has(p.authorUserId)).map(p=>({post:p,score:reactions.filter(r=>r.postId===p.id).length+2*bookmarks.filter(b=>b.postId===p.id).length+3*reposts.filter(r=>r.postId===p.id).length})).sort((a,b)=>b.score-a.score||b.post.createdAt.localeCompare(a.post.createdAt)).slice(0,50);
}

export async function labelAiGeneratedPost(db:DatabaseAdapter,userId:string,spaceId:string,postId:string,input:{agentId?:string;disclosure?:string}){
 await requireSpaceAccess(db,userId,spaceId,'editor');const post=await db.get('spacePosts',postId);if(!post||post.spaceId!==spaceId)throw new Error('POST_NOT_FOUND');
 if(input.agentId){const agent=await db.get('spaceAIAgents',input.agentId);if(!agent||agent.spaceId!==spaceId)throw new Error('AI_AGENT_NOT_FOUND');}
 return db.update('spacePosts',postId,{aiGenerated:true,aiAgentId:input.agentId,aiDisclosure:clean(input.disclosure,160)||'AI-generated content'});
}

export async function createAiModerationSuggestion(db:DatabaseAdapter,userId:string,spaceId:string,input:{resourceType?:string;resourceId:string;text?:string}){
 await requireSpaceAccess(db,userId,spaceId,'admin');const text=clean(input.text,10000);const indicators:string[]=[];if(/\b(send|wire|transfer)\b.{0,40}\b(money|cash|crypto|bitcoin)\b/i.test(text))indicators.push('possible_scam');if(/\b(password|passcode|verification code|seed phrase)\b/i.test(text))indicators.push('credential_request');if(/https?:\/\/[^\s]+/i.test(text))indicators.push('external_link');if(/\b(kill|hurt|attack|threat)\b/i.test(text))indicators.push('possible_threat');
 const risk=indicators.length>=3?'high':indicators.length>=1?'medium':'low';return db.insert('socialAiModerationSuggestions',{spaceId,reviewerUserId:userId,resourceType:clean(input.resourceType,40)||'post',resourceId:clean(input.resourceId,200),risk,indicators,status:'suggested',humanDecision:undefined});
}

import type { DatabaseAdapter } from "./database";
import { providerCostMicros } from './aiPricing.ts';
import { enforceCommunityRateLimits } from './aiRateLimits.ts';

export type AIAccessMode = "community" | "credits" | "provider";
const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);
const budgetMicros = () => Math.max(0, Math.round(Number(process.env.AI_COMMUNITY_MONTHLY_BUDGET_USD ?? "50") * 1_000_000));

export function estimateProviderCostMicros(inputTokens:number, outputTokens:number, provider?:string, model?:string){return providerCostMicros(inputTokens,outputTokens,provider,model)}
export async function communityBudgetStatus(db:DatabaseAdapter, date=new Date()){
  const month=monthKey(date); const rows=await db.find("aiCommunityTransactions",x=>x.month===month);
  const usedMicros=rows.reduce((n,x)=>n+x.amountMicros,0); const limitMicros=budgetMicros();
  return {month,limitMicros,usedMicros,remainingMicros:Math.max(0,limitMicros-usedMicros),available:usedMicros<limitMicros};
}
export async function reserveCommunityBudget(db:DatabaseAdapter,args:{requestId:string;organizationId?:string;userId?:string;estimatedMicros:number;metadata?:Record<string,unknown>}){
  const amount=Math.max(1,Math.ceil(args.estimatedMicros));
  return db.transaction(async tx=>{
    await tx.lock?.(`community-budget:${monthKey()}`);
    await enforceCommunityRateLimits(tx,{organizationId:args.organizationId,userId:args.userId});
    const duplicate=(await tx.find('aiCommunityTransactions',x=>x.requestId===args.requestId&&x.kind==='reserve'))[0];if(duplicate)return {...await communityBudgetStatus(tx),reservedMicros:duplicate.amountMicros};
    const status=await communityBudgetStatus(tx);if(status.usedMicros+amount>status.limitMicros)throw new Error("COMMUNITY_AI_BUDGET_EXHAUSTED");
    await tx.insert("aiCommunityTransactions",{organizationId:args.organizationId,month:status.month,requestId:args.requestId,amountMicros:amount,kind:"reserve",metadata:{...args.metadata,userId:args.userId}});
    return {...status,remainingMicros:status.remainingMicros-amount,reservedMicros:amount};
  });
}
export async function settleCommunityBudget(db:DatabaseAdapter,requestId:string,actualMicros:number){
  return db.transaction(async tx=>{
    const rows=await tx.find("aiCommunityTransactions",x=>x.requestId===requestId);const first=rows[0];if(!first)throw new Error('COMMUNITY_AI_RESERVATION_NOT_FOUND');
    await tx.lock?.(`community-budget:${first.month}`);
    if(rows.some(x=>x.metadata?.settlement===true))return rows.reduce((n,x)=>n+x.amountMicros,0);
    const reserved=Math.max(0,rows.filter(x=>x.kind==='reserve').reduce((n,x)=>n+x.amountMicros,0));const actual=Math.max(0,Math.ceil(actualMicros));
    const charged=Math.min(actual,reserved);const delta=charged-reserved;
    await tx.insert("aiCommunityTransactions",{organizationId:first.organizationId,month:first.month,requestId,amountMicros:delta,kind:charged===0?"release":"settle",metadata:{settlement:true,actualMicros:actual,chargedMicros:charged,overageMicros:Math.max(0,actual-reserved)}});
    return charged;
  });
}

const base=(globalThis as any).process?.env?.EXPO_PUBLIC_API_URL??"http://localhost:4100";
let token=""; export const configurePaymentService=(accessToken:string)=>{token=accessToken};
async function post<T>(path:string,body:unknown){const r=await fetch(`${base}${path}`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data?.error?.message??"Payment request failed");return data as T}
export const createSubscriptionCheckout=(args:{customerId:string;priceId:string;successUrl:string;cancelUrl:string;quantity?:number})=>post<{url:string;id:string}>("/api/v1/billing/checkout",args);
export const openBillingPortal=(customerId:string,returnUrl:string)=>post<{url:string}>("/api/v1/billing/portal",{customerId,returnUrl});
export const PLAN_LIMITS={free:{seats:1,storageGb:1,aiCredits:25},pro:{seats:1,storageGb:50,aiCredits:1000},business:{seats:25,storageGb:500,aiCredits:10000},enterprise:{seats:Number.MAX_SAFE_INTEGER,storageGb:Number.MAX_SAFE_INTEGER,aiCredits:Number.MAX_SAFE_INTEGER}} as const;
export function canConsume(plan:keyof typeof PLAN_LIMITS,current:number,amount:number,kind:"seats"|"storageGb"|"aiCredits"){return current+amount<=PLAN_LIMITS[plan][kind]}

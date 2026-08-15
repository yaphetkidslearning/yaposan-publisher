import { isIP } from "node:net";
import { promises as dns } from "node:dns";
import http from "node:http";
import https from "node:https";

function ipv4Parts(value:string){const parts=value.split('.').map(Number);return parts.length===4&&parts.every(x=>Number.isInteger(x)&&x>=0&&x<=255)?parts:null}
export function isForbiddenProviderIp(value:string){
  const version=isIP(value);
  if(version===4){
    const p=ipv4Parts(value);if(!p)return true;const [a,b]=p;
    return a===0||a===10||a===127||a>=224||a>=240||
      (a===100&&b>=64&&b<=127)||
      (a===169&&b===254)||
      (a===172&&b>=16&&b<=31)||
      (a===192&&b===0)||(a===192&&b===168)||(a===192&&b===18)||(a===192&&b===19)||(a===192&&b===88)||
      (a===198&&b>=18&&b<=19)||(a===198&&b===51)||(a===203&&b===0);
  }
  if(version===6){const v=value.toLowerCase();return v==='::'||v==='::1'||v.startsWith('fe8')||v.startsWith('fe9')||v.startsWith('fea')||v.startsWith('feb')||v.startsWith('fc')||v.startsWith('fd')||v.startsWith('ff')||v.startsWith('2001:db8:');}
  return true;
}
async function resolvePinned(host:string){
  if(isIP(host)){if(isForbiddenProviderIp(host))throw new Error('AI_PROVIDER_ENDPOINT_PRIVATE_NETWORK_FORBIDDEN');return {address:host,family:isIP(host) as 4|6};}
  const addresses=await dns.lookup(host,{all:true,verbatim:true});if(!addresses.length)throw new Error('AI_PROVIDER_ENDPOINT_DNS_FAILED');
  if(addresses.some(x=>isForbiddenProviderIp(x.address)))throw new Error('AI_PROVIDER_ENDPOINT_PRIVATE_NETWORK_FORBIDDEN');
  const first=addresses[0];return {address:first.address,family:first.family as 4|6};
}
export async function assertSafeProviderEndpoint(provider:string,raw:string,options:{resolveDns?:boolean}={}){
  let url:URL;try{url=new URL(raw)}catch{throw new Error('AI_PROVIDER_ENDPOINT_INVALID')}
  if(url.username||url.password)throw new Error('AI_PROVIDER_ENDPOINT_CREDENTIALS_FORBIDDEN');
  const local=['ollama','lmstudio'].includes(provider.toLowerCase());
  if(local){if(url.protocol!=='http:'&&url.protocol!=='https:')throw new Error('AI_PROVIDER_ENDPOINT_PROTOCOL_FORBIDDEN');const host=url.hostname.toLowerCase();if(!['localhost','127.0.0.1','::1'].includes(host))throw new Error('AI_LOCAL_PROVIDER_MUST_USE_LOOPBACK');return url;}
  if(url.protocol!=='https:')throw new Error('AI_PROVIDER_ENDPOINT_HTTPS_REQUIRED');
  const host=url.hostname.toLowerCase();if(host==='localhost'||host.endsWith('.localhost'))throw new Error('AI_PROVIDER_ENDPOINT_PRIVATE_NETWORK_FORBIDDEN');
  if(isIP(host)&&isForbiddenProviderIp(host))throw new Error('AI_PROVIDER_ENDPOINT_PRIVATE_NETWORK_FORBIDDEN');
  if(options.resolveDns!==false)await resolvePinned(host);return url;
}

type LimitedFetchOptions={provider:string;timeoutMs?:number;maxBytes?:number;maxRedirects?:number};
function headersObject(headers:HeadersInit|undefined){const out:Record<string,string>={};if(!headers)return out;if(headers instanceof Headers)headers.forEach((v,k)=>out[k]=v);else if(Array.isArray(headers))for(const [k,v] of headers)out[String(k)]=String(v);else for(const [k,v] of Object.entries(headers))out[k]=String(v);return out}
async function requestPinned(url:URL,init:RequestInit,provider:string,timeoutMs:number,maxBytes:number):Promise<{response:Response;data:any}> {
  const local=['ollama','lmstudio'].includes(provider.toLowerCase());
  const pin=local?{address:url.hostname==='localhost'?'127.0.0.1':url.hostname,family:(url.hostname.includes(':')?6:4) as 4|6}:await resolvePinned(url.hostname);
  const method=init.method??'GET';const headers=headersObject(init.headers);const body=typeof init.body==='string'||Buffer.isBuffer(init.body)?init.body:undefined;
  return await new Promise((resolve,reject)=>{
    let settled=false;const lib=url.protocol==='https:'?https:http;const req=lib.request({protocol:url.protocol,hostname:url.hostname,port:url.port||undefined,path:`${url.pathname}${url.search}`,method,headers,servername:url.protocol==='https:'?url.hostname:undefined,lookup:(_hostname,_opts,cb:any)=>cb(null,pin.address,pin.family)},res=>{
      const chunks:Buffer[]=[];let total=0;const contentLength=Number(res.headers['content-length']??0);if(contentLength>maxBytes){req.destroy(new Error('AI_PROVIDER_RESPONSE_TOO_LARGE'));return}
      res.on('data',(chunk:Buffer)=>{total+=chunk.length;if(total>maxBytes){req.destroy(new Error('AI_PROVIDER_RESPONSE_TOO_LARGE'));return}chunks.push(Buffer.from(chunk))});
      res.on('end',()=>{if(settled)return;settled=true;const buffer=Buffer.concat(chunks);const response=new Response(buffer,{status:res.statusCode??500,headers:Object.fromEntries(Object.entries(res.headers).filter(([,v])=>v!==undefined).map(([k,v])=>[k,Array.isArray(v)?v.join(', '):String(v)]))});let data:any=null;if(buffer.length){try{data=JSON.parse(buffer.toString('utf8'))}catch{reject(new Error('AI_PROVIDER_INVALID_JSON'));return}}resolve({response,data})});
    });
    req.setTimeout(timeoutMs,()=>req.destroy(new Error('AI_PROVIDER_TIMEOUT')));req.on('error',error=>{if(!settled){settled=true;reject(error)}});
    const signal=init.signal;if(signal){if(signal.aborted){req.destroy(signal.reason instanceof Error?signal.reason:new Error('AI_PROVIDER_ABORTED'));return}signal.addEventListener('abort',()=>req.destroy(signal.reason instanceof Error?signal.reason:new Error('AI_PROVIDER_ABORTED')),{once:true})}
    if(body!==undefined)req.write(body);req.end();
  });
}
export async function fetchJsonLimited(rawUrl:string,init:RequestInit={},options:LimitedFetchOptions):Promise<{response:Response;data:any}> {
  const timeoutMs=Math.max(1000,Math.min(120000,options.timeoutMs??Number(process.env.AI_PROVIDER_TIMEOUT_MS??30000)));
  const maxBytes=Math.max(1024,Math.min(10*1024*1024,options.maxBytes??Number(process.env.AI_PROVIDER_MAX_RESPONSE_BYTES??1048576)));
  const maxRedirects=Math.max(0,Math.min(5,options.maxRedirects??2));
  let current:URL;
  try{current=new URL(rawUrl)}catch{throw new Error('AI_PROVIDER_ENDPOINT_INVALID')}
  const origin=current.origin;
  for(let redirects=0;;redirects++){
    await assertSafeProviderEndpoint(options.provider,current.toString());const result=await requestPinned(current,init,options.provider,timeoutMs,maxBytes);
    if(![301,302,303,307,308].includes(result.response.status))return result;
    if(redirects>=maxRedirects)throw new Error('AI_PROVIDER_TOO_MANY_REDIRECTS');const location=result.response.headers.get('location');if(!location)throw new Error('AI_PROVIDER_REDIRECT_LOCATION_MISSING');
    const next=new URL(location,current);await assertSafeProviderEndpoint(options.provider,next.toString());if(next.origin!==origin)throw new Error('AI_PROVIDER_CROSS_ORIGIN_REDIRECT_FORBIDDEN');current=next;
  }
}

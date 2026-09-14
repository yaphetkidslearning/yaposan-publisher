import { createPublicKey, verify as verifySignature, type JsonWebKey } from "node:crypto";

export type OidcConfig={issuer?:string;clientId?:string;audience?:string;clockSkewSeconds?:number};
type Discovery={issuer:string;jwks_uri:string;authorization_endpoint?:string;token_endpoint?:string};
type Jwk={kid?:string;kty:string;alg?:string;use?:string;n?:string;e?:string;crv?:string;x?:string;y?:string};
type JwtPayload={sub:string;iss:string;aud?:string|string[];exp:number;iat?:number;email?:string;email_verified?:boolean;sid?:string;amr?:string[];acr?:string;[key:string]:unknown};
const discoveryCache=new Map<string,{value:Discovery;expires:number}>();const jwksCache=new Map<string,{value:Jwk[];expires:number}>();
const decodeJson=<T>(part:string)=>JSON.parse(Buffer.from(part,"base64url").toString("utf8")) as T;
const audienceMatches=(aud:string|string[]|undefined,expected:string)=>Array.isArray(aud)?aud.includes(expected):aud===expected;
async function discovery(issuer:string){const key=issuer.replace(/\/$/,"");const cached=discoveryCache.get(key);if(cached&&cached.expires>Date.now())return cached.value;const r=await fetch(`${key}/.well-known/openid-configuration`,{headers:{accept:"application/json"}});if(!r.ok)throw new Error("OIDC_DISCOVERY_FAILED");const value=await r.json() as Discovery;if(value.issuer.replace(/\/$/,"")!==key||!value.jwks_uri)throw new Error("OIDC_DISCOVERY_INVALID");discoveryCache.set(key,{value,expires:Date.now()+300_000});return value}
async function keys(uri:string){const cached=jwksCache.get(uri);if(cached&&cached.expires>Date.now())return cached.value;const r=await fetch(uri,{headers:{accept:"application/json"}});if(!r.ok)throw new Error("OIDC_JWKS_FAILED");const body=await r.json() as {keys?:Jwk[]};const value=Array.isArray(body.keys)?body.keys:[];jwksCache.set(uri,{value,expires:Date.now()+300_000});return value}
export async function verifyOidcBearer(token:string|undefined,config:OidcConfig){
 if(!token||!config.issuer||!config.clientId)return undefined;const raw=token.replace(/^Bearer\s+/i,"");const parts=raw.split(".");if(parts.length!==3)return undefined;
 let header:{alg?:string;kid?:string},payload:JwtPayload;try{header=decodeJson(parts[0]);payload=decodeJson(parts[1])}catch{return undefined}
 if(!header.kid||header.alg!=="RS256"||!payload.sub||!payload.exp||!payload.iss)return undefined;const issuer=config.issuer.replace(/\/$/,"");if(payload.iss.replace(/\/$/,"")!==issuer)return undefined;
 const skew=(config.clockSkewSeconds??60)*1000;if(payload.exp*1000<Date.now()-skew)return undefined;const expectedAud=config.audience??config.clientId;if(!audienceMatches(payload.aud,expectedAud))return undefined;
 try{const meta=await discovery(issuer);const jwk=(await keys(meta.jwks_uri)).find(k=>k.kid===header.kid&&k.kty==="RSA");if(!jwk)return undefined;const publicKey=createPublicKey({key:jwk as JsonWebKey,format:"jwk"});const ok=verifySignature("RSA-SHA256",Buffer.from(`${parts[0]}.${parts[1]}`),publicKey,Buffer.from(parts[2],"base64url"));return ok?payload:undefined}catch{return undefined}
}
export async function oidcClientMetadata(config:OidcConfig){if(!config.issuer||!config.clientId)return {enabled:false};try{const meta=await discovery(config.issuer.replace(/\/$/,""));return {enabled:true,issuer:meta.issuer,clientId:config.clientId,authorizationEndpoint:meta.authorization_endpoint,pkceRequired:true,passkeysSupportedByProvider:true}}catch{return {enabled:true,issuer:config.issuer,clientId:config.clientId,pkceRequired:true,discoveryAvailable:false}}}

const explicit=(process.env.EXPO_PUBLIC_API_URL??'').trim().replace(/\/$/,'');
const localHost=typeof window!=='undefined'&&['localhost','127.0.0.1'].includes(window.location.hostname);
export const API_URL=explicit||(localHost?'http://localhost:4100':'https://api.yaposan.com');
export const API_EXPLICIT=Boolean(explicit);
export const apiReachabilityMessage=(path:string,error?:unknown)=>`Cannot reach the Yaposan API for ${path}. API target: ${API_URL}. ${localHost?'Run npm run web to start the API and Expo together, or npm run server in another terminal.':'Check EXPO_PUBLIC_API_URL, DNS/reverse proxy, and API availability.'}${error instanceof Error&&error.message?` (${error.message})`:''}`;

export async function readApiError(response:Response,fallback:string){try{const body=await response.json();return String(body?.error?.message??fallback)}catch{return fallback}}

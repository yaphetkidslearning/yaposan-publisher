import { readFile } from "node:fs/promises";
export async function readLocalDevToken(){
 const path=String(process.env.YAPOSAN_LOCAL_DEV_TOKEN_PATH??".yaposan/local-dev-token").trim()||".yaposan/local-dev-token";
 const token=(await readFile(path,"utf8")).trim();
 if(!/^[a-f0-9]{64}$/i.test(token))throw new Error(`Invalid or missing Yaposan local development token at ${path}. Start the API with npm run web first.`);
 return token;
}

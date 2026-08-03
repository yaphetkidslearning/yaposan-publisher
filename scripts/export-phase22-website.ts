import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PublisherProject } from "../src/types/publisher";
import { createFullFidelityWebsiteZip } from "../src/utils/fullFidelityWebRuntimeEngine";
async function main(){const input=process.argv[2],output=process.argv[3]||"yaposan-website.zip";if(!input)throw new Error("Usage: npm run export:phase22 -- project.json website.zip");const project=JSON.parse(await readFile(resolve(input),"utf8")) as PublisherProject;const bytes=await createFullFidelityWebsiteZip(project);await writeFile(resolve(output),bytes);console.log(`Phase 22.7 website exported: ${resolve(output)}`);}main().catch(error=>{console.error(error);process.exitCode=1;});

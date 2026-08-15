import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

test("91.12 persists creation projects and passes ids into studios",()=>{
 const ai=read("src/app/ai.tsx"), store=read("src/services/creationProjectStore.ts");
 assert.match(ai,/saveCreationProject\(next\.project\)/);
 assert.match(ai,/creationProject=/);
 assert.match(store,/AsyncStorage\.setItem/);
 assert.match(store,/schemaVersion:\s*"91\.12"/);
});

test("91.12 publisher, web and presentation consume real creation payloads",()=>{
 const editor=read("src/app/editor.tsx"), web=read("src/app/web-studio.tsx"), presentation=read("src/app/presentation-studio.tsx"), adapters=read("src/services/phase9112StudioAdapters.ts");
 assert.match(editor,/creationToPublisherProject/);
 assert.match(web,/creationToWebProject/);
 assert.match(presentation,/creationToPresentation/);
 assert.match(adapters,/PublisherProject/);
 assert.match(adapters,/WebProject/);
});

test("91.12 uses dedicated media provider runtime",()=>{
 const server=read("server/index.ts"), media=read("server/mediaGeneration.ts"), ai=read("src/app/ai.tsx");
 assert.match(server,/\/api\/v1\/ai\/media\/generate/);
 assert.match(server,/mediaJobMatch/);
 assert.match(media,/AI_\$\{kind\.toUpperCase\(\)\}_PROVIDER/);
 assert.match(media,/getMediaJob/);
 assert.match(media,/cancelMediaJob/);
 assert.match(ai,/\/api\/v1\/ai\/media\/generate/);
});

test("91.12 app and agent projects are persistent",()=>{
 assert.match(read("src/services/phase9112AgentStore.ts"),/saveAgent/);
 assert.match(read("src/services/phase9112AppStore.ts"),/saveAppProject/);
 assert.match(read("src/app/agent-studio.tsx"),/Save agent & open Automation Center/);
 assert.match(read("src/app/app-studio.tsx"),/Save runnable app specification/);
});

test("91.11 server repairs remain intact",()=>{
 const server=read("server/index.ts"), worker=read("server/productPhotoBatchWorker.ts");
 assert.equal((server.match(/\/api\/v1\/internal\/product-photo\/process-next/g)||[]).length,1);
 assert.match(worker,/async function main\s*\(/);
 assert.match(worker,/main\(\)\.catch/);
});

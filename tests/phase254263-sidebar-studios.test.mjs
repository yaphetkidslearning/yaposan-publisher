import fs from "node:fs";
import assert from "node:assert/strict";
const home=fs.readFileSync("src/app/index.tsx","utf8");
const expected=["Home","Publisher","Photo Studio","Video Studio","Animation Studio","Yaposan AI","My Projects","Templates","Brand Kit","Marketplace","Automations","Team Workspace","Learning Center","Settings"];
let last=-1; for(const label of expected){const pos=home.indexOf(`label: "${label}"`); assert.ok(pos>last,`${label} is missing or out of order`); last=pos;}
for(const file of ["src/app/video-studio.tsx","src/app/animation-studio.tsx"]){assert.ok(fs.existsSync(file),`${file} missing`); const text=fs.readFileSync(file,"utf8"); assert.match(text,/Studio foundation ready/);}
console.log("Phase 25.42.6.3 sidebar and studio route validation passed.");

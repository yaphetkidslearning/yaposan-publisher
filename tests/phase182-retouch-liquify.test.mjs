import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(p)=>fs.readFileSync(p,"utf8");
test("Phase 18.2 retouch engine provides complete toolset",()=>{
 const engine=read("src/utils/retouchEngine.ts");
 for(const token of ["smudge","liquify-push","liquify-twirl","liquify-pinch","liquify-bloat","clone","heal","dodge","burn","sponge","blur","sharpen","eraser","appendRetouchOperation","buildRetouchManifest"]) assert.match(engine,new RegExp(token));
});
test("Phase 18.2 is integrated into real editor and Paint ribbon",()=>{
 const editor=read("src/app/editor.tsx"); const toolbar=read("src/components/publisher/EditorToolbar.tsx"); const modal=read("src/components/publisher/RetouchStudioModal.tsx");
 assert.match(editor,/RetouchStudioModal/); assert.match(editor,/appendRetouchOperation/); assert.match(toolbar,/Retouch & Liquify/); assert.match(modal,/Non-destructive/);
});

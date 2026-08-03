import test from "node:test";
import assert from "node:assert/strict";
import { applyRenderEffects, certifyRenderPlan, createRenderPlan, diffRenderPlans } from "../src/utils/professionalRenderingEngine";

const element:any={id:"shape-1",name:"Shape",type:"shape",x:10,y:20,width:200,height:100,rotation:15,opacity:1,visible:true,locked:false,zIndex:1,fillColor:"#f00"};
const page:any={id:"page-1",name:"Page",width:816,height:1056,elements:[element]};

test("Phase 58 creates deterministic render plans",()=>{const a=createRenderPlan(page,{quality:"press",pixelRatio:2});const b=createRenderPlan(page,{quality:"press",pixelRatio:2});assert.equal(a.fingerprint,b.fingerprint);assert.equal(a.commands.length,1);assert.ok(a.tiles.length>1);assert.equal(certifyRenderPlan(a).valid,true);});
test("Phase 58 supports effects and incremental plan diffs",()=>{const updated={...page,elements:[applyRenderEffects(element,[{type:"blur",radius:12}])]};const diff=diffRenderPlans(createRenderPlan(page),createRenderPlan(updated));assert.deepEqual(diff.changed,["shape-1"]);assert.equal(diff.fullRedraw,false);});

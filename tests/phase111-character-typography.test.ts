import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherElement } from "../src/types/publisher";
import { applyCharacterPreset, CHARACTER_STYLE_PRESETS, normalizeCharacterTypography, variableAxis } from "../src/utils/characterTypography";

const base: PublisherElement = { id:"t1",name:"Text",type:"text",x:0,y:0,width:200,height:80,rotation:0,zIndex:1,opacity:1,text:"Hello" };
test("normalizes advanced character typography",()=>{const value=normalizeCharacterTypography({...base,tracking:999,baselineShift:-999});assert.equal(value.tracking,50);assert.equal(value.letterSpacing,50);assert.equal(value.baselineShift,-100);assert.equal(value.ligatures,true);});
test("applies professional character style presets",()=>{const value=applyCharacterPreset(base,"headline");assert.equal(value.characterStyleId,"headline");assert.equal(value.fontWeight,"800");assert.equal(value.ligatures,true);});
test("includes body, headline, caption and code presets",()=>{for(const id of ["body","headline","caption","code"])assert.ok(CHARACTER_STYLE_PRESETS.some(p=>p.id===id));});
test("reads variable font axes with fallback",()=>{assert.equal(variableAxis({...base,variableFontAxes:{wght:650}},"wght",400),650);assert.equal(variableAxis(base,"wdth",100),100);});

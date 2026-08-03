import test from "node:test";
import assert from "node:assert/strict";
import type { PublisherProject } from "../src/types/publisher";
import { createDigitalEditorRuntimeManifest, normalizeDigitalPublishingEditorIntegration, updateDigitalPublishingEditorState } from "../src/utils/digitalPublishingEditorIntegrationEngine";
const project: PublisherProject={id:"p",name:"Web Project",createdAt:1,updatedAt:1,activePageId:"home",autoSave:true,version:2,pages:[{id:"home",name:"Home",width:816,height:1056,orientation:"portrait",sizeKey:"letter",backgroundColor:"#fff",margin:36,bleed:0,elements:[]} ]};
test("migrates Phase 22.4 project into 22.5 editor integration",()=>{const next=normalizeDigitalPublishingEditorIntegration(project);assert.equal(next.phase22Version,"22.5");assert.equal(next.digitalPublishingEditor?.version,"22.5");assert.equal(next.digitalPublishingEditor?.previewPageId,"home");});
test("device and preview state update persists",()=>{const next=updateDigitalPublishingEditorState(project,{deviceMode:"mobile",previewMode:"live"});assert.equal(next.digitalPublishingEditor?.deviceMode,"mobile");assert.equal(next.digitalPublishingEditor?.previewMode,"live");});
test("runtime manifest includes routes and editor capabilities",()=>{const manifest=createDigitalEditorRuntimeManifest(project);assert.equal(manifest.pages[0].route,"/");assert.ok(manifest.capabilities.includes("responsive-canvas"));assert.match(manifest.checksum,/^dei-/);});

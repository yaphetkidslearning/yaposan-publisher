import assert from "node:assert/strict";
import test from "node:test";
import { PANTONE_ESSENTIAL_LIBRARY, applyInkLimit, auditColorWorkflow, buildSeparations, createSpotColor, cmykToRgb, rgbToCmyk, rgbToLab } from "../src/utils/professionalColorManagementEngine";

test("converts RGB, CMYK and LAB colors",()=>{const cmyk=rgbToCmyk({space:"RGB",r:200,g:20,b:40});assert.equal(cmyk.space,"CMYK");assert.equal(cmykToRgb(cmyk).space,"RGB");assert.equal(rgbToLab({space:"RGB",r:255,g:255,b:255}).l>99,true)});
test("limits total ink coverage",()=>{const limited=applyInkLimit({space:"CMYK",c:100,m:100,y:100,k:100},{totalAreaCoverage:300,blackStart:70,blackMaximum:95});assert.equal(limited.c+limited.m+limited.y+limited.k<=300,true)});
test("creates process and spot separation plates",()=>{const spot=createSpotColor(PANTONE_ESSENTIAL_LIBRARY[0]);const plates=buildSeparations([{space:"CMYK",c:10,m:20,y:30,k:40},spot]);assert.equal(plates.length,5);assert.equal(plates.some((plate)=>plate.kind==="spot"),true)});
test("preflight flags missing profiles and excessive ink",()=>{const report=auditColorWorkflow({colors:[{space:"CMYK",c:100,m:100,y:100,k:100}]});assert.equal(report.score<100,true);assert.equal(report.issues.some((issue)=>issue.id==="missing-output-profile"),true)});

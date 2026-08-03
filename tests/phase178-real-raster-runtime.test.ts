import test from "node:test";
import assert from "node:assert/strict";
import { auditRasterRuntime, buildRasterExecutionManifest, buildRasterTiles, configureRasterBrush, configureRasterColorPipeline, configureRasterPerformance, initializeRasterTiles, queueRasterJob } from "../src/utils/professionalRasterRuntime";

const image:any={id:"img",type:"image",imageUri:"file://photo.raw",rasterColorProfile:{workingSpace:"display-p3",renderingIntent:"relative-colorimetric",blackPointCompensation:true,softProof:false,gamutWarning:false,bitDepth:16},rasterRawDevelopment:{enabled:true}};

test("builds tiled render grid",()=>{ const tiles=buildRasterTiles(1200,900,512); assert.equal(tiles.length,6); assert.equal(tiles[5].width,176); });
test("configures performance brush and color",()=>{ let next=configureRasterPerformance(image,{backend:"webgpu",workerCount:8,maxMemoryMB:4096}); next=configureRasterBrush(next,{pressureSize:true,tilt:true,spacing:.05}); next=configureRasterColorPipeline(next,{linearLight:true,floatingPoint:true,iccEnabled:true}); assert.equal(next.rasterRuntime!.performance.backend,"webgpu"); assert.equal(next.rasterRuntime!.brush.tilt,true); });
test("queues cancellable execution job",()=>{ const next=queueRasterJob(image,"raw","Decode camera RAW"); assert.equal(next.rasterRuntime!.jobs.length,1); assert.equal(next.rasterRuntime!.jobs[0].status,"queued"); });
test("initializes tiles and manifest",()=>{ const next=initializeRasterTiles(image,1024,1024); const manifest=buildRasterExecutionManifest(next); assert.equal(manifest.tiles,4); assert.equal(manifest.raw,true); assert.equal(manifest.bitDepth,16); });
test("runtime audit certifies valid setup",()=>{ const next=configureRasterColorPipeline(configureRasterPerformance(image,{gpuAcceleration:true,maxMemoryMB:2048}),{floatingPoint:true,iccEnabled:true}); const issues=auditRasterRuntime(next); assert.equal(issues.some(i=>i.severity==="error"),false); });

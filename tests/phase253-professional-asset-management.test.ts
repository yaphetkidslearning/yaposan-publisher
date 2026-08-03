import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ASSET_LIBRARY, addAssetVersion, auditAssetLibrary, createManagedAsset, detectDuplicateAssets, embedAsset, relinkAsset, searchAssets } from "../src/utils/professionalAssetManagementEngine";

test("creates searchable managed assets", () => {
  const asset=createManagedAsset({name:"Annual Report Cover",kind:"image",tags:["Annual","Report"]});
  assert.equal(searchAssets([asset],"annual",{kind:"image"}).length,1);
});
test("tracks versions and linked/embedded state",()=>{
  const asset=createManagedAsset({name:"Logo",kind:"vector",source:"linked",uri:"logo.svg"});
  const updated=addAssetVersion(asset,{label:"Approved",size:3000});
  assert.equal(updated.versions.length,2);
  assert.equal(embedAsset(relinkAsset(updated,"new-logo.svg")).source,"embedded");
});
test("detects duplicates and audits library",()=>{
  const a=createManagedAsset({name:"A",kind:"image",checksum:"same"});
  const b=createManagedAsset({name:"B",kind:"image",checksum:"same"});
  assert.equal(detectDuplicateAssets([a,b]).length,1);
  const report=auditAssetLibrary({...DEFAULT_ASSET_LIBRARY,assets:[a,b],updatedAt:Date.now()});
  assert.ok(report.score<100);
});

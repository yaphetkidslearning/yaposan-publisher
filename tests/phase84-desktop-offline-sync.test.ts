import assert from "node:assert/strict";
import test from "node:test";
import { applyConflictResolution, chooseDefaultConflictResolution } from "../src/utils/desktopOfflineSyncEngine.ts";

test("newer revisions win desktop synchronization conflicts",()=>{
 assert.equal(chooseDefaultConflictResolution({localRevision:4,remoteRevision:3,localUpdatedAt:10,remoteUpdatedAt:20}),"keep-local");
 assert.equal(chooseDefaultConflictResolution({localRevision:2,remoteRevision:5,localUpdatedAt:30,remoteUpdatedAt:20}),"keep-remote");
});

test("equal revisions use the newest timestamp",()=>{
 assert.equal(chooseDefaultConflictResolution({localRevision:2,remoteRevision:2,localUpdatedAt:30,remoteUpdatedAt:20}),"keep-local");
 assert.equal(chooseDefaultConflictResolution({localRevision:2,remoteRevision:2,localUpdatedAt:10,remoteUpdatedAt:20}),"keep-remote");
});

test("duplicate-local preserves both project copies",()=>{
 const result=applyConflictResolution({projectId:"project-1",localRevision:2,remoteRevision:3,localUpdatedAt:99,remoteUpdatedAt:100,localPayload:{name:"local"},remotePayload:{name:"remote"}},"duplicate-local");
 assert.equal(result.action,"duplicate-local");
 assert.match(result.duplicateId,/project-1-offline-99/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { AI_COMMANDS, DEFAULT_WORKFLOWS, createQueueJob, executeQueueJob, runWorkflow, streamChunks, usageSummary } from "../src/services/aiWorkflowService";

test("queue jobs execute and record usage",async()=>{const job=createQueueJob("rewrite","this is very good text");const done=await executeQueueJob(job);assert.equal(done.job.status,"completed");assert.equal(done.job.progress,100);assert.ok(done.job.result);assert.ok(done.usage.inputTokens>0);});
test("workflow chaining and streaming chunks work",async()=>{const done=await runWorkflow(DEFAULT_WORKFLOWS[0],"this is very good text");assert.ok(done.result.length>0);assert.equal(done.usage.length,2);assert.ok(streamChunks(done.result,2).length>0);});
test("command palette and usage dashboard data are available",()=>{assert.ok(AI_COMMANDS.some(c=>c.action==="translate"));const summary=usageSummary([{id:"u",provider:"local",model:"local",action:"write",inputTokens:10,outputTokens:20,estimatedCost:0,durationMs:5,createdAt:1}]);assert.equal(summary.requests,1);assert.equal(summary.outputTokens,20);});

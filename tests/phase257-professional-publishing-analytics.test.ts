import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE, addPublishingGoal, calculateChannelMetrics, generatePublishingAnalyticsReport, recordPublishingEvent } from "../src/utils/professionalPublishingAnalyticsEngine";

test("calculates per-channel publishing metrics", () => {
  const metric = calculateChannelMetrics(DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE.events, "web");
  assert.equal(metric.views, 428);
  assert.equal(metric.conversions, 31);
  assert.ok(metric.conversionRate > 7);
});

test("records events and applies retention-safe immutable updates", () => {
  const next = recordPublishingEvent(DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE, { projectId: "project-1", channel: "pdf", type: "download", value: 4 });
  assert.equal(next.events.length, DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE.events.length + 1);
  assert.notEqual(next, DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE);
});

test("tracks goals and generates insights", () => {
  const workspace = addPublishingGoal(DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE, { name: "PDF downloads", metric: "downloads", target: 200, channel: "pdf" });
  const report = generatePublishingAnalyticsReport(workspace, "30d");
  assert.equal(report.channels.length, 6);
  assert.ok(report.goals.length >= 4);
  assert.ok(report.insights.length > 0);
  assert.ok(report.score >= 0 && report.score <= 100);
});

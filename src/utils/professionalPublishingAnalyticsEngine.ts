export type AnalyticsChannel = "print" | "pdf" | "web" | "social" | "email" | "marketplace";
export type AnalyticsEventType = "view" | "download" | "share" | "conversion" | "export" | "publish" | "error";
export type AnalyticsRange = "7d" | "30d" | "90d" | "1y";

export type PublishingAnalyticsEvent = {
  id: string;
  projectId: string;
  channel: AnalyticsChannel;
  type: AnalyticsEventType;
  timestamp: number;
  value?: number;
  metadata?: Record<string, string | number | boolean>;
};

export type ChannelMetric = {
  channel: AnalyticsChannel;
  views: number;
  downloads: number;
  shares: number;
  conversions: number;
  exports: number;
  publishes: number;
  errors: number;
  conversionRate: number;
  reliability: number;
};

export type PublishingGoal = {
  id: string;
  name: string;
  metric: "views" | "downloads" | "shares" | "conversions" | "conversionRate" | "reliability";
  target: number;
  channel?: AnalyticsChannel;
};

export type AnalyticsInsight = {
  id: string;
  severity: "positive" | "warning" | "critical" | "info";
  title: string;
  message: string;
  recommendation: string;
};

export type PublishingAnalyticsWorkspace = {
  events: PublishingAnalyticsEvent[];
  goals: PublishingGoal[];
  privacyMode: boolean;
  retentionDays: number;
  anonymousTracking: boolean;
};

export type AnalyticsReport = {
  generatedAt: number;
  range: AnalyticsRange;
  totals: Omit<ChannelMetric, "channel" | "conversionRate" | "reliability"> & { conversionRate: number; reliability: number };
  channels: ChannelMetric[];
  goals: Array<PublishingGoal & { current: number; progress: number; met: boolean }>;
  insights: AnalyticsInsight[];
  score: number;
};

const channels: AnalyticsChannel[] = ["print", "pdf", "web", "social", "email", "marketplace"];
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE: PublishingAnalyticsWorkspace = {
  privacyMode: true,
  anonymousTracking: true,
  retentionDays: 365,
  events: [
    { id: "evt-1", projectId: "demo", channel: "web", type: "view", timestamp: Date.now() - 86400000 * 2, value: 428 },
    { id: "evt-2", projectId: "demo", channel: "web", type: "conversion", timestamp: Date.now() - 86400000 * 2, value: 31 },
    { id: "evt-3", projectId: "demo", channel: "pdf", type: "download", timestamp: Date.now() - 86400000, value: 176 },
    { id: "evt-4", projectId: "demo", channel: "social", type: "share", timestamp: Date.now() - 3600000 * 8, value: 64 },
    { id: "evt-5", projectId: "demo", channel: "email", type: "conversion", timestamp: Date.now() - 3600000 * 3, value: 19 },
    { id: "evt-6", projectId: "demo", channel: "marketplace", type: "error", timestamp: Date.now() - 3600000, value: 2 },
  ],
  goals: [
    { id: "goal-views", name: "Monthly audience", metric: "views", target: 1000 },
    { id: "goal-conversion", name: "Web conversion rate", metric: "conversionRate", target: 5, channel: "web" },
    { id: "goal-reliability", name: "Publishing reliability", metric: "reliability", target: 99 },
  ],
};

export function recordPublishingEvent(workspace: PublishingAnalyticsWorkspace, event: Omit<PublishingAnalyticsEvent, "id" | "timestamp"> & { timestamp?: number }): PublishingAnalyticsWorkspace {
  const next: PublishingAnalyticsEvent = { ...event, id: uid("event"), timestamp: event.timestamp ?? Date.now() };
  const cutoff = Date.now() - workspace.retentionDays * 86400000;
  return { ...workspace, events: [next, ...workspace.events].filter((item) => item.timestamp >= cutoff) };
}

export function addPublishingGoal(workspace: PublishingAnalyticsWorkspace, goal: Omit<PublishingGoal, "id">): PublishingAnalyticsWorkspace {
  return { ...workspace, goals: [{ ...goal, id: uid("goal") }, ...workspace.goals] };
}

function rangeStart(range: AnalyticsRange): number {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  return Date.now() - days * 86400000;
}

function sum(events: PublishingAnalyticsEvent[], type: AnalyticsEventType): number {
  return events.filter((event) => event.type === type).reduce((total, event) => total + (event.value ?? 1), 0);
}

export function calculateChannelMetrics(events: PublishingAnalyticsEvent[], channel: AnalyticsChannel): ChannelMetric {
  const filtered = events.filter((event) => event.channel === channel);
  const views = sum(filtered, "view");
  const conversions = sum(filtered, "conversion");
  const publishes = sum(filtered, "publish");
  const errors = sum(filtered, "error");
  return {
    channel,
    views,
    downloads: sum(filtered, "download"),
    shares: sum(filtered, "share"),
    conversions,
    exports: sum(filtered, "export"),
    publishes,
    errors,
    conversionRate: views > 0 ? Number(((conversions / views) * 100).toFixed(2)) : 0,
    reliability: publishes + errors > 0 ? Number(((publishes / (publishes + errors)) * 100).toFixed(2)) : errors > 0 ? 0 : 100,
  };
}

export function generatePublishingAnalyticsReport(workspace: PublishingAnalyticsWorkspace, range: AnalyticsRange = "30d"): AnalyticsReport {
  const events = workspace.events.filter((event) => event.timestamp >= rangeStart(range));
  const channelMetrics = channels.map((channel) => calculateChannelMetrics(events, channel));
  const totalsBase = {
    views: sum(events, "view"), downloads: sum(events, "download"), shares: sum(events, "share"), conversions: sum(events, "conversion"),
    exports: sum(events, "export"), publishes: sum(events, "publish"), errors: sum(events, "error"),
  };
  const totals = {
    ...totalsBase,
    conversionRate: totalsBase.views > 0 ? Number(((totalsBase.conversions / totalsBase.views) * 100).toFixed(2)) : 0,
    reliability: totalsBase.publishes + totalsBase.errors > 0 ? Number(((totalsBase.publishes / (totalsBase.publishes + totalsBase.errors)) * 100).toFixed(2)) : totalsBase.errors > 0 ? 0 : 100,
  };
  const metricValue = (goal: PublishingGoal) => {
    const source = goal.channel ? channelMetrics.find((metric) => metric.channel === goal.channel) : totals;
    if (!source) return 0;
    if (goal.metric === "views") return source.views;
    if (goal.metric === "downloads") return source.downloads;
    if (goal.metric === "shares") return source.shares;
    if (goal.metric === "conversions") return source.conversions;
    if (goal.metric === "conversionRate") return source.conversionRate;
    return source.reliability;
  };
  const goals = workspace.goals.map((goal) => {
    const current = metricValue(goal);
    return { ...goal, current, progress: goal.target > 0 ? Math.min(100, Number(((current / goal.target) * 100).toFixed(1))) : 100, met: current >= goal.target };
  });
  const insights: AnalyticsInsight[] = [];
  if (!events.length) insights.push({ id: "no-data", severity: "warning", title: "No recent data", message: "No publishing events were recorded in this reporting range.", recommendation: "Connect publishing adapters or record local export and publication events." });
  if (totals.errors > 0) insights.push({ id: "errors", severity: totals.reliability < 95 ? "critical" : "warning", title: "Publishing errors detected", message: `${totals.errors} publishing errors reduced reliability to ${totals.reliability}%.`, recommendation: "Review failing channels and rerun preflight before the next release." });
  const best = [...channelMetrics].sort((a, b) => b.conversions - a.conversions)[0];
  if (best?.conversions > 0) insights.push({ id: "best-channel", severity: "positive", title: "Top conversion channel", message: `${best.channel} generated ${best.conversions} conversions.`, recommendation: "Reuse its strongest content and publishing cadence across related campaigns." });
  const unmet = goals.filter((goal) => !goal.met);
  if (unmet.length) insights.push({ id: "goals", severity: "info", title: "Goals need attention", message: `${unmet.length} analytics goal${unmet.length === 1 ? " is" : "s are"} below target.`, recommendation: "Prioritize the goals with the lowest progress percentage." });
  const score = Math.max(0, Math.min(100, Math.round((totals.reliability * 0.45) + (Math.min(100, totals.conversionRate * 10) * 0.25) + ((goals.filter((goal) => goal.met).length / Math.max(1, goals.length)) * 100 * 0.3))));
  return { generatedAt: Date.now(), range, totals, channels: channelMetrics, goals, insights, score };
}

export function exportAnalyticsReport(report: AnalyticsReport): string {
  return JSON.stringify(report, null, 2);
}

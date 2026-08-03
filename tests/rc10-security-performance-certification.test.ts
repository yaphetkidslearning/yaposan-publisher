import test from "node:test";
import assert from "node:assert/strict";
import {
  BoundedRateLimiter,
  detectInjectionSignals,
  evaluatePerformanceBudget,
  inspectJsonComplexity,
  validateRequestTarget,
  verifyFileSignature,
} from "../server/securityCertification.ts";
import { loadCloudConfig, validateProductionConfig } from "../server/config.ts";

test("request target rejects traversal and excessive query parameters", () => {
  const traversal = validateRequestTarget("/api/%2e%2e/secrets");
  assert.equal(traversal.valid, false);
  assert.ok(traversal.findings.some(x => x.code === "PATH_TRAVERSAL"));
  const query = validateRequestTarget("/api?" + Array.from({length: 101}, (_,i) => `a${i}=1`).join("&"));
  assert.ok(query.findings.some(x => x.code === "TOO_MANY_QUERY_PARAMETERS"));
});

test("request target rejects malformed encoding and non-origin form", () => {
  assert.equal(validateRequestTarget("https://evil.example/test").valid, false);
  assert.ok(validateRequestTarget("/bad/%zz").findings.some(x => x.code === "INVALID_ENCODING"));
});

test("JSON complexity enforces depth", () => {
  let value: unknown = "end";
  for (let i = 0; i < 40; i++) value = { child: value };
  const result = inspectJsonComplexity(value);
  assert.equal(result.valid, false);
  assert.equal(result.code, "JSON_DEPTH_LIMIT");
});

test("JSON complexity enforces node and string limits", () => {
  const nodes = inspectJsonComplexity(Array.from({length: 200}, (_,i) => i), {
    maxBodyBytes: 1000, maxJsonDepth: 10, maxJsonNodes: 100, maxStringLength: 100, maxQueryParameters: 10, maxPathLength: 100,
  });
  assert.equal(nodes.code, "JSON_NODE_LIMIT");
  const text = inspectJsonComplexity("x".repeat(101), {
    maxBodyBytes: 1000, maxJsonDepth: 10, maxJsonNodes: 100, maxStringLength: 100, maxQueryParameters: 10, maxPathLength: 100,
  });
  assert.equal(text.code, "JSON_STRING_LIMIT");
});

test("injection signal screening recognizes major attack classes", () => {
  assert.deepEqual(detectInjectionSignals("<script>alert(1)</script>"), ["XSS_SIGNAL"]);
  assert.ok(detectInjectionSignals("' OR 1=1 --").includes("SQL_INJECTION_SIGNAL"));
  assert.ok(detectInjectionSignals("${jndi:ldap://example/x}").includes("JNDI_INJECTION_SIGNAL"));
  assert.ok(detectInjectionSignals("../../etc/passwd").includes("PATH_TRAVERSAL_SIGNAL"));
  assert.deepEqual(detectInjectionSignals("normal project title"), []);
});

test("file signature verification detects MIME spoofing", () => {
  const png = Buffer.from([137,80,78,71,13,10,26,10,0,0]);
  assert.equal(verifyFileSignature("image/png", png).verified, true);
  assert.equal(verifyFileSignature("image/jpeg", png).verified, false);
  assert.match(verifyFileSignature("image/png", png).checksum, /^[a-f0-9]{64}$/);
});

test("bounded rate limiter blocks excess requests and limits memory", () => {
  const limiter = new BoundedRateLimiter({ limit: 2, windowMs: 1000, maxEntries: 3 });
  assert.equal(limiter.check("a", 100).allowed, true);
  assert.equal(limiter.check("a", 200).allowed, true);
  assert.equal(limiter.check("a", 300).allowed, false);
  limiter.check("b", 400); limiter.check("c", 500); limiter.check("d", 600);
  assert.ok(limiter.size <= 3);
  assert.equal(limiter.check("a", 1200).allowed, true);
});

test("performance budget reports latency, memory and output failures", () => {
  const result = evaluatePerformanceBudget([
    { name: "a", durationMs: 20, memoryBytes: 10, outputBytes: 100 },
    { name: "b", durationMs: 200, memoryBytes: 1000, outputBytes: 2000 },
  ], { maxP95Ms: 100, maxMemoryBytes: 500, maxOutputBytes: 1500 });
  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, ["P95_LATENCY_EXCEEDED", "MEMORY_BUDGET_EXCEEDED", "OUTPUT_BUDGET_EXCEEDED"]);
});

test("performance budget passes compliant workloads", () => {
  const result = evaluatePerformanceBudget(
    Array.from({length: 20}, (_,i) => ({ name: String(i), durationMs: 10 + i, memoryBytes: 100, outputBytes: 1000 })),
    { maxP95Ms: 30, maxMemoryBytes: 1000, maxOutputBytes: 5000 },
  );
  assert.equal(result.passed, true);
  assert.equal(result.p95Ms, 28);
});

test("RC10 environment limits are parsed from the provided environment", () => {
  const config = loadCloudConfig({
    MAX_REQUEST_BODY_BYTES: "5000000",
    MAX_JSON_DEPTH: "24",
    MAX_JSON_NODES: "25000",
    MAX_QUERY_PARAMETERS: "50",
    RATE_LIMIT_PER_MINUTE: "90",
    RATE_LIMIT_MAX_ENTRIES: "10000",
  });
  assert.equal(config.maxRequestBodyBytes, 5_000_000);
  assert.equal(config.maxJsonDepth, 24);
  assert.equal(config.maxJsonNodes, 25_000);
  assert.equal(config.maxQueryParameters, 50);
  assert.equal(config.rateLimitPerMinute, 90);
  assert.equal(config.rateLimitMaxEntries, 10_000);
});

test("invalid RC10 production limits are reported", () => {
  const config = loadCloudConfig({
    MAX_REQUEST_BODY_BYTES: "100",
    MAX_JSON_DEPTH: "2",
    MAX_JSON_NODES: "10",
    MAX_QUERY_PARAMETERS: "2000",
    RATE_LIMIT_PER_MINUTE: "20000",
    RATE_LIMIT_MAX_ENTRIES: "10",
  });
  const issues = validateProductionConfig(config, "development");
  assert.ok(issues.some(x => x.includes("MAX_REQUEST_BODY_BYTES")));
  assert.ok(issues.some(x => x.includes("MAX_JSON_DEPTH")));
  assert.ok(issues.some(x => x.includes("MAX_JSON_NODES")));
  assert.ok(issues.some(x => x.includes("MAX_QUERY_PARAMETERS")));
  assert.ok(issues.some(x => x.includes("RATE_LIMIT_PER_MINUTE")));
  assert.ok(issues.some(x => x.includes("RATE_LIMIT_MAX_ENTRIES")));
});

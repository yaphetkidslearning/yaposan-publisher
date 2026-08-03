import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Phase 25.36 home pricing section and ordering", () => {
  const source = fs.readFileSync("src/app/index.tsx", "utf8");
  for (const value of ["Choose a plan", "$0", "$9.99/month", "$19.99/month", "$39.99/month"]) assert.ok(source.includes(value));
  const popular = source.indexOf("Popular publication types");
  const plans = source.indexOf("Choose a plan");
  const channels = source.indexOf("Publish channels");
  const recent = source.indexOf("Recent projects");
  assert.ok(popular < plans);
  assert.ok(plans < channels);
  assert.ok(channels < recent);
  assert.ok(source.includes("planCard3d"));
  assert.ok(source.includes("borderBottomWidth: 8"));
});

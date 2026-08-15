import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("Phase 92.6 release metadata and verification chain are registered", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(Number(read("release/CURRENT_CREATIVE_PLATFORM_PHASE").trim()) >= 92.6);
  assert.equal(pkg.scripts["test:phase92.6"], "node --test tests/phase926-complete-lint-hardening.test.mjs");
  assert.match(pkg.scripts["verify:phase92.6"], /npm run typecheck && npm run lint/);
  assert.match(pkg.scripts["verify:phase92.6"], /npm run test:phase92\.6/);
  assert.match(pkg.scripts["verify:phase92.6"], /npm run build:web$/);
});

test("editor render-purity and effect blockers are removed", () => {
  const source = read("src/app/editor.tsx");
  const component = source.slice(source.indexOf("export default function EditorScreen"));
  assert.doesNotMatch(component, /Date\.now\(\)/);
  assert.doesNotMatch(component, /Math\.random\(\)/);
  assert.doesNotMatch(source, /\(\) => exportJson\(\)/);
  assert.doesNotMatch(source, /\(\) => void exportPdf\(\)/);
  assert.doesNotMatch(source, /\(\) => void exportImage\(format\)/);
  assert.doesNotMatch(source, /if \(selectedElements\.length > 1\) \{ setActiveTab/);
  assert.match(source, /queueMicrotask\(\(\) => setActiveTab/);
});

test("remaining app-level React lint blockers are removed", () => {
  const faq = read("src/app/faq.tsx");
  const help = read("src/app/help.tsx");
  const home = read("src/app/index.tsx");
  const photo = read("src/app/photo-studio.tsx");
  const tools = read("src/app/professional-file-tools.tsx");
  assert.match(faq, /queueMicrotask/);
  assert.match(help, /queueMicrotask/);
  assert.match(home, /queueMicrotask\(\(\) => \{ setOnboardingStep/);
  assert.equal((home.match(/\n\s*quickTitle:/g) ?? []).length, 1);
  assert.equal((home.match(/\n\s*quickText:/g) ?? []).length, 1);
  assert.equal((home.match(/\n\s*sidebarUpgrade:/g) ?? []).length, 1);
  assert.equal((home.match(/\n\s*sidebarUpgradeTitle:/g) ?? []).length, 1);
  assert.equal((home.match(/\n\s*sidebarUpgradeText:/g) ?? []).length, 1);
  assert.doesNotMatch(home, /Yaposan's shared monthly budget/);
  assert.match(photo, /queueMicrotask\(\(\) => setMediaReady\(\{\}\)\)/);
  const toolsComponent = tools.slice(tools.indexOf("export default function ProfessionalFileTools"));
  assert.doesNotMatch(toolsComponent, /Date\.now\(\)/);
});

test("PublisherCanvas no longer reassigns captured crop or pen variables", () => {
  const source = read("src/components/publisher/PublisherCanvas.tsx");
  assert.doesNotMatch(source, /onPanResponderGrant:[\s\S]{0,160}cropStart\s*=/);
  assert.doesNotMatch(source, /lastPenTap\s*=\s*eventTime/);
  assert.match(source, /setLastPenTap\(eventTime\)/);
});

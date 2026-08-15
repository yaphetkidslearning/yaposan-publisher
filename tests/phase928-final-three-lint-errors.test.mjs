import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("phase 92.8 moves Phase 42 evidence entropy outside the component", () => {
  const source = read("src/app/commercial-release-completion.tsx");
  assert.match(source, /const nextEvidenceId=\(\)=>`p42-\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\}`/);
  const component = source.slice(source.indexOf("export default function CommercialReleaseCompletion"));
  assert.doesNotMatch(component, /Date\.now\(\)|Math\.random\(\)/);
});

test("phase 92.8 removes manual memoization from the page PanResponder", () => {
  const source = read("src/components/publisher/PublisherCanvas.tsx");
  assert.match(source, /const pageResponder = PanResponder\.create\(\{/);
  assert.doesNotMatch(source, /const pageResponder = useMemo/);
});

test("phase 92.8 preserves the 92.7.1 font expansion", () => {
  const constants = read("src/constants/publisher.ts");
  const toolbar = read("src/components/publisher/EditorToolbar.tsx");
  assert.match(constants, /FONT_FAMILIES/);
  assert.match(toolbar, /placeholder="Search fonts"/);
  assert.match(toolbar, /fontDropdownItemActive/);
});

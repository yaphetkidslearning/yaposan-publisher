import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("phase 92.7 removes the remaining effect and purity regressions", () => {
  const contact = read("src/app/contact.tsx");
  const creator = read("src/app/creator-marketplace.tsx");
  const ai = read("src/app/ai.tsx");
  const account = read("src/app/account.tsx");
  const backend = read("src/app/backend-completion.tsx");
  const commerce = read("src/app/commerce-tools.tsx");
  assert.doesNotMatch(contact, /useEffect\(\(\)=>\{[\s\S]{0,300}setCategory\(/);
  assert.match(creator, /queueMicrotask\(\(\)=>\{void load\(\)\}\)/);
  assert.match(ai, /queueMicrotask\(\(\)=>\{/);
  assert.doesNotMatch(account, /Date\.now\(\)|Math\.random\(\)/);
  assert.doesNotMatch(backend, /Date\.now\(\)|Math\.random\(\)/);
  assert.doesNotMatch(commerce, /Date\.now\(\)/);
});

test("phase 92.7 removes editor self-reference and marketplace JSX error", () => {
  const editor = read("src/app/editor.tsx");
  const marketplace = read("src/app/marketplace.tsx");
  assert.match(editor, /const saveProjectCore = useCallback/);
  assert.doesNotMatch(editor, /const saveProject = useCallback\(async[\s\S]{0,500}saveProject\(\)/);
  assert.match(marketplace, /marketplace&apos;s approved OAuth\/API credentials/);
});

test("phase 92.7 keeps PublisherCanvas hooks top-level and gesture state immutable", () => {
  const canvas = read("src/components/publisher/PublisherCanvas.tsx");
  assert.match(canvas, /const \[drawStart,setDrawStart\] = useState<Point>/);
  assert.match(canvas, /const \[penNodes,setPenNodes\] = useState<VectorNode\[\]>/);
  assert.doesNotMatch(canvas, /const pageResponder = useMemo\(\(\) => \{[\s\S]{0,300}useState\(/);
  assert.doesNotMatch(canvas, /drawStart\s*=\s*\{x,y\}/);
  assert.doesNotMatch(canvas, /penNodes\.push\(/);
});

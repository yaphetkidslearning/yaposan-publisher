import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read=(p)=>fs.readFileSync(p,'utf8');
const exists=(p)=>fs.existsSync(p);
function walk(dir){const out=[];if(!exists(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else out.push(p)}return out}

test('release version is aligned',()=>{
  assert.equal(JSON.parse(read('package.json')).version,'119.10.9');
  assert.equal(JSON.parse(read('app.json')).expo.version,'119.10.9');
  assert.match(read('server/index.ts'),/releaseVersion = "119\.10\.9"/);
});

test('production source has no phase-named runtime files',()=>{
  const bad=walk('src').concat(walk('server')).filter(f=>/phase/i.test(path.basename(f))&&/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(f));
  assert.deepEqual(bad,[]);
});

test('historical release clutter is removed',()=>{
  for(const p of ['docs/history','docs/audits','release','.claude','VALIDATION-PHASE24.0M.txt','docker-compose.phase69.yml','AGENTS.md','CLAUDE.md','PROJECT-AUDIT.md','CURRENT-RELEASE-DETAILS.md']) assert.equal(exists(p),false,p);
});

test('npm scripts expose no phase commands',()=>{
  const scripts=JSON.parse(read('package.json')).scripts;
  assert.equal(Object.keys(scripts).some(k=>/phase/i.test(k)),false);
  assert.equal(Object.values(scripts).some(v=>/phase/i.test(v)),false);
});

test('user-facing pages expose no numbered phase labels or export names',()=>{
  for(const f of walk('src/app').concat(walk('src/components')).filter(f=>/\.(?:ts|tsx|js|jsx)$/.test(f))){
    const s=read(f);
    assert.doesNotMatch(s,/<Text[^>]*>\s*Phase\s*\d/i,f);
    assert.doesNotMatch(s,/["'`][^"'`]*\bPhase\s+\d+(?:\.\d+)*[^"'`]*["'`]/i,f);
    assert.doesNotMatch(s,/\bYAPOSAN\s+\d+(?:\.\d+)*/i,f);
    assert.doesNotMatch(s,/-phase\d[^"'`]*(?:\.json|\.txt|\.zip)/i,f);
  }
});

test('page presentation persistence and stale-state protection remain present',()=>{
  const s=read('src/app/ai-page.tsx');
  for(const token of ['displayName','bio','website','avatarUri','coverUri','coverX','coverY','coverZoom']) assert.match(s,new RegExp(token));
  assert.match(s,/let cloud:any=null/);
  assert.match(s,/if\(cloud&&!cloud\.displayName&&!cloud\.avatarUri&&!cloud\.coverUri\)/);
  assert.doesNotMatch(s,/if\(privacy&&!privacy\.displayName/);
});

test('page summary and global DM read state remain wired',()=>{
  const s=read('server/index.ts');
  assert.match(s,/\/api\/v1\/spaces\/\(\[\^\/\]\+\)\\\/summary|pageSummaryMatch/);
  assert.match(s,/markConversationRead/);
  assert.match(s,/DM_READ_FAILED/);
  assert.match(s,/published/);
});

test('social privacy, media picker, navigation, and public page actions remain present',()=>{
  const social=read('src/app/social-media.tsx');
  for(const token of ['Stories & Reels','Communities','Events','Live','Channels','Notes','Polls','Collab / Remix']) assert.match(social,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(social,/visibility.*'private'/);
  assert.match(social,/storyVisibility.*'private'/);
  assert.match(social,/ImagePicker\.launchImageLibraryAsync/);
  const page=read('src/app/creator-page.tsx');
  assert.match(page,/Following/); assert.match(page,/'Follow'/); assert.match(page,/>DM</);
  assert.match(page,/coverZoom/); assert.match(page,/avatarUri/);
});

test('active backend modules use neutral production filenames',()=>{
  const s=read('server/index.ts');
  for(const mod of ['./commerce','./admin','./trustSafety','./production']) assert.match(s,new RegExp(mod.replace(/[./]/g,'\\$&')));
  for(const f of ['server/commerce.ts','server/admin.ts','server/trustSafety.ts','server/production.ts']) assert.equal(exists(f),true,f);
});

test('distribution tree has no phase-named documentation, workflow, asset, script, or test artifacts',()=>{
  const roots=['docs','scripts','tests','.github','assets'];
  const bad=roots.flatMap(walk).filter(f=>/phase/i.test(path.basename(f)));
  assert.deepEqual(bad,[]);
});


test('typecheck and lint cleanup fixes remain protected',()=>{
  const db=read('server/database.ts');
  assert.match(db,/SocialStoryRecord[^\n]*visibility:[^\n]*"private"/);
  const files=read('src/utils/projectFileManager.ts');
  assert.match(files,/export\s+(?:async\s+)?function\s+exportPublisherProjectFile|export\s+const\s+exportPublisherProjectFile/);
  assert.match(files,/export\s+(?:async\s+)?function\s+importPublisherProjectFile|export\s+const\s+importPublisherProjectFile/);
  assert.equal(exists('eslint.config.js'),true,'eslint.config.js');
});

test('current production utility scripts are complete',()=>{
  const scripts=JSON.parse(read('package.json')).scripts;
  assert.equal(scripts['security:sbom'],'node scripts/generate-sbom.mjs');
  assert.equal(exists('scripts/generate-sbom.mjs'),true,'scripts/generate-sbom.mjs');
  for(const command of Object.values(scripts)){
    for(const match of command.matchAll(/(?:node|tsx|ts-node)\s+(?:--[^ ]+\s+)*([^ &|;]+\.(?:mjs|cjs|js|ts))/g)) assert.equal(exists(match[1]),true,match[1]);
  }
});


test('My Page separates Posts from Chat and supports customizable navigation',()=>{
  const page=read('src/app/ai-page.tsx');
  const sidebar=read('src/components/space/SpaceSidebar.tsx');
  assert.match(page,/type Tab=.*"post".*"chat"/);
  assert.match(page,/>Post<\/Text>/);
  assert.match(page,/AI Chat/);
  assert.match(page,/Customize top bar/);
  assert.match(page,/DEFAULT_TOP/);
  assert.match(sidebar,/Customize sidebar/);
  assert.match(sidebar,/moveGroup/);
  assert.match(sidebar,/sidebarHidden/);
});

test('My Page DM uses the global popup dock and comments support reactions',()=>{
  const page=read('src/app/ai-page.tsx');
  const dock=read('src/components/social/GlobalDmDock.tsx');
  const social=read('server/spaceSocial.ts');
  const db=read('server/database.ts');
  const pg=read('server/postgresDatabase.ts');
  assert.match(page,/yaposan:open-dm/);
  assert.match(dock,/yaposan:open-dm/);
  assert.match(dock,/manualOpen/);
  assert.match(social,/toggleSpaceCommentReaction/);
  assert.match(db,/spaceCommentReactions/);
  assert.match(pg,/space_comment_reactions/);
});

test('My Page post cards expose complete interaction controls',()=>{
  const card=read('src/components/social/PagePostCard.tsx');
  for(const emoji of ['👍','❤️','😂','😮','🔥','👎','😊']) assert.match(card,new RegExp(emoji));
  assert.doesNotMatch(card,/🔖/); assert.doesNotMatch(card,/🔁/); assert.match(card,/PostAudiencePicker/);
  assert.match(card,/Reply to reply/);
  assert.match(card,/Write a comment/);
  const social=read('src/app/social-media.tsx');
  assert.match(social,/comments\/\$\{c\.id\}\/reaction/);
});


test('privacy, audience picker, and current AI Page homepage positioning remain present',()=>{
 const page=read('src/app/ai-page.tsx'); const sidebar=read('src/components/space/SpaceSidebar.tsx'); const card=read('src/components/social/PagePostCard.tsx'); const home=read('src/app/index.tsx');
 assert.doesNotMatch(page,/Only me\/admins/); assert.match(page,/Private by default/); assert.match(card,/Like/); assert.match(card,/Dislike/); const picker=read('src/components/social/PostAudiencePicker.tsx'); assert.match(picker,/settings-outline/); assert.match(picker,/Followers only/); assert.match(picker,/Specific people/);
 assert.doesNotMatch(sidebar,/>\{email\}</); assert.doesNotMatch(sidebar,/Yaposan Home/); assert.match(sidebar,/Creator Home/); assert.match(sidebar,/Website Home/);
 assert.match(home,/Create your own AI-powered page on the internet\./); assert.match(home,/WHAT MAKES YAPOSAN DIFFERENT/); assert.doesNotMatch(home,/ImageBackground/); assert.doesNotMatch(home,/welcome-background\.png/); assert.match(home,/The AI Page is the product\./); assert.doesNotMatch(picker,/Friends only/); assert.match(picker,/Modal/); assert.match(page,/PostAudiencePicker/); const privacy=read('server/privacy.ts'); assert.match(privacy,/followers/); assert.match(privacy,/specific/); assert.match(privacy,/sanitizeSpecificAudience/); assert.match(sidebar,/Profile visibility/); assert.match(sidebar,/email/);
 const audience=read('server/postAudience.ts'); assert.match(audience,/case 'followers'/); assert.match(audience,/case 'friends'.*legacy compatibility/); assert.match(audience,/case 'specific'/); assert.doesNotMatch(audience,/isFriendOfPostAuthor/); assert.match(audience,/canAccessSpace\(db,userId,post\.spaceId,'admin'\)/);
});

test('Edit profile modal remains usable on short screens',()=>{
 const sidebar=read('src/components/space/SpaceSidebar.tsx');
 assert.match(sidebar,/profileModalCard/);
 assert.match(sidebar,/maxHeight:'90%'/);
 assert.match(sidebar,/profileModalScroll/);
 assert.match(sidebar,/showsVerticalScrollIndicator/);
 assert.match(sidebar,/Close profile editor/);
 assert.match(sidebar,/Save profile/);
});

test('119.10.9 homepage keeps product hierarchy and supporting capabilities separate',()=>{
  const home=read('src/app/index.tsx');
  assert.match(home,/The AI Page is the product\./);
  assert.match(home,/Everything around your AI Page\./);
  assert.match(home,/ONE SPACE, MANY CAPABILITIES/);
  assert.match(home,/BUILT TO GROW WITH YOUR AI PAGE/);
  assert.match(home,/Live streaming/);
  assert.match(home,/Products & services/);
  assert.match(home,/Public, private & paid content/);
});

test('119.10.9 homepage has canonical web responsive navigation and hero layout',()=>{
  const home=read('src/app/index.tsx');
  assert.match(home,/const \{ width \} = useWindowDimensions\(\)/);
  assert.match(home,/Platform\.OS !== "web" && width < 700/);
  assert.match(home,/@media \(min-width: 1100px\)/);
  assert.match(home,/@media \(min-width: 700px\) and \(max-width: 1099px\)/);
  assert.match(home,/@media \(max-width: 699px\)/);
  assert.match(home,/nativeID="y-home-hero"/);
  assert.match(home,/nativeID="y-home-nav"/);
});

test('global DM dock contains API failures instead of crashing the app',()=>{
  const dm=read('src/components/social/GlobalDmDock.tsx');
  assert.match(dm,/catch\(error\)\{noteUnavailable\(error\)\}/);
  assert.match(dm,/DM is temporarily unavailable/);
  assert.match(dm,/Retry/);
});

test('119.10.9 homepage responds to mobile, positioning, navigation, and feedback requirements',()=>{
  const home=read('src/app/index.tsx');
  const html=read('src/app/+html.tsx');
  const feedback=read('src/app/feedback.tsx');
  assert.match(html,/name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(home,/YOUR AI\. YOUR PAGE\. YOUR DIGITAL SPACE\./);
  assert.match(home,/Create your own AI-powered page on the internet\./);
  assert.match(home,/The AI Page is the product\./);
  assert.match(home,/Create My AI Page/);
  assert.match(home,/>AI Page<\/Text>/);
  assert.match(home,/>How It Works<\/Text>/);
  assert.match(home,/>Feedback<\/Text>/);
  assert.match(home,/>Sign In<\/Text>/);
  assert.match(home,/Create an AI Page for your personal space, or open Yaposan Creator/);
  assert.doesNotMatch(home,/open The tools help you build it/);
  assert.match(feedback,/support ticket system/);
  assert.match(feedback,/router\.replace\("\/contact\?source=Website%20Feedback/);
});


test('119.10.9 AI access cards fill the desktop row and stack on mobile',()=>{
  const creator=read('src/app/creator.tsx');
  assert.match(creator,/const planWidth = useMemo\(\(\) => \(mobile \? "100%" : "49%"\)/);
  assert.match(creator,/planGrid: \{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "stretch", gap: 10 \}/);
});


test('119.10.9 keeps homepage auth state, logout, and My Page routing consistent',()=>{
  const home=read('src/app/index.tsx');
  const sidebar=read('src/components/space/SpaceSidebar.tsx');
  assert.match(home,/const auth = useAuth\(\)/);
  assert.match(home,/>AI Page<\/Text>/);
  assert.match(home,/auth\.isAuthenticated\?"Open My AI Page":"Create My AI Page"/);
  assert.match(home,/Sign Out/);
  assert.match(home,/router\.push\("\/my-space"/);
  assert.match(sidebar,/Website Home/);
  assert.match(sidebar,/Sign Out/);
  assert.match(sidebar,/auth\.signOut\(\)/);
  const creator=read('src/app/creator.tsx');
  assert.match(creator,/accessibilityLabel="Sign out"/);
  assert.match(creator,/>Sign Out<\/Text>/);
});

test('119.10.9 prevents accidental duplicate personal AI Pages',()=>{
  const create=read('src/app/create-ai-page.tsx');
  const chooser=read('src/app/my-space.tsx');
  const server=read('server/index.ts');
  assert.match(create,/authorizedFetch\("\/api\/v1\/spaces"\)/);
  assert.match(create,/router\.replace\("\/my-space"/);
  assert.doesNotMatch(chooser,/Create another AI Page/);
  assert.match(server,/existingPersonal/);
  assert.match(server,/existing: true/);
});

test('119.10.9 production blueprint keeps local auth and verified-email delivery configuration',()=>{
  const render=read('render.yaml');
  const config=read('server/config.ts');
  assert.match(render,/key: IDENTITY_PROVIDER\s+value: local/);
  assert.match(render,/key: REQUIRE_EXTERNAL_IDENTITY\s+value: "false"/);
  assert.match(render,/key: REQUIRE_EMAIL_VERIFICATION\s+value: "true"/);
  assert.match(render,/key: RESEND_API_KEY\s+sync: false/);
  assert.match(render,/key: EMAIL_FROM\s+sync: false/);
  assert.doesNotMatch(config,/Production local-password identity is legacy fallback/);
});


test('119.10.9 keeps direct-load and internal-navigation homepage layout consistent',()=>{
  const home=read('src/app/index.tsx');
  assert.match(home,/Web uses CSS media queries below/);
  assert.match(home,/direct loads, refreshes, browser history, and client-side navigation/);
  assert.match(home,/#y-home-hero \{ flex-direction: row !important/);
  assert.match(home,/#y-home-actions \{ flex-direction: row !important/);
  assert.match(home,/#y-home-choice \{ max-width: 470px !important/);
  assert.match(home,/@media \(max-width: 699px\)/);
});

test('119.10.9 open-source readiness is maintained',()=>{
  for(const p of ['LICENSE','CONTRIBUTING.md','CODE_OF_CONDUCT.md','SECURITY.md','GOVERNANCE.md','docs/OPEN_SOURCE.md','docs/PUBLIC-RELEASE-CHECKLIST.md','scripts/scan-source-secrets.mjs','.github/PULL_REQUEST_TEMPLATE.md','.github/workflows/ci.yml','.github/workflows/codeql.yml','.github/dependabot.yml']) assert.equal(exists(p),true,p);
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.license,'MIT');
  assert.match(pkg.scripts['open-source:preflight'],/security:secrets:tree/);
  assert.match(read('.github/workflows/open-source-security.yml'),/npm run open-source:preflight/);
  assert.doesNotMatch(read('.github/workflows/open-source-security.yml'),/(?:verify|test|check):phase/i);
  assert.doesNotMatch(read('.github/workflows/production-release.yml'),/(?:verify|test|check):phase/i);
});


test('119.10.9 repository front page explains the vision and invites contributors',()=>{
  const readme=read('README.md');
  assert.match(readme,/Help Build Yaposan/);
  assert.match(readme,/Everyone should be able to have their own AI-powered page on the internet/);
  assert.match(readme,/Want to help\?/);
  assert.match(readme,/bring your own AI/i);
  assert.match(readme,/Issue/);
  assert.match(readme,/Discussion/);
  assert.match(readme,/Pull Request/);
  assert.match(readme,/Yaposan is still under active development/);
});

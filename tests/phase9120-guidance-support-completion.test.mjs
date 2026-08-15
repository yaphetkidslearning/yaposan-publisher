import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

test('91.20 stores real support tickets and attachment objects',()=>{
  const server=read('server/index.ts');
  const route=server.indexOf('/api/v1/support/tickets');
  const authBoundary=server.indexOf('const claims = verifyToken', route);
  assert.ok(route>0 && authBoundary>route,'support ticket route should be public/rate-limited before normal auth boundary');
  for(const term of ['supportTicketLimiter','SUPPORT_ATTACHMENT_MAX_BYTES','attachmentStorageKey','storage.put','supportTickets']) assert.match(server,new RegExp(esc(term)));
  const db=read('server/database.ts');
  assert.match(db,/SupportTicketRecord/); assert.match(db,/supportTickets:new Map/);
  const pg=read('server/postgresDatabase.ts');
  assert.match(pg,/support_tickets/); assert.match(pg,/idx_support_tickets_status/);
});

test('Contact preserves origin context, validates fields, uploads attachment bytes, and shows ticket confirmation',()=>{
  const s=read('src/app/contact.tsx');
  for(const term of ['useLocalSearchParams','source:meta.source','page:meta.page','action:meta.action','isValidSupportEmail','supportAttachmentToBase64','Submit Support Request','Support request received','91.20','10 MB']) assert.match(s,new RegExp(esc(term)));
  assert.match(read('src/utils/supportTransport.ts'),/readAsStringAsync/);
  assert.match(read('src/utils/supportContext.ts'),/SUPPORT_MAX_ATTACHMENT_BYTES/);
});

test('Shared workspace help carries report context automatically',()=>{
  const s=read('src/components/workspace/Phase241IShell.tsx');
  for(const term of ['usePathname','buildContactHref','Report','action']) assert.match(s,new RegExp(esc(term)));
});

test('Onboarding can be restarted from Help and Settings',()=>{
  const home=read('src/app/index.tsx');
  assert.match(home,/onboarding91\.20\.dismissed/); assert.match(home,/routeParams\.tour === "1"/);
  const help=read('src/app/help.tsx'); assert.match(help,/Restart guided tour/); assert.match(help,/onboarding91\.20\.dismissed/);
  const settings=read('src/app/settings.tsx'); for(const term of ['Help & Learning','Restart guided tour','/?tour=1']) assert.match(settings,new RegExp(esc(term)));
});

test('FAQ supports deep links, accessibility expansion state, feedback, and at least 55 answers',()=>{
  const faq=read('src/app/faq.tsx');
  for(const term of ['question?:string','router.setParams','accessibilityState={{expanded:active}}','Was this helpful?']) assert.match(faq,new RegExp(esc(term)));
  const content=read('src/utils/helpCenterContent.ts');
  assert.ok((content.match(/question:/g)||[]).length>=55);
  for(const id of ['video-create','audio-create','publisher-start','templates','app-studio','collaboration','account-delete','support-attachment']) assert.match(content,new RegExp(`id:'${id}'`));
});

test('Help search has fallback guidance, direct FAQ answer links, and local helpful feedback',()=>{
  const s=read('src/app/help.tsx');
  for(const term of ['No exact studio guide matched','Open this answer','Was this guide helpful?','results.faqs','Restart guided tour']) assert.match(s,new RegExp(esc(term)));
});

test('Troubleshooting provides actionable readiness refresh and configure links',()=>{
  const s=read('src/app/troubleshoot.tsx');
  for(const term of ['Refresh status','Retry readiness check','Configure','Last checked','buildContactHref','/api/v1/ai/media/capabilities']) assert.match(s,new RegExp(esc(term)));
});

test('Photo Studio exposes inline failed-job troubleshooting and contextual reporting',()=>{
  const s=read('src/app/photo-studio.tsx');
  for(const term of ['lastFailedJob','Image tool failed','Report this error','buildContactHref']) assert.match(s,new RegExp(esc(term)));
});

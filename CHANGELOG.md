# Yaposan 92.18 — CI Release Certification Hardening

- Synchronizes package, lockfile, and platform phase metadata at 92.18.
- Declares ESLint 9.39.5 and eslint-config-expo 57.0.1 as development dependencies for clean CI environments.
- Adds `actions: read` to CodeQL permissions while preserving `contents: read` and `security-events: write`.
- Replaces the obsolete RC12 hard-coded package version assertion with release-metadata consistency checks.
- Preserves the 92.17 AI gateway CI hardening.

## 92.15 - Word-style font flyout

- Re-anchored the Home ribbon font family menu beneath the font control instead of centering it on the workspace.
- Removed the dimmed modal backdrop and made the font chooser denser and more desktop-like.
- Preserved font search, categories, previews, selection highlighting, and Font Manager access.

# Changelog

## 92.14 - Final Render Purity Cleanup

- Removed the last render-time nondeterminism from the commercial release modal.
- Replaced lazy `Math.random()` device identity generation with React `useId()` so the component remains deterministic during render.
- Added explicit Phase 92.13 and 92.14 test/verification scripts and synchronized release metadata.
- Preserved all Phase 92.13 font-integrity and runtime-hardening behavior.

## 92.13 - Font Integrity & Runtime Hardening

- Fixed same-name runtime fonts being hidden by catalog placeholders; imported and installed records now take precedence.
- Tightened missing-font replacement so suggested replacements must pass text compatibility checks.
- Hardened TrueType/OpenType cmap format 4 parsing to honor actual glyph mappings and exclude `.notdef` entries.
- Hardened cmap format 12 coverage and TrueType Collection offset validation.
- Made UTF-16BE font-name decoding resilient on JavaScript runtimes without that TextDecoder encoding.
- Excluded Unicode layout controls, joiners, bidi controls, and variation selectors from visible-glyph coverage requirements.
- Added Phase 92.13 regression coverage.

## 92.12 - Font Reliability & Prepress Completion

- Added dependency-free OpenType/TrueType inspection for imported TTF/OTF/TTC font files.
- Persisted real font family, face, weight, Unicode cmap coverage, embedding permission, and variable-axis metadata.
- Made imported fonts durable project assets instead of temporary picker/cache references.
- Fixed Missing Fonts so unknown document families remain visible and can be replaced throughout a publication.
- Added runtime status badges separating catalog-only fonts from installed/embedded fonts.
- Added exact glyph compatibility for inspected fonts and safer multilingual compatibility fallback behavior.
- Added PDF font-substitution/restricted-embedding preflight diagnostics.
- Fixed the Font Manager footer separator styling.

## 92.10 — Font Runtime & International Typography

- Added local installed-font discovery on supported desktop web browsers.
- Added script-aware multilingual previews, compatibility filtering, RTL detection, and fallback stacks.
- Added local/custom families to the font workflow and quick dropdown.
- Improved embedded-font diagnostics and multilingual SVG/web export behavior.
- Added Phase 92.10 regression coverage and release documentation.

## Phase 92.7.1 — Publisher Font Family Expansion

- Expanded the Publisher font catalog from 9 to 142 font families across sans serif, serif, display, monospace, and handwriting categories.
- Rebuilt the Home ribbon font dropdown into a Word-style searchable font browser with category filters, live font previews, selected-font highlighting, and result counts.
- Kept the full Professional Font Manager synchronized with the same 142-family catalog and custom embedded-font workflow.
- Added a Phase 92.7.1 regression test and release verification command.

## Phase 92.7 — Zero Lint Error Hardening

- Consolidated the final 14 lint-error fixes reported by the 92.6 Windows run.
- Added a regression test covering those error classes.
- Production certification command: `npm run verify:phase92.7`.

## 92.5 - Final Lint Hardening

## Phase 92.6 — Complete Lint Hardening

- Consolidated the remaining React Compiler / ESLint blockers into one repository-wide hardening pass.
- Repaired editor callback purity, effect state synchronization, duplicate style keys, JSX escaping, Photo Studio hydration, Professional File Tools timestamps, and PublisherCanvas captured state.
- Added `test:phase92.6` and `verify:phase92.6`.


- Fixed the remaining reported React effect cascade, render-purity, captured-variable immutability, and duplicate-style-key blockers from the 92.4 lint run.
- Hardened support, team, enterprise operations, billing, AI access, templates, troubleshooting, editor, product-photo, desktop sync, account hydration, and Publisher canvas interactions.
- Added the Phase 92.5 regression and production verification gate.

## 92.4 - Lint & Production Hardening

- Consolidated the Phase 92.3.1 lint-hardening fixes into the full project snapshot.
- Added the Phase 92.4 production verification gate.
- Added Phase 92.4 regression checks for the repaired lint blockers.
- Kept production certification gated on typecheck, lint, release tests, and web export.


## 92.3.1 - QA & Guides Quick Access

- Added always-visible Publisher **QA / Quality** quick access to the existing Prepress/Preflight manager.
- Added an always-visible **Guides** toggle wired to the existing layout-guide overlay.
- Preserved existing grid, snap, ruler, margins, bleed, safe-area, and smart-guide behavior.


## Phase 92.1 — Support Lifecycle & Help Hardening

- Added My Support Requests with ticket history, conversation replies, status tracking, and protected attachment download.
- Added administrator Support Inbox with search/filtering, staff replies, attachments, and Open/In Progress/Waiting for User/Resolved/Closed lifecycle.
- Added persisted support ticket messages and persisted FAQ/guide helpfulness feedback.
- Added stricter public support throttling, honeypot abuse protection, and server-side attachment signature validation.
- Added authenticated direct web attachment upload with guest/native compatibility fallback.
- Added richer safe support diagnostics and stricter Contact form disabled-state validation.
- Preserved Phase 92.0 open-source/community ecosystem completion and restored historical 91.18-91.20 release-note verification artifacts.
# Phase 91.13 - Real Photo Studio image tools

- Replaced Photo Studio's preview-only image provider with the secured Yaposan Photo Runtime.
- Connected Remove Background/Transparent/White/Custom Color to the self-hosted rembg U2Net/BiRefNet service.
- Added exact white and arbitrary six-digit HEX background output while preserving the untouched original.
- Changed Photo Studio AI buttons from selection-only controls to immediate executable actions with progress/error feedback.
- Connected Magic Eraser, AI Expand, Relight, Upscale, and Product Scene to the dedicated image-media provider contract; unconfigured providers now fail explicitly instead of returning the original image as fake success.
- Added local Docker Compose wiring for the background-removal service.

# Phase 90.14 — Static SEO Head and Production Web Startup Repair

- Fixed Expo static exports that produced an empty `<title data-rh="true"></title>`.
- Added a static `+html.tsx` SEO shell and deterministic post-export metadata repair.
- Preserved the Phase 90.2 Render static-site deployment model and Phase 90.4+ security controls.
- Strengthened production SEO verification and added Phase 90.14 regression tests.

## 1.0.0-rc.10

- Added bounded request complexity, rate limiting, file signature verification, and performance certification controls.

# Changelog

## 43.7.5

- Added 320 Phase 24.3D publication templates: 20 each across 16 publication categories.
- Preserved the 300 Phase 43.7.4 industry templates and all prior sidebar/template-browser changes.
- Expanded the verified template library from 1,685 to 2,005 templates.
- Added unique Collection III geometry, IDs, names, metadata, dimensions, editable pages/elements, and browser integration.

# Phase 25.33 — Advanced Template Engine and Quality Validation

- Added a production template quality-audit engine.
- Added weighted scoring for layout, typography, color, metadata, content, and editability.
- Added per-template findings, grades, pass/fail results, and whole-library summaries.
- Added automated Phase 25.33 tests and verification scripts.
- Updated package version to 25.33.0.

## 25.29.0 - Professional Template Category Completion
- Added 780 new editable professional templates.
- Added 20 new templates to each of the 39 visible sidebar subcategories.
- Completed Business, Marketing, Social Media, Print, and Office category coverage.
- Aligned template metadata exactly with every sidebar button so category clicks return populated galleries.
- Added Phase 25.29 coverage tests and documentation.

# 25.26.0 - Professional Template Library Part 2

- Added 100 new editable professional templates to the active template browser.
- Expanded the visible Phase 25 library from 100 Phase 25.25 templates to 200 Phase 25.25/25.26 templates, in addition to earlier handcrafted libraries.
- Added 10 templates each for Premium Brochures, Annual Reports, Magazines, Newsletters, Event Flyers, Posters, Resumes and CVs, Portfolios, Infographics, and Catalogs.
- Added 20 composition systems with five structural variants, multiple orientations, palettes, typography combinations, and content arrangements.
- Registered the new library in ALL_PROFESSIONAL_TEMPLATES for search, filtering, previews, and editor opening.
- Preserved all Phase 25.25.1 syntax fixes and earlier responsive template-browser improvements.

## 25.25.1 - Template Library Syntax Fix

- Fixed unterminated multiline string constants in `src/templates/phase2525ProfessionalTemplateLibrary.ts`.
- Replaced raw line breaks inside quoted strings with escaped `\n` sequences.
- Corrected the sidebar, card, and diagonal template layouts so the Phase 25.25 library can compile and load.
- Preserved all 100 Phase 25.25 templates and their active template-browser registration.


## 25.25.0
- Added 100 new active professional templates across 10 categories.
- Added ten distinct layout systems instead of palette-only duplicates.
- Registered Phase 25.25 templates in the live template browser.
# Phase 25.21 - Professional Template Quality Reset

- Removed the repetitive Phase 25.13, 25.18, and 25.19 generator collections from the active template browser.
- Kept the source modules exported for compatibility and future redesign work.
- The active library now prioritizes genuinely distinct handcrafted and premium templates instead of inflated duplicate counts.
- Added a disabled-template counter so quality cleanup is measurable.
- Updated the application version to 25.21.0.

# Phase 25.20.0

- Carried forward the full Phase 25.19 1,000-plus professional template library.
- Updated the home page to the approved Phase 25.15.5 Recent Projects home-page design.
- Restored the approved Yaposan Creative Suite sidebar logo and enhanced home hero styling.
- Preserved all template search, category, registry, and editor integrations from Phase 25.19.

## 25.18.0
- Added 507 registered editable templates across 39 subcategories.
- Expanded active template registry to more than 600 templates.
- Added 13 visual systems and six layout treatments with no person photography.

## 25.15.0

- Removed template library target-count cards from the template browser.
- Removed visible target numbers and “Library target” labels.
- Tightened the browsing flow by placing search directly beneath the hero.


## 25.12.0 - Three-Branch Consolidation

- Preserved the Phase 25.11 production/runtime baseline.
- Integrated the Phase 24.3 professional template browser into the live Templates route.
- Consolidated the no-people core template collection with the premium template expansion.
- Added one combined professional template registry and Phase 25.12 regression coverage.
- Removed the old count-focused generated library from the live template experience.
# Phase 25.11 — Final Regression, Runtime Validation and Release Certification

- Added unified Phase 25.0–25.11 regression verification.
- Added final release certification engine and editor workspace.
- Added runtime, TypeScript, integration, security, recovery, and documentation release gates.
- Added release reports, remediation guidance, and certification tests.

# Phase 25.7 — Professional Publishing Analytics

- Added publishing analytics engine, channel metrics, goals, insights, privacy controls, editor ribbon, modal workspace, tests, and documentation.

# Phase 25.6 — Professional Workflow Automation

- Added a dedicated Automation ribbon and professional workflow studio.
- Added rule triggers, conditions, actions, Safe Mode, run history, governance auditing, and adapter-ready publishing jobs.
- Added Phase 25.6 tests and verification scripts.

## 24.1.13 — Phase 24.1L
- Restored the real component-based Home page styling from Phase 24.0Z4.
- Removed the stretched screenshot and hotspot implementation introduced in Phase 24.1K1/K2.
- Restored the original dark navy surfaces, responsive sidebar, hero, cards, typography, spacing, shadows, gradients, and interactive controls.
- Preserved all routes and features added through Phase 24.1K2.


## 24.1.12 — Phase 24.1K2
- Removed the centered maximum-size Home canvas.
- Expanded the approved reference Home page to the full available viewport.
- Added independent X/Y scaling for interactive hotspots.
- Preserved all Phase 24.1K1 navigation and functionality.
## 24.1.9 - Phase 24.1J
- Restored 24.0Z4-style dark visual treatment.
- Widened desktop sidebar to 260 px.
- Added subtle top edge and corner lighting that does not recolor the background.
- Preserved all Phase 24.1I productivity features.


## 24.1.2 - Phase 24.1C

- Consolidated the Phase 24.1A functional workspace completion and Phase 24.1B home color update into the Phase 24.1C baseline.
- Preserved all existing functionality and routes.


## 24.1.8 — Phase 24.1I
- Added Professional Settings Center with persistent local preferences.
- Added searchable Learning Center and release-note hub.
- Added local Team Workspace with members, roles, and assignments.
- Added Productivity Center for batch and scheduled local jobs.
- Added persistent Macro Manager and productivity scoring.
- Added Phase 24.1I tests and documentation.

## 24.1.10 - Phase 24.1K
- Rebuilt the home page to match the supplied dashboard reference, including layout, colors, cards, side panels, typography, measurements, and navigation.

## 25.0.0 — Professional PDF Studio
- Added integrated PDF Studio ribbon and modal workspace.
- Added PDF import/export, page rotation/reordering/deletion, merge/split engine, OCR adapter, form fields, annotations, metadata, bookmarks, standards preflight, accessibility checks, optimization, and integrity signatures.
- Added Phase 25.0 verification tests and implementation documentation.

## 25.13.0 - Professional Template Mega Library
- Added 117 editable professional templates across 39 requested subcategories.
- Added grouped Business, Marketing, Social Media, Print, and Office browsing.
- Added collection target cards for the planned 5,140-template roadmap.
- Added no-people template artwork using editable typography, shapes, tables, and brand graphics.
- Added Phase 25.13 automated validation tests.

## 25.14.0 - Template Library Continuation Baseline
- Carried forward the complete Phase 25.13 Professional Template Mega Library.
- Updated the project version to 25.14.0.
- Added a Phase 25.14 baseline document for the next template expansion.
- Preserved all 117 editable templates, 39 subcategories, category browsing, roadmap cards, and no-people artwork policy.

## Phase 25.16
- Replaced the flat Popular publication types row with a colorful 3D publication tray.
- Added raised icon tiles, colored edge glows, depth shadows, and direct template-category navigation.

## Phase 25.17
- Carried forward the complete Phase 25.16 colorful 3D publication tray and category navigation.
- Preserved the Phase 25.15 template-browser target-card removal.
- Updated the project version to 25.17.0.
- Added the Phase 25.17 continuation baseline document.

## 25.19.0 — 1,000+ Professional Template Library
- Added 507 new editable templates across 39 professional subcategories.
- Added 13 new visual systems and alternate layout treatments.
- Registered the Phase 25.19 collection in the built-in professional template registry.
- Increased the generated Phase 25.13/25.18/25.19 library total to 1,131 templates, excluding existing flagship and premium collections.

## 25.21.1 - Safe Back Navigation Fix
- Fixed Expo Router development warning: `The action 'GO_BACK' was not handled by any navigator.`
- All back buttons now check `router.canGoBack()` before calling `router.back()`.
- When a page is opened directly and no navigation history exists, the back button safely returns to the home page.
## 25.22.0 - Safe Navigation Continuation Baseline
- Carried forward the complete Phase 25.21.1 safe back-navigation fix.
- Preserved the professional template quality reset and Phase 25.20 home-page integration.
- Retained safe home-page fallback when no previous navigator screen exists.
- Updated the project version to 25.22.0 for continued development.


## 25.23.0 - Responsive Template Grid Width Fix
- Removed the large unused space on wide template-browser screens.
- Added responsive card sizing based on the current window width.
- Automatically increases or decreases the number of template columns as the browser width changes.
- Preserved compact-grid and list-view behavior.
- Carried forward the Phase 25.22 safe-navigation baseline and template-quality reset.

## 25.24.0 - Responsive Template Browser Continuation Baseline
- Carried forward the complete Phase 25.23 responsive template-grid width fix.
- Preserved full-width template browsing on wide desktop screens.
- Retained automatic card resizing and responsive column counts.
- Preserved compact-grid, large-grid, and list-view behavior.
- Carried forward the Phase 25.22 safe-navigation protection and template-quality reset.
- Updated the project version to 25.24.0 for continued development.

## 25.27.0 - Professional Template Library Part 3
- Added 100 new editable professional templates across 10 additional subcategories.
- Added invitations, labels and packaging, menus, advertisements, social campaign sets, presentations, planners, certificates, book covers, and proposals/media kits.
- Every Phase 25.27 template uses distinct geometry, spacing, content structure, and editable vector/text elements rather than color-only variants.
- Registered all Phase 25.27 templates in the active built-in template browser.
- Increased the Phase 25.25-25.27 expansion by another 100 templates, targeting approximately 300 new templates across the three phases.


## 25.30.0 - Professional Template Quality Upgrade
- Reworked all Phase 25.29 category-completion templates with category-aware professional compositions.
- Added document-specific invoice, quote, receipt, report, proposal, newsletter, resume, flyer, poster, brochure, catalog, menu, social-media, card, label, ticket, coupon, and banner layouts.
- Replaced generic placeholder-style compositions with stronger typography hierarchy, editorial grids, structured data tables, realistic content blocks, and professional image-frame treatments.
- Preserved all 1,100 active templates and existing category coverage.
- Updated project version to 25.30.0.


## Phase 25.30.1 - Professional Template Design System
- Professional template audit.
- Improved typography hierarchy.
- Better spacing and grid consistency.
- Category-specific layout refinement.
- Enhanced preview consistency.
- Template quality scoring foundation.

## Phase 25.36 — 3D Home Pricing and Recent Project Order
- Added Free, $9.99, $19.99, and $39.99 pricing cards below Popular publication types.
- Added 3D card, icon, shadow, border-depth, and button styling.
- Moved Recent projects to the bottom of the home page after Publish channels.
- Added Phase 25.36 tests and verification scripts.

## Phase 25.36.1 — Template Syntax Fix

- Fixed the build-blocking malformed document-number string in `phase2529CategoryCompletionLibrary.ts`.
- Updated version to 25.36.1.

## 25.37.0

- Continued from the Phase 25.36.1 syntax-fix baseline.
- Preserved the 3D home pricing section and home-page content ordering.
- Added Phase 25.37 continuation documentation.

## 25.38.0

- Added 3D Recent projects cards with raised depth, accent edges, gloss, and pressed interaction.
- Added a professionalization pass across every active built-in template.
- Added category-aware typography, palette normalization, quality scoring, and full-library audit reporting.
- Added Phase 25.38 verification coverage.

## 25.39.0

- Continued from the Phase 25.38 professional template-system baseline.
- Preserved the 3D Recent projects and pricing-card home-page updates.
- Preserved the professional template enhancement and audit systems.
- Added Phase 25.39 release documentation.

## 25.40.0

- Added the professional template marketplace experience.
- Added Featured, Trending, New, Staff Picks, Premium, Free, Recently Used, and Favorites shelves.
- Added curated collections and a marketplace search hero.
- Improved all template cards and exact document previews.
- Prepared every active template with Phase 25.40 marketplace metadata and quality standards.

## 25.41.0

- Added a full professional template preview studio.
- Added multi-page navigation and a page thumbnail filmstrip.
- Added zoom, reset, and fit controls for the preview canvas.
- Added a template information inspector with fonts, colors, metadata, tags, and included features.
- Added a prominent Use this template workflow and improved favorite controls.

## 25.42.0

- Replaced the top home-page hero with the supplied Yaposan creative-suite artwork.
- Preserved a functional AI prompt input and Generate action over the new hero.
- Added responsive desktop and mobile hero treatment.
- Preserved all Phase 25.41 professional template preview features.

## 25.42.1

- Rebuilt the actual composition of every active template using eight modern layout systems.
- Added varied gradients, layered geometry, stronger typography, editorial spacing, and professional CTAs.
- Added full-library redesign auditing and Phase 25.42.1 validation.

## 25.42.2

- Corrected the home hero to use only the supplied wide Yaposan artwork.
- Removed the duplicate prompt bar and white hero panel.
- Restored a raised 3D framed treatment based on the earlier home-page design language.

## 25.42.3

- Reduced the home-page hero to the compact Phase 25.37-style height.
- Restored the AI prompt/search field and Generate button inside the hero.
- Preserved the corrected wide artwork and 3D border treatment.
- Added responsive desktop and mobile hero sizing.

## 25.42.4

- Corrected the home hero so the full headline, tablet, and stylus remain visible.
- Switched the hero artwork from cover cropping to contain scaling.
- Centered the hero in a balanced 1180px desktop frame.
- Increased spacing around the floating AI prompt bar while preserving the Phase 25.37-style 3D treatment.

## 25.42.5

- Reduced the home hero from 500 px to a compact 338 px desktop height.
- Removed the desktop max-width restriction so the hero spans the available workspace.
- Added a softened full-bleed artwork backdrop with the complete artwork centered above it.
- Reduced the prompt bar height and margins while preserving its functionality.

## 25.42.6

- Preserved the compact full-width hero dimensions from Phase 25.42.5.
- Added a wide hero artwork asset that fills the complete rectangle without blurred side panels.
- Reduced the tablet and stylus relative to the hero width so the full pen remains visible.
- Preserved the 3D frame, prompt field, and Generate action.
- Hardened font-family handling so non-string legacy values no longer crash project saving.


## 25.42.6.1

- Corrected the home hero artwork layering issue.
- Removed stretched duplicate artwork on the left and right sides.
- Kept a single clean hero image and the functional application prompt bar.
- Preserved Phase 25.42.5 dimensions and Phase 25.42.6 font safety.

## 25.42.6.2

- Fixed PublisherCanvas text rendering failures caused by non-string `fontFamily` values.
- Added safe text-path mode validation.
- Limited `textIndent` to web rendering.

## 25.42.6.3

- Updated the home sidebar to include Video Studio and Animation Studio in the requested order.
- Added working Video Studio and Animation Studio foundation routes.
- Expanded mobile navigation and added Phase 25.42.6.3 validation.

## Phase 30.0 — Web, Interactive and Creative Suite Completion
- Added responsive Web & Interactive Studio with content-block page building.
- Added desktop, tablet and mobile previews.
- Added SEO, custom-domain, forms, analytics and HTML/PWA/static ZIP export preparation.
- Added Presentation Studio, PDF & Document Tools, 3D & Mockup Studio and Marketing Center foundations.
- Added all five workspaces to the real home sidebar.

## 36.0.0

- Added Phase 36 Platform Evolution workspace.
- Added Packages 36.0 through 36.12.
- Added post-launch operations, reliability, analytics, experimentation, customer success, FinOps, governance, trust and safety, AI evaluation, scale, growth, maintenance and certification foundations.
- Added persistent evolution objectives and experiment registry.
- Added Phase 36 home navigation and validation tests.

## 40.0.0 — Phase 39 and Phase 40
- Added Phase 39 Packages 39.0–39.12 enterprise cloud, security, collaboration, administration, infrastructure, API, billing and test-certification controls.
- Added Phase 40 Packages 40.0–40.12 performance, studio integration, marketplace, production engines, documentation, accessibility, release and commercial-certification controls.
- Added persistent Enterprise Cloud Completion and Production Certification workspaces.
- Added evidence-based blockers so production certification cannot be claimed without external services and release artifacts.

## Phase 90.9 — Final Open-Source Security and Public Release Certification

- Tightened Gitleaks allowlist and final security verifier.
- Added AES-GCM AAD, explicit credential key versions, provider credential audit events, pinned-DNS/redirect-safe provider networking, request/concurrency/fairness limits, and transient-only retries.
- Removed the frontend public remove.bg API-key path.
- Added Dependabot and open-source security CI plus adversarial Phase 90.9 tests and public-release checklist.

## Phase 91.15 — 99–100% production certification
- Added real Photo Studio edited-image export on web and native runtimes.
- Hardened media-provider option merging so untrusted provider options cannot override trusted prompt/model fields.
- Added final 91.15 static/regression gate and local runtime certification report.
- Added acceptance coverage for difficult foregrounds, provider failures, save/reload, undo/redo, exports, security, and every universal creation route.

## 92.11 - Professional Font Completion

- Unified legacy text font pickers with the Publisher font catalog.
- Added Document Fonts and Missing views to Font Manager.
- Added Catalog / Installed / Embedded / Document / Missing badges.
- Added style metadata and variable-font indicators for common families.
- Added language aliases for multilingual font search.
- Added missing-document-font detection and ranked replacement candidates.
- Added browser runtime text-support checks for local/installed fonts.

- 92.14 certification follow-up: fixed final react-hooks/set-state-in-effect error in AI Provider Settings by moving hydration/connection state updates behind asynchronous completions.

## 92.16 - Release integrity recertification
- Synchronized package, lockfile, and release phase metadata.
- Added 92.15 and 92.16 regression gates and made the 92.14 baseline forward-compatible.

## 92.17 - CI AI Gateway Hardening
- Fixed Phase 71 CI provider-fallback testing after the pinned AI network transport replaced `globalThis.fetch`.
- Added stable invalid-provider-URL handling and Phase 92.17 regression coverage.

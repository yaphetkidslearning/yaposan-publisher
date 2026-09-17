# Yaposan 119.10.9 — Contributor-facing open-source presentation

- Makes the repository front page explain the Yaposan vision immediately.
- Adds a prominent **Help Build Yaposan** section for developers, designers, AI contributors, testers, accessibility contributors, and documentation contributors.
- Clarifies the core product direction: personal AI-powered Pages / digital spaces rather than a collection of unrelated creative tools.
- Explains the bring-your-own-AI direction and the goal of supporting external providers and supported local AI.
- Adds clear paths to Issues, Discussions, Pull Requests, contribution guidance, setup, testing, and security documentation.
- Keeps all 119.10.8 open-source readiness, secret scanning, GitHub workflows, homepage behavior, authentication, AI Page routing, and verified-email behavior.

# Yaposan 119.10.8 — Open-source readiness

- Refreshes README and contributor onboarding for the current product and release.
- Adds maintained open-source and public-release checklists.
- Adds a source-tree secret scan and strengthens the public preflight command.
- Replaces stale milestone-specific GitHub workflow commands with current neutral validation commands.
- Moves SBOM output to a neutral `artifacts/sbom` path.
- Keeps the MIT license, security policy, governance model, issue templates, Discussions templates, Dependabot, CodeQL, and pull-request workflow.
- Does not expose hosted production credentials, customer data, billing systems, or private infrastructure.

## Yaposan 119.10.7

119.10.7 keeps the 119.10.5 authentication and AI Page routing fixes and refines the public homepage responsive layout. The two-column desktop hero now remains side-by-side across normal laptop and desktop viewport widths, with a medium-width layout that reduces heading size and card spacing instead of prematurely stacking the hero. Mobile still stacks below 700px.

119.10.7 fixes authentication-state and AI Page navigation consistency across the public homepage, My AI Page, and Creator. Signed-in users now get My Page and Sign Out actions, existing personal pages reopen instead of starting a duplicate-creation flow, and the backend returns the existing personal page when creation is requested again. The production blueprint also reflects the working local-auth and verified-email configuration.

## Yaposan 119.10.4
- AI access layout cleanup: Connect Your AI Provider and Use Local AI now render as two wide rectangular cards across the available desktop width, with a normal center gap.
- Mobile behavior remains stacked at full width.

## 119.10.4
- Updated How Yaposan Works to lead with AI Page / Digital Space and bring-your-own-AI onboarding.
- Clarified customer-paid provider usage, local AI, FAQ, and glossary terminology.
- Changed Help workspace brand label from Yaposan Creative Suite to Yaposan.

## 119.10.2 — Version alignment fix

- Fixed runtime/API release version alignment so `npm run web` recognizes the API as the same release.
- Aligned `package.json`, `package-lock.json`, `app.json`, `server/index.ts`, and current-release tests to 119.10.2.
- Preserves the 119.10.1 SEO metadata and 119.10 Bring Your Own AI changes.

## 119.8.1 — Homepage Background Restore

- Restored the public homepage hero background treatment to the clean 118.9-style light surface instead of the generated full-bleed image.
- Kept all 119.8 messaging, navigation, mobile responsiveness, early-access, feedback, and dark-mode improvements intact.
- Removed the hero image overlay/shade so the homepage content remains clean and readable across desktop and mobile.

# Release Notes

## 119.8.0 — Homepage clarity, mobile UX, and early access
- Repositioned Yaposan around its core value: an AI-powered personal/public space, with creator tools supporting that space.
- Simplified the public navigation and made the primary actions Create My AI Page and Explore Creator Tools.
- Improved mobile behavior with a dedicated compact hero treatment, readable typography, stacked calls to action, compact navigation, and responsive early-access form.
- Verified the global HTML viewport meta tag remains present for correct phone-width rendering.
- Added a one-field early-access request form backed by the existing support-ticket API, plus a direct bug/feedback path.
- Added clearer messaging for bring-your-own AI providers, community, content, and the open-source direction.
- Changed first-time guidance so it no longer automatically sits above the public homepage hero; it still opens when explicitly requested with the guided-tour route.
## 119.7.3
- Welcome hero now fits the desktop browser viewport at 100% zoom.
- Desktop background fills the available viewport below the header while keeping the hero copy on the left and the laptop/phone visible on the right.
- Compact/mobile layout keeps the original contained artwork behavior.
## 119.7
- Welcome header simplified to My Page/Sign in and Light/Dark only.
- Added Yaposan Creative Suite logo to the top-left Welcome header.
- Reduced header-to-hero spacing and moved hero content upward while preserving the existing background artwork.

# Yaposan 119.6.2

- Prevent the global DM dock from crashing the application when the API is temporarily unreachable.
- DM polling, message loading, read-state updates, and send operations now handle network failures locally.
- Adds a retry state for the DM dock while allowing the rest of Yaposan to continue running.
- Preserves the 119.6.1 Welcome hero and all existing functionality.

# Yaposan 119.6.1

## Welcome hero layout refinement

- Constrains the live Welcome-page copy to the left side so it no longer crosses over the laptop and phone artwork.
- Replaces the hard half-page readability block with progressively lighter left-side shading, leaving the right-side artwork clear.
- Preserves the existing cosmic background, Light/Dark toggle, below-hero sections, privacy controls, DM popup, profile privacy, and My AI Page behavior.

- Keeps the supplied cosmic Welcome artwork at full clarity on the laptop/phone side of the hero.
- Restricts the readability shade to the left text area only; compact/mobile layouts shade the full hero for legibility.
- Preserves the 119.5.2 hero boundary, Welcome content, privacy controls, profile-modal fix, DM popup, and navigation behavior.

# Yaposan 119.5.0

- Removed Friends-only from the active post audience UI; supported choices are Private, Followers only, Public, and Specific people.
- Legacy friends-audience posts are normalized to Followers only for compatibility.
- Privacy audience picker now renders in a modal layer so it cannot be clipped by post/composer containers.
- Added the supplied Yaposan cosmic artwork as the Welcome page background while keeping live page content interactive.
- Added persistent Light/Dark controls to the Welcome page.
- Preserved existing 119.4.1 DM popup, post/chat separation, profile privacy, and navigation behavior.

# Yaposan 119.4.1

119.4.1 completes the My Page privacy and navigation refinement.

- Replaces the old three-button post audience row with a compact privacy menu on composers and existing posts.
- Supports real Private, Friends only (mutual follows), Followers only, Public, and Specific people post audiences.
- Specific people are selected from eligible Page followers/members and validated as active accounts before saving.
- Private posts are limited to the author and Page admins rather than ordinary Page viewers.
- Consolidates reactions into Like, Dislike, and one expandable emoji picker; comments and replies use the same compact controls.
- Adds field-level profile visibility for display name, email, bio, website, location, profile photo, and cover image; all default to Private.
- Hides account email from the My Page sidebar unless the owner explicitly makes it visible through profile privacy.
- Keeps one Home entry and adds explicit Creator Home and Website Home destinations so users can move between My Page, Creator, and the public website.
- Preserves the global DM popup dock, Post/AI Chat separation, and customizable top bar/sidebar.
- Uses the supplied Yaposan social/creator hero artwork on the public website home page.

# Yaposan 119.4.0

My Page social and navigation customization release.

- Separates **Posts** from **AI Chat**. Posts are no longer presented as "Chat & Posts".
- Keeps **Post** fixed at the left of the My Page top bar and **Dark/Light** fixed at the right.
- Adds a **Customize top bar** control so users can choose and reorder My Work, Shared with Me, Analytics, DM, Publish AI Page, Channels, and Chat.
- Adds **Customize sidebar** so users can choose which sidebar sections are shown and move them up or down. The existing sidebar remains the default.
- Changes the My Page **DM** top action to open the global DM popup/dock instead of navigating away.
- Upgrades My Page post cards with reactions, bookmark, repost, comments, nested replies, and comment/reply reactions.
- Adds persisted comment reactions in local and PostgreSQL database adapters.

# Yaposan 119.3.4

119.3.4 consolidates the production cleanup after comparing 119.3.2 FINAL, 119.3.3, and 119.3.3 FIXED. It retains the corrected Story privacy type, restored project import/export API, and ESLint flat configuration from FIXED; preserves the phase-free production tree; restores the useful SBOM generator without restoring historical release clutter; and strengthens the current-release regression against numbered Phase labels in customer-facing UI source.

# Yaposan 119.3.4

119.3.4 is a production-source cleanup and continuity release built from 119.3.2.

## What changed

- Removed historical milestone documentation, old validation evidence, obsolete release artifacts, editor-specific AI instruction files, and other non-runtime clutter from the distributable source tree.
- Renamed active backend, utility, component, service, and template source files so production source filenames no longer expose numbered milestone naming.
- Removed numbered milestone wording from user-facing application text, template tags, exported report filenames, and current release UI labels.
- Preserved legacy storage keys and internal compatibility fields where changing them could break existing saved projects or browser data.
- Simplified `package.json` from hundreds of historical commands to a focused production command set with neutral names.
- Replaced historical source-packaging and release-manifest commands with neutral current-release implementations.
- Preserved the 119.3.2 Page, DM, social, privacy, media, dashboard, and local-development improvements.
- Added a 119.3.4 current-release regression suite that checks cleanup rules and core 119.x functionality.

## Compatibility note

Some internal object properties and storage keys still contain legacy version identifiers for backward compatibility with existing saved projects. They are not shown as numbered milestones in the customer-facing UI.

- Fixed React hook lint errors in creator-page, dm-page, and social-media by avoiding synchronous state updates directly inside effects.

## 119.5.1

- Constrains the cosmic Welcome artwork to the hero only.
- Restores a solid light/dark background for "Start with what you need today" and all lower Welcome-page content.
- Adds an explicit visual boundary between the hero and lower content so the hero image cannot bleed behind later sections.
- Keeps 119.5 post privacy, reactions, DM popup, profile privacy, profile-modal scrolling, and My AI Page behavior unchanged.
- Welcome hero desktop artwork keeps the 119.7.1 sizing and is shifted slightly downward so the laptop top is fully visible at 100% browser zoom without the right-side crop introduced by scaling.

## 119.10.0 — Bring Your Own AI
Yaposan now presents a simpler AI model: connect your own AI provider or supported local AI. Community-funded AI and Yaposan AI Credits are no longer offered in the customer-facing AI access experience. Publisher remains usable for core editing without AI; AI-powered Photo Studio and Yaposan AI actions are described as using the customer's configured provider/local AI.

## 119.10.1
SEO positioning now presents Yaposan first as a platform for creating an AI-powered page and digital space. Global search/social metadata emphasizes connecting a preferred AI provider or local AI while keeping creative tools as supporting capabilities.

## 119.10.7
This release fixes the inconsistent homepage layout seen when opening `yaposan.com` directly versus returning through the in-app Website Home action. Web responsiveness now uses canonical CSS media queries so route entry method and browser history do not change the desktop layout.

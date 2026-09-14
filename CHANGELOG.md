## 119.10.4
- Expanded the two AI access cards to fill the desktop row evenly, removing the large empty center gap.
- Kept 100% stacked cards on mobile and equal-height desktop cards with aligned actions.
- Removed obsolete phase-specific homepage markdown files from the release root.

## 119.10.4
- Updated How Yaposan Works to lead with AI Page / Digital Space and bring-your-own-AI onboarding.
- Clarified customer-paid provider usage, local AI, FAQ, and glossary terminology.
- Changed Help workspace brand label from Yaposan Creative Suite to Yaposan.

## 119.10.2

- Fixed runtime/API release version alignment so `npm run web` recognizes the API as the same release.
- Aligned `package.json`, `package-lock.json`, `app.json`, `server/index.ts`, and current-release tests to 119.10.2.
- Preserves the 119.10.1 SEO metadata and 119.10 Bring Your Own AI changes.

## 119.8.1 — Homepage Background Restore

- Restored the public homepage hero background treatment to the clean 118.9-style light surface instead of the generated full-bleed image.
- Kept all 119.8 messaging, navigation, mobile responsiveness, early-access, feedback, and dark-mode improvements intact.
- Removed the hero image overlay/shade so the homepage content remains clean and readable across desktop and mobile.

# Changelog

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

## 119.6.2
- Hardened global DM networking so a stopped/unreachable local API no longer produces an uncaught Expo error screen.

## 119.6.1
- Refined the Welcome hero so headline/copy stay within a dedicated left column.
- Replaced the hard overlay edge with layered soft shading on the left only.
- Kept the laptop and phone artwork unobstructed on desktop.

## 119.5.3
- Refined Welcome hero overlay so the computer and phone remain clear while left-side copy stays readable.

## 119.5.0

- Removed Friends-only from the active post audience UI; supported choices are Private, Followers only, Public, and Specific people.
- Legacy friends-audience posts are normalized to Followers only for compatibility.
- Privacy audience picker now renders in a modal layer so it cannot be clipped by post/composer containers.
- Added the supplied Yaposan cosmic artwork as the Welcome page background while keeping live page content interactive.
- Added persistent Light/Dark controls to the Welcome page.
- Preserved existing 119.4.1 DM popup, post/chat separation, profile privacy, and navigation behavior.

# Yaposan 119.4.1

- Compact per-post privacy control and compact Like/Dislike/emoji reactions.
- Comment and reply reactions use the same compact controls.
- Profile email is hidden from My Page by default.
- Simplified Page navigation with Creator Home and Website Home destinations.
- Public website hero now uses the supplied Yaposan social/creator background artwork.
- Preserves DM popup, customizable top bar/sidebar, and private-by-default posting.

# Changelog

## 119.3.4

- Removed obsolete development-history documents, validation snapshots, legacy release evidence, unused assets, and editor-specific internal instruction files from the distributable source tree.
- Renamed active runtime source files and backend modules to functional production names.
- Removed numbered development labels from customer-facing UI, template tags, exported report filenames, release screens, and product-photo exports.
- Simplified `package.json` from hundreds of historical commands to a focused production command set.
- Added a neutral CI workflow and current-release regression suite.
- Preserved Page presentation persistence, the stale cloud/local-state fix, global DM/read-state behavior, real dashboard counters, public Page actions, social privacy defaults, device media selection, expanded social navigation, and local-development media rendering.

## 119.3.2

- Expanded Page/social/DM functionality, persistent profile and cover presentation, mobile Page navigation, dashboard summaries, public follow/DM actions, social privacy controls, media upload UX, search/navigation improvements, and local media rendering.

- Fixed React hook lint errors in creator-page, dm-page, and social-media by avoiding synchronous state updates directly inside effects.

- Welcome hero desktop artwork keeps the 119.7.1 sizing and is shifted slightly downward so the laptop top is fully visible at 100% browser zoom without the right-side crop introduced by scaling.

## 119.10.0
- Simplified AI access to customer-owned providers or supported local AI.
- Removed Community AI and Yaposan AI Credits from the customer-facing AI access UI.
- Clarified that provider AI usage is billed directly by the customer's provider, not Yaposan.
- Updated Publisher, Photo Studio, and Yaposan AI messaging so AI-powered actions use the customer's configured provider/local AI while core non-AI editing remains available without AI.
- Added explicit UI policy that an unconfigured AI action should request a provider connection rather than silently use Yaposan-paid cloud AI.

## 119.10.1 — SEO positioning refresh
- Updated the global SEO title to "Yaposan — Create Your Own AI Page & Digital Space".
- Updated the global meta description around AI Pages, customer-selected AI providers/local AI, publishing, creative tools, and digital spaces.
- Open Graph, Twitter/X metadata, and JSON-LD structured data now inherit the same positioning from the global SEO source of truth.
- Updated the Expo application description to match the new positioning.

# Phase 91.15 — 99–100% acceptance gate

Phase 91.15 is the final acceptance layer for the scope defined through 91.14. Passing source tests alone is not called 100%; the local runtime and real configured providers must also pass.

## Automated gate
Run `npm ci`, then `npm run verify:phase91.15`. Start `docker compose up --build background-removal`, `npm run server`, and `npm run web`. With an authenticated access token and a real sample image, run `YAPOSAN_ACCESS_TOKEN=... PHASE9115_SAMPLE_IMAGE=/path/image.png npm run certify:local:91.15`.

## Photo Studio acceptance
Remove Background must create a complete foreground cutout. Transparent must preserve alpha. White must be exact #FFFFFF. Custom background must match the selected color. Original must restore the untouched source. Before/After must compare the original and edited outputs. Test fine hair, thin structures, glass, clothing, furniture, shadows, white-on-white, dark-on-dark and a busy outdoor background.

Magic Eraser must use a real mask and remove only the masked content. AI Expand must generate new surroundings for 1:1, 4:5 and 16:9 rather than stretch the source. Relight must visibly respond to direction and strength. Upscale 2x/4x must produce genuinely larger useful output. Product Scene presets must be visibly different while preserving product identity.

## Reliability and state
Perform Save/reload after edits. Refresh the browser and reopen the project. Run Undo/Redo through Remove BG, custom background and another edit and verify the exact intermediate states. Export the edited image and open it outside the application.

## Provider failure paths
Test invalid API key, provider timeout, quota exceeded, malformed provider response and offline networking. Every case must give a useful error and preserve the existing project. No tool may report success while returning the unchanged original image.

## “What will you create today?” routes
Run a real acceptance prompt for every route: Design, Image, Video, Website, Presentation, Document, Social, Marketing, Audio, App and Automation. Each advertised route must understand the request, plan it, execute every configured provider lane, persist the project, open the correct destination and remain editable.

Image, Video and Audio lanes are only certified when a real provider is configured and an end-to-end output is generated, retrieved, persisted and opened. A missing external provider is displayed as unavailable and is never represented as successful generation.

## Export and persistence
Verify supported exports for the generated destination studios (image, PDF/document, website, video, audio and presentation where supported by the studio). Reopen saved generated projects after browser refresh and, when applicable, after sign-out/sign-in.

## Security
Provider credentials remain server-side. Inspect the web bundle and browser network traffic: no provider API secret may be present. Provider options may not override the server-trusted prompt/model fields.

## 99–100% definition
The phase is accepted at 99–100% only when typecheck, regression tests, static checks, web build, API startup, background-removal readiness, browser smoke, real-image output, configured image/video/audio provider tests, save/reload, Undo/Redo, export, negative provider tests and console/network review all pass. Any advertised lane without a working configured provider remains below 100% operational readiness.

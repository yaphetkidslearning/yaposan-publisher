# Phase 91.12 — Creation Project Completion

Phase 91.12 closes the largest gaps found in the 91.11 “What will you create today?” audit.

## Added

- Persistent Creation Project Store: generated plans, provider output, and media assets survive navigation and are referenced by `creationProject`.
- Publisher adapter: Yaposan Create can now materialize a real `PublisherProject` with editable text, layout objects, and generated imagery when available.
- Web Studio adapter: website creation prompts materialize into real editable web blocks plus generated SEO metadata.
- Presentation adapter: Presentation Studio now consumes the creation project and opens an editable slide deck instead of a static feature shell.
- Dedicated media provider runtime: image, video, and audio use `/api/v1/ai/media/generate` rather than pretending a chat-completions endpoint is a media generator.
- Media job status/cancel endpoints for asynchronous providers.
- Generated asset capture in the Creation Project Store.
- Persistent AI App specifications.
- Persistent AI Agent workflows and execution-history storage foundation.
- Result actions continue to operate against the same saved creation project identifier.

## Provider contract

Dedicated image/video/audio providers are configured through `AI_<KIND>_PROVIDER_*` environment variables. Providers may return a direct asset URL or an asynchronous job id. This makes provider integration real while avoiding hard-coded dependency on a single vendor.

## Honest boundary

91.12 supplies the end-to-end Yaposan architecture and real studio handoffs. Actual cloud image/video/audio generation still requires valid configured provider credentials/endpoints. App specifications are editable/persistent application definitions; arbitrary generated application code is not executed without a sandbox/deployment target. Scheduled agent execution requires the existing automation runtime or an external scheduler/worker to invoke saved workflows.

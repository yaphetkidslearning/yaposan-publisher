# Phase 17.16 — AI Image Studio Integration

Phase 17.16 adds a native AI image-processing workflow to Yaposan Photo Studio.

## Included

- Unified AI tool panel
- Background removal, white background, transparent PNG
- Magic Eraser workflow
- AI Expand, Relight, Upscale, and Product Scene workflows
- Provider routing and capability checks
- remove.bg provider support through `EXPO_PUBLIC_REMOVE_BG_API_KEY`
- Safe local preview provider when a live service is not configured
- Queue status, progress, cancellation, completion, and failure handling
- Non-destructive project-history integration
- Phase 17.16 automated tests

## Provider note

Live cloud AI output requires the corresponding API provider and key. The local provider keeps the complete UI, queue, history, and provider architecture operational without falsely presenting unchanged pixels as cloud-generated AI output.

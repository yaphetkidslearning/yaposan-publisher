# Phase 91.11 — Creation Runtime and Server Repair

Phase 91.11 hardens the 91.9/91.10 universal creation platform and repairs the Product Photo server regressions inherited from 91.8.

## Server repairs

- Removed the accidental `/api/v1/internal/product-photo/process-next` route embedded inside `/api/v1/auth/refresh`.
- Preserved the canonical Product Photo worker route before normal access-token authentication.
- Wrapped `server/productPhotoBatchWorker.ts` startup and processing loop in `async function main()` and added fatal-error handling.

## Creation runtime completion

- Universal `What will you create today?` prompt remains the primary entry point.
- Intent routing covers Design, Image, Video, Website, Presentation, Document, Social, Marketing, Audio, App, and Agent/Automation.
- Creation planner produces required/optional capability steps and destination studio handoff.
- Connected provider execution can use the authenticated `/api/v1/ai/generate` gateway for supported lanes and falls back safely when a media provider is unavailable.
- Provider execution metadata is retained with the assembled editable project.
- Cross-studio orchestration is defined for every creation kind.
- Creation mode selector now exposes Automation and More in addition to the existing categories.
- App Studio draft now includes screens, data schema, authentication roles, workflows, integrations, and deployment targets.
- Agent Studio creates editable manual/scheduled/event workflows and hands them to Automation Center.
- Unified result actions are executable: Edit, Regenerate, Variations, Change Style, Resize, Translate, Animate, Export, Publish.

## 91.9 + 91.10 audit

1. Universal Create prompt — present and wired from Home to Yaposan Create.
2. AI Intent Router — present for all target creation categories.
3. AI Planner / Orchestrator — present, including multi-capability plans.
4. Real generation providers — connected to the existing authenticated server AI gateway for supported lanes; dedicated video/audio providers remain explicit provider requirements rather than fake local generation.
5. Prompt to editable project — assembled project retains source prompt, plan id, destination, sections, assets, and generated provider output.
6. Multi-AI orchestration — cross-studio workflow plus per-capability provider execution metadata.
7. Creation mode selector — Design, Image, Video, Website, Presentation, Document, Social, Marketing, Audio, App, Automation, More.
8. AI App Builder — richer editable app-project foundation with schema/auth/workflows/integrations/deployment.
9. AI Agents / Workflows — dedicated Agent Studio and Automation Center handoff.
10. Unified result screen — all requested actions are interactive controls.

Phase 91.11 does not claim that a video/audio cloud provider exists when none is configured. Those lanes remain explicit connected-provider requirements.

# Phase 25.6 — Professional Workflow Automation

Phase 25.6 adds controlled publishing automation to the existing Yaposan editor while retaining Phases 25.0–25.5.

## Integrated capabilities
- Dedicated Automation ribbon and workflow studio
- Manual, project-open, project-save, asset, approval, and schedule trigger models
- Conditional rule evaluation
- Multi-step workflows for preflight, PDF export, asset packaging, backup, notification, template application, and publishing adapters
- Safe Mode for review-before-publish governance
- Pause, activate, and run-now controls
- Deterministic local execution history
- Per-step status and messages
- Retention and concurrency policies
- Automation readiness audit
- Adapter-ready architecture for external job runners, notification services, and publishing channels

## Safety and production boundary
The included local adapter simulates deterministic completion for editor-side workflow validation. External publishing, notification, and scheduled server execution require configured service adapters and credentials outside project files.

## Verification
Run `npm install` followed by `npm run verify:phase25.6`.

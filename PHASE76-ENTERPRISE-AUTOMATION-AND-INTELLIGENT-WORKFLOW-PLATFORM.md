# Phase 76 — Enterprise Automation and Intelligent Workflow Platform

Phase 76 begins the Yaposan 2.0 feature roadmap by adding a production-oriented automation domain model and execution planner.

## Implemented

- Manual, scheduled, webhook, and domain-event triggers
- Nested condition evaluation
- AI, project, asset, export, publishing, approval, notification, connector, and webhook actions
- Connector registry for Microsoft 365, Google Workspace, SharePoint, OneDrive, Dropbox, Box, Slack, Teams, Zapier, Make, and custom integrations
- Workflow validation, action retries, timeouts, concurrency, and monthly quotas
- Approval-aware execution plans
- AI-credit estimation
- Deterministic input and audit checksums
- Signed webhook payloads with replay-window protection
- Aggregated workflow execution analytics
- Dedicated Phase 76 regression tests

## Production activation

External connectors require their own OAuth applications or API credentials. Scheduled and asynchronous execution should be attached to the Phase 73 worker/queue infrastructure and persisted through the Phase 69 database adapter.

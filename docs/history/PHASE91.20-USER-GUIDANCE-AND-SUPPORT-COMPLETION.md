# Phase 91.20 — User Guidance & Support Completion

Phase 91.20 completes the last-mile Help/FAQ/Troubleshooting/Contact improvements identified during the 91.18 audit while preserving the 91.19 open-source/community work.

## Added / fixed

- Real Yaposan support-ticket storage through `POST /api/v1/support/tickets`.
- Optional support attachments are read from the selected file, validated (type/size), uploaded to Yaposan object storage, and linked to the stored ticket.
- Support tickets have a persistent PostgreSQL table and an in-memory development equivalent.
- Public support submission is protected by the existing origin controls plus a dedicated support-request rate limiter.
- Contact now carries source studio, route, action, and visible error from contextual report links.
- Contact validates name, email, subject, description, attachment type, and 10 MB attachment limit.
- Successful support submission returns a real ticket ID and Open status. External email/help-desk forwarding is not falsely claimed.
- Shared workspace shell includes both contextual **Help** and **Report** controls.
- Onboarding can be restarted from Help and Settings; the Home route supports `?tour=1`.
- FAQ expanded to 59 entries, including Video, Audio, Publisher, Templates, App Studio, collaboration, account deletion, provider-error details, export limitations, and support attachments.
- FAQ answers support query deep links (`/faq?question=<id>`), accessible expanded/collapsed state, and Yes/No helpful feedback.
- Help includes topic fallback guidance, searchable guide + FAQ results, direct answer links, restart-tour action, and helpful feedback.
- Troubleshooting adds Refresh/Retry readiness checks and direct Configure/Open actions for Image, Video, Audio, and Background Removal.
- Photo Studio shows an inline failed-job help block with Troubleshoot and contextual Report actions.
- Shared Help/Contact layouts use wrapping/min-widths to remain usable on smaller screens.

## Verification

Run locally:

```bash
npm ci
npm run verify:phase91.20
```

The release gate runs TypeScript, 91.18/91.19/91.20 tests, static verification, and the production web export.

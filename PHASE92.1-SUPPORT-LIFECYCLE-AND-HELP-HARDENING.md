# Phase 92.1 — Support Lifecycle and Help Hardening

Phase 92.1 completes the last-mile support system on top of the Phase 92.0 open-source/community baseline.

## Added
- **My Support Requests**: authenticated users can list their tickets, open a conversation, see lifecycle status, download their original attachment, and reply.
- **Support Inbox**: configured administrators can search/filter tickets, review source diagnostics, download attachments, reply, and move tickets through Open, In Progress, Waiting for User, Resolved, and Closed.
- **Conversation history**: support ticket messages are persisted separately from the original request.
- **Persisted help feedback**: FAQ and guide Yes/No feedback is stored by the backend, including anonymous feedback when appropriate.
- **Attachment hardening**: server-side file-signature checks validate PNG/JPEG/WebP/GIF/PDF/ZIP and text/JSON content rather than trusting MIME type alone.
- **Authenticated direct support uploads**: signed-in web users upload attachment bytes separately before ticket creation; Base64 JSON remains a compatibility fallback for guest/native flows.
- **Abuse controls**: public support creation uses a lower bounded rate limit plus a hidden honeypot field.
- **Richer safe diagnostics**: reports may include timestamp, screen size, browser user-agent, Yaposan version, platform, source studio/page, and action. Secrets are not intentionally collected.
- **Contact validation**: Submit is actually disabled until required fields are valid.

## Database
Adds `support_ticket_messages` and `help_feedback` storage and expands support ticket status lifecycle.

## Verification
Run:

```bash
npm ci
npm run verify:phase92.1
```

The local release gate includes Phase 92.0 community checks, Phase 92.1 support tests, TypeScript, lint, and the production web build.

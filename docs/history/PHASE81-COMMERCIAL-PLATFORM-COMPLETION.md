# Phase 81 — Commercial Platform Completion

This release consolidates the practical Phase 81–83 commercial-platform foundation into Phase 81.

Implemented in code:

- Organization roster and current-user role discovery.
- Owner/admin member management for registered Yaposan users.
- Owner, admin, editor, and viewer roles.
- Project archive, favorite, tags, trash, and restore lifecycle API.
- Version restore that creates a new revision and preserves history.
- Secure random share-link tokens with hashed server records, access level, optional expiry, and password-hash support.
- Notification feed derived from production audit activity.
- Owner/admin operations dashboard covering users, projects, trash, storage, subscriptions, and queued jobs.
- Authenticated Team & Admin page linked from Account.
- Regression coverage for team roles, lifecycle controls, version restore, share links, and notifications.

Production notes:

- Invited users must register before an owner can add them. Email-delivered pending invitations can be added once the transactional email provider is activated.
- Share-link creation is implemented; the anonymous public share viewer remains disabled until final domain and content-security rules are approved.
- Existing collaboration comments, approvals, presence, project versions, billing, usage limits, guest mode, cloud save, and secure export from earlier phases are preserved.

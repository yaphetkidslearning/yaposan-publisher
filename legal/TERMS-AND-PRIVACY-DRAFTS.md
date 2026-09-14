# Legal document checklist

This repository includes implementation placeholders and review checklists, not final legal advice. Before commercial release, qualified counsel must approve Terms of Service, Privacy Policy, Cookie Policy, AI-use policy, copyright/takedown policy, marketplace creator agreement, data-processing agreement, GDPR/CCPA procedures, accessibility statement, retention policy and third-party license inventory.

## Phase 105 product privacy commitments for counsel review

These are product requirements reflected in the Phase 105 implementation and should be translated into final legal language by qualified counsel:

- A Yaposan Space is private by default and is not made public when a creator enables a public creator page.
- Public pages are projections of only the resources a creator or authorized Space admin explicitly marks public.
- New posts, AI resources, Studios, projects and Store products should default to private unless the creator deliberately changes their sharing state.
- Yaposan should not sell personal data or provide third parties with social-graph, follower, contact, team-member, private-file, private-project, prompt, credential or private-work access merely because another user authorized an app or connection.
- External AI/API/compute connections should receive only the minimum data needed for an explicit user-requested operation and only within an active, user-controlled data grant.
- No "friend-of-friend" or transitive permission model is permitted. One user's consent cannot authorize disclosure of another user's private data.
- Credential references, secrets, private prompts, workflow graphs and private Space resources must not be included in public API projections.
- Privacy and sharing changes should be auditable, and users should be able to revoke external data grants.
- Marketplace publication is a separate creator action from making a creator page publicly discoverable.

This section is an engineering/product specification, not a final Privacy Policy or legal representation.

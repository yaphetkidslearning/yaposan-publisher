# Phase 91.2 — Organization-Neutral Product Photo Platform

Phase 91.2 removes customer-specific branding from the Yaposan Product Photo Engine so the same workflow can be offered to nonprofits, retailers, resellers, marketplaces, ecommerce teams, warehouses, auction businesses, and other organizations.

## Changes

- Product Photo Studio is branded only as Yaposan.
- The default product preset is `marketplace-product`, not tied to any customer name.
- White-background output is labeled `Catalog white`.
- Pilot, benchmark, release, and quality evidence use organization-neutral terminology.
- Current product-photo API/service code contains no customer-specific name.
- Historical Phase 91.0/91.1 artifacts required by release tests were renamed to organization-neutral equivalents.
- The source release gate checks that customer-specific branding cannot return to the current product-photo surface.

## Product positioning

Yaposan Product Photo Studio is a general product-imaging workflow. Organizations can use the same core engine while applying their own presets, policies, quotas, and branding through configuration rather than forks or hard-coded customer names.

## Verification

```bash
npm run test:phase91.2
npm run check:phase91.2
npm run verify:phase91.2
```

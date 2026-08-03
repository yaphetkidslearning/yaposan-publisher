# Phase 17.17 — Commerce Studio Final Integration

Phase 17.17 completes the planned GWC Studio migration into Yaposan by adding native commerce workflows.

## Included

- Product listing generator and editor
- SKU, category, price, inventory, description, image, tag, and channel data
- eBay, Etsy, Shopify, and Amazon connection-state management
- Marketplace-ready listing validation
- Batch publishing queue with progress, cancellation, results, and retry-ready history
- CSV marketplace export
- Commerce metrics and per-channel analytics
- Local persistence through the shared Yaposan application
- Responsive 3D commerce UI

## Provider boundary

The workflow, models, queues, validation, export, connection state, and analytics are implemented locally. Actual marketplace publishing requires the user's OAuth credentials and marketplace API approval. No credentials are embedded in the project.

## GWC Studio migration result

The standalone GWC Studio feature areas planned for migration are now represented inside Yaposan:

- Phase 17.15: Photo Studio core
- Phase 17.16: AI Image Studio
- Phase 17.17: Listing, marketplace, automation, export, and analytics workflows

The standalone codebase may be archived after a final environment-specific verification of external API credentials.

# Phase 17.14 — Creative Suite Home and Photo Studio

Phase 17.14 modernizes Yaposan's entry experience before the Phase 18 painting engine.

## Creative Suite launcher

- Publisher, Photo Studio, and Yaposan AI are first-class workspaces.
- The sidebar is collapsible and every item uses a real icon and route.
- Responsive desktop, compact desktop/tablet, and mobile navigation are included.
- The AI prompt is retained as a prominent launcher.

## Premium 3D interaction

Cards and primary controls include:

- raised bottom depth and soft shadow
- hover lift
- icon feedback
- pressed movement
- dark-blue pressed edge
- reduced pressed shadow
- accessible button labels

## Photo Studio migration

A new `/photo-studio` workspace organizes the most useful concepts from the unfinished GWC Studio project:

- background removal
- Magic Eraser
- AI Expand
- relighting
- upscaling
- product scenes
- transparent PNG workflows
- batch processing

The workspace intentionally launches the existing Yaposan editor and Phase 17 raster system instead of creating a second duplicate editor. This preserves one project model, one asset library, one export system, and one undo/history architecture.

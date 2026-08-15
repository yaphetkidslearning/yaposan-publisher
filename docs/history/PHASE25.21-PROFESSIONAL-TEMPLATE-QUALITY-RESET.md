# Phase 25.21 - Professional Template Quality Reset

## Purpose

The Phase 25.13, 25.18, and 25.19 generated collections repeated one shared visual composition across many page sizes and categories. This made the browser report a large template count while the designs appeared nearly identical.

## Changes

- Generator-based Phase 25.13, 25.18, and 25.19 templates are no longer registered in the active browser.
- Their files and exports remain in the project so references do not break and they can be redesigned later.
- Active templates now come from `realProfessionalTemplates.ts` and `phase243dPremiumTemplates.ts`.
- The home page from Phase 25.15.5 and the rest of Phase 25.20 remain unchanged.

## Quality rule going forward

A template must have a meaningfully different composition, typography system, spacing, hierarchy, graphics, and content structure. Recoloring or resizing one master layout does not count as a new professional template.

# Phase 91.14 Photo Quality Acceptance

Run this checklist after `npm run verify:phase91.14` and after starting the API, web app, and background-removal service.

## Background removal acceptance set

Test at least one image in each category:

- Person with loose/fine hair against a busy background.
- Product with thin edges, cables, handles, or spokes.
- Glass or translucent object.
- Clothing/fabric with folds and fuzzy edges.
- Furniture with gaps between legs/arms.
- Product with a natural contact shadow.
- Very light object on a light background.
- Very dark object on a dark background.

For each image verify: foreground is complete, original background is removed, no large halos remain, transparent output has alpha, White is exact #FFFFFF, custom color is exact, and Original restores untouched pixels.

## Photo Studio tools

- Magic Eraser: import/create a mask and verify only the masked region changes.
- AI Expand: test Original, 1:1, 4:5 and 16:9.
- Relight: test soft/front/left/right/top and 25–100% strength.
- Upscale: test 2x and 4x and verify returned dimensions.
- Product Scene: test studio/lifestyle/outdoor/luxury/minimal prompts.

## Provider requirements

Background removal is self-hosted with `BACKGROUND_REMOVAL_URL`. Image editing, image generation, video generation and audio generation require configured provider URLs. 91.14 must report these lanes as unavailable when they are not configured; placeholder/fake success is a release failure.

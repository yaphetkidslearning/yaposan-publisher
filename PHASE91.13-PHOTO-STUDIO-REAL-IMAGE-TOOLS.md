# Phase 91.13 - Real Photo Studio Image Tools

Phase 91.13 removes the misleading preview-only execution path from Yaposan Photo Studio and connects the workspace to real image-processing runtimes.

## Background removal

Photo Studio now calls the authenticated `/api/v1/image/background-remove` route, which uses Yaposan's self-hosted `services/background-removal` service (rembg with U2Net/BiRefNet quality routing). The original image is preserved independently from the processed image.

Background removal produces a true alpha cutout. The user can then choose:

- Transparent PNG
- Exact white background (`#FFFFFF`)
- Custom background color via presets or a six-digit hex value

The Photo Studio workflow keeps the original image dimensions rather than forcing the Product Photo Studio marketplace crop.

## Direct tool execution

The right-side tool buttons now execute when clicked. In 91.12 they primarily selected a tool and required a separate Run button that could be below the visible viewport, which made the controls appear non-functional.

## Other AI image tools

Magic Eraser, AI Expand, Relight, Upscale, and Product Scene now use the dedicated Phase 91.12 image-media provider contract. They never return the original image as a fake successful result. If no image provider is configured, the user receives an explicit provider configuration error.

Provider requests include the source image bytes, MIME type, operation, prompt, strength, scale, aspect ratio, shadow preservation, and edge refinement settings. Synchronous providers return the edited asset immediately; asynchronous providers are polled through the media job endpoint.

## GWC Studio review

GWC Studio's busy-state/error-feedback pattern was useful, but its current `removeBackgroundWithApi` implementation is only a local preview that returns the input URI. That behavior was intentionally not copied. GWC's historical `@imgly/background-removal` attempt also showed unresolved module/runtime issues and introduces separate licensing considerations. Yaposan therefore uses its existing organization-controlled background-removal service.

## Local development

Copy `.env.example` to `.env`, then start the background engine:

```bash
docker compose up --build background-removal
```

The server should have:

```text
BACKGROUND_REMOVAL_URL=http://127.0.0.1:8090
```

Then run the Yaposan server and web client in separate terminals:

```bash
npm run server
npm run web
```

Real Magic Eraser/Expand/Relight/Upscale/Product Scene operations additionally require an `AI_IMAGE_PROVIDER_URL` whose API accepts the documented Phase 91.12 image media contract.

## Acceptance checks

1. Import a photo with a visually obvious background.
2. Click Remove background once; processing should start immediately.
3. The result must visibly isolate the foreground subject.
4. Transparent must preserve alpha.
5. White must render exact `#FFFFFF` outside the subject.
6. A custom color must replace all removed background pixels with the selected color.
7. Before must display the untouched original.
8. Non-background AI tools must return a changed provider asset or an explicit configuration/error message; they must never silently claim success while showing the original image.

# Geost Studio — company profile

Bilingual (`id` / `en`) company profile for Geost Studio: dark industrial landing
page, project portfolio, 360° viewer (M3), and AI concept preview (M4).

Stack: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4.
3D: `three` + `@react-three/fiber` + `@react-three/drei`.
AI: Replicate SDXL img2img through a server-side route handler.

## Commands

```bash
npm run dev        # local dev, http://localhost:3000
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (run `npx next typegen` first on a fresh clone)
npm run build      # production build
npm start          # serve the production build
```

Verify `lint -> typecheck -> build` before opening a PR.

## Structure

| Path | Purpose |
| --- | --- |
| `app/[locale]/` | Every route, prefixed by locale (`/id`, `/en`) |
| `app/[locale]/page.tsx` | Home: hero, stats, about, services, 360 highlight, projects, pricing, team, testimonials, FAQ, notes, CTA |
| `app/[locale]/projects/` | Filterable gallery + `[slug]` detail page |
| `app/[locale]/{services,pricing,about,contact,preview}/` | Supporting pages |
| `components/home/` | One component per home section, so sections stay swappable |
| `components/layout/` | Fixed header (with locale switch) and footer |
| `components/viewer/` | `PortfolioViewer` shell, `RoomScene` (Kenney demo), `PanoramaViewer`, `ModelScene` |
| `components/preview/` | `PreviewStudio` — upload, prompt, presets, polling, before/after |
| `lib/preview/providers.ts` | Ruvicode + Replicate adapters (server-only) |
| `app/api/preview/route.ts` | Server-side img2img endpoint (POST + GET poll) |
| `messages/{id,en}.json` | All UI copy — no user-facing strings in components |
| `data/*.json` | Projects, services, team, studio notes, and the demo room layout |
| `assets-src/kenney/` | Unmodified Kenney furniture kit (source, CC0) |
| `lib/i18n.ts` | Locale list, dictionary loader, `pick()` helper |
| `lib/data.ts` | Typed accessors for the JSON content |
| `lib/site.ts` | Contact numbers, email, social links |
| `proxy.ts` | Redirects locale-less URLs (`/projects` -> `/id/projects`) |
| `public/models/` | Draco-compressed `.glb` files only (see its README) |

## i18n rules

- Only `id` and `en` exist; `id` is the default. `proxy.ts` negotiates with
  `Accept-Language` and falls back to `id`.
- Every visible string lives in `messages/id.json` and `messages/en.json`. Both
  files must keep the same shape.
- Content with locale-specific fields uses `title_id` / `title_en` pairs and the
  `pick(locale, id, en)` helper.
- Components read copy on the server; client components receive it as props.

## Editing content

- **Projects** — add an entry to `data/projects.json` (`slug`, `title_id`,
  `title_en`, `tags`, `images[]`, `modelUrl`, `panoramas[]`, optional
  `demoScene` / `panoramaDemo`). Cards and the detail page follow automatically;
  add `modelUrl: "/models/<slug>.glb"` once a real model exists, or
  `demoScene: true` to show the Kenney demo room.
- **Services / team / notes** — `data/services.json`, `data/team.json`,
  `data/news.json`.
- **Pricing, FAQ, testimonials, hero slides** — `messages/*.json` under `home`.

## 360° viewer

The viewer lives in `components/viewer/` and renders on project detail pages
when a project has `modelUrl` (real model), `demoScene: true` (demo room), or
`panoramas` (equirectangular photos).

### Demo room (ships now)

`data/demo-room.json` describes a living room assembled from the Kenney
Furniture Kit (`assets-src/kenney`, CC0). Only the 17 models actually used are
copied to `public/models/kenney/`.

Each piece is `{ model, position: [x, y, z], rotationY?, scale? }` in kit units
(1 floor tile = 1 unit, walls are 1.29 units tall); the whole group is scaled
1.8x and offset so the room is centered on the origin. Floor height is `y=0.05`.

- Change the layout by editing `data/demo-room.json`; every `model` value must
  exist as `public/models/kenney/<model>.glb`.
- Copy more pieces from `assets-src/kenney/Models/GLTF format/` when needed.
- Set `"demoScene": true` on a project in `data/projects.json` to show it.
  Remove the flag when that project gets a real `.glb`.
- The UI labels it as a demo on purpose — it is stylized low-poly furniture, not
  a converted SketchUp project.

### Real project model

1. Export from SketchUp (`glTF` exporter) or Blender
   (`.dae/.skp` -> `Export glTF (.glb)`), compress with Draco, keep it under
   15 MB.
2. Save as `public/models/<slug>.glb` with `poster-<slug>.webp` next to it.
3. Set `"modelUrl": "/models/<slug>.glb"` on the project entry. `ModelScene`
   centers and scales the model automatically.

### 360° panorama (equirectangular photo)

A separate viewer for photos shot with a 360 camera or phone panorama mode:
drag to look around, pinch/scroll to zoom, slow auto-rotate (disabled for
`prefers-reduced-motion`), reset, fullscreen.

1. Use a **2:1 equirectangular** image, e.g. 4096x2048, JPEG under ~300 KB
   (`node scripts/to-jpeg.mjs in.png out.jpg 0.82` converts/resizes).
2. Save it as `public/images/panoramas/<slug>-<room>-360.jpg`.
3. Add it to the project in `data/projects.json`:

```json
"panoramas": [
  { "image": "/images/panoramas/kubu-living-360.jpg",
    "label_id": "Ruang tamu", "label_en": "Living room",
    "credit": "Foto: tim Geost" }
]
```

Several panoramas become tabs above the viewer. Remove `"panoramaDemo": true`
once the photos are real project shots.

The two sample panoramas (`loft-living-360.jpg`, `loft-lounge-360.jpg`) are
tonemapped previews from [Poly Haven](https://polyhaven.com) (CC0) and are
labelled as demo content in the UI — replace them before launch.

### Viewer rules

- `"use client"`, `<Suspense>`, `dpr={[1,2]}`, `OrbitControls` with autoRotate
  and zoom for 3D models, pointer-drag look controls for panoramas, plus reset,
  fullscreen, and keyboard-friendly turn buttons.
- Loading and error states never leave the panel blank; the photo gallery stays
  below the viewer.
- On unmount the viewer disposes geometries/materials/textures and clears the
  `useGLTF` / `useTexture` cache.
- No `three` import in server components or route handlers.

Furniture models: [Kenney](https://kenney.nl) Furniture Kit, CC0.
Sample panoramas: [Poly Haven](https://polyhaven.com), CC0.

### Visual check

```bash
npm run dev
node scripts/shot.mjs http://localhost:3000/id/projects/studio-geost
node scripts/shot.mjs http://localhost:3000/id/projects/rumah-kubu-bandung shot-pano.png
node scripts/shot-mobile.mjs http://localhost:3000/en/projects/rumah-kubu-bandung
```


## AI preview (M4)

`app/api/preview/route.ts` proxies Replicate SDXL img2img. The browser never
sees the API token and never calls the provider directly.

### Flow

1. `components/preview/PreviewStudio.tsx` validates the file on the client,
   re-encodes it through a canvas (strips EXIF/GPS, caps the long edge at
   1536 px) and sends multipart form data.
2. `POST /api/preview` validates with `zod`, checks the file signature, and
   starts a prediction (`stability-ai/sdxl`, `prompt_strength` 0.3–0.6,
   default 0.45, 30 steps). It returns `{ predictionId, status }`.
3. The client polls `GET /api/preview?id=…` every 2 s (max ~100 s) and renders
   the temporary image URL with a before/after slider, download link, and a
   WhatsApp hand-off that carries the prompt.

### Limits and guards

- Upload: 5 MB, JPG/PNG/WebP only, verified by magic bytes (`ff d8 ff`,
  PNG signature, `RIFF…WEBP`), not just the MIME header.
- Prompt: 3–500 characters, plus a small bilingual block list for NSFW terms.
- Rate limit: 10 predictions/minute/IP, 240 polls/minute/IP. It is an
  in-memory map (fine for local dev and single-instance hosting); swap in
  Upstash/Redis before scaling to multiple serverless instances.
- Uploads live in memory only — nothing is written to `public/` or `/tmp`, and
  base64 data or tokens are never logged.
- Errors return `{ error: { code, message: { id, en } } }` so the UI can show
  localized copy; codes: `missing_token`, `rate_limited`, `invalid_image`,
  `image_too_large`, `invalid_prompt`, `blocked_prompt`, `provider_error`.

### Providers

Two adapters live in `lib/preview/providers.ts`; the route stays the same.

| Provider | Env | Behaviour |
| --- | --- | --- |
| **Ruvicode** (default when its key exists) | `RUVICODE_API_KEY=rvcd_…` | `POST /v1/images/edits` (multipart, model `ruvicode-image-edit`), synchronous, returns the image as base64 → served as a data URL. No expiry, no polling. |
| **Replicate** | `REPLICATE_API_TOKEN=r8_…` | SDXL img2img, async prediction + polling, returns a temporary URL (~1 hour). |

Selection: `PREVIEW_PROVIDER=ruvicode|replicate` forces one; without it the
app picks whichever key is configured (Ruvicode first).

Optional overrides:

```bash
RUVICODE_IMAGE_MODEL=ruvicode-image-edit   # or …-uncensored
RUVICODE_BASE_URL=https://api.ruvicode.com/v1
```

`prompt_strength` only exists on the Replicate path; Ruvicode keeps the input
geometry (`aspect_ratio: auto`) and applies the prompt as an edit.

### Configuration

```bash
# .env.local (never commit, never prefix with NEXT_PUBLIC_)
RUVICODE_API_KEY=rvcd_...
# or
REPLICATE_API_TOKEN=r8_...
```

Without a key the endpoint returns 503 `missing_token` and the UI shows the
bilingual "not configured" message, so the page stays usable in previews.

### Quick checks

```bash
curl -X POST http://localhost:3000/api/preview \
  -F "image=@room.jpg;type=image/jpeg" \
  -F "prompt=industrial living room, brick wall" -F "locale=en"
# -> 422 / 503 / 429 / 201 depending on the input and configuration
```

Result URLs from Replicate expire after roughly an hour; the UI says so and
offers a download button.


## Placeholders to replace before launch

- WhatsApp `+62 812-3456-7890`, email `hello@geost.studio`, studio address.
- All photography points at Unsplash URLs (`next.config.ts` `remotePatterns`);
  replace with real project photos in `public/images` and delete the remote
  pattern.
- The two 360° panoramas are Poly Haven samples (CC0); replace them with real
  360 photos and remove `"panoramaDemo": true`.
- Services, pricing tiers, team members, and testimonials are sample copy —
  replace with the real Geost Studio lists (PRD open question #11).
- Default `app/favicon.ico` from the scaffold.

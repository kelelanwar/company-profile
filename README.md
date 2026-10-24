# Geost Studio — company profile

Bilingual (`id` / `en`) company profile for Geost Studio: dark industrial landing
page, project portfolio, 360° viewer (M3), and AI concept preview (M4).

Stack: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4.
3D: `three` + `@react-three/fiber` + `@react-three/drei`.
AI: text-to-image concept preview through a server-side route handler (Ruvicode or Replicate).

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
| `components/preview/` | `PreviewStudio` — prompt, presets, polling, result |
| `lib/preview/providers.ts` | Ruvicode + Replicate adapters (server-only) |
| `app/api/preview/route.ts` | Server-side text-to-image endpoint (POST + GET poll) |
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

`app/api/preview/route.ts` proxies a text-to-image model. Visitors describe the
room, pick a style, and receive one 16:9 concept image. The browser never sees
the API token and never calls the provider directly.

### Flow

1. `components/preview/PreviewStudio.tsx` validates the prompt (3–500 chars)
   and sends `prompt`, `locale`, and `preset` as form data.
2. `POST /api/preview` validates with `zod`, checks the block list, and composes
   the preset style into the prompt.
3. Ruvicode answers with the finished image (base64 → data URL, no expiry);
   Replicate returns `{ predictionId }` and the client polls
   `GET /api/preview?id=…` every 2 s (max ~100 s) for a temporary URL.
4. The result is shown with a download button and a WhatsApp hand-off carrying
   the prompt, plus the bilingual "concept only" disclaimer.

### Limits and guards

- Prompt: 3–500 characters, plus a small bilingual block list for NSFW terms.
- Request body is capped at 16 KB — there is no image upload path.
- Rate limit: 10 generations/minute/IP, 240 polls/minute/IP. It is an in-memory
  map (fine for local dev and single-instance hosting); swap in Upstash/Redis
  before scaling to multiple serverless instances.
- Prompts, generated images, and tokens are never logged.
- Errors return `{ error: { code, message: { id, en } } }` so the UI can show
  localized copy; codes: `missing_token`, `rate_limited`, `invalid_prompt`,
  `blocked_prompt`, `model_unavailable`, `provider_error`, `not_found`,
  `bad_request`.

### Providers

Two adapters live in `lib/preview/providers.ts`; the route stays the same.

| Provider | Env | Behaviour |
| --- | --- | --- |
| **Ruvicode** (default when its key exists) | `RUVICODE_API_KEY=rvcd_…` | OpenAI-compatible `POST /v1/images/generations` with a JSON body, model `ruvicode-image`. Returns the image as base64, served as a data URL (no expiry). |
| **Replicate** | `REPLICATE_API_TOKEN=r8_…` | SDXL text-to-image at 1024×1024, async prediction + polling, temporary URL (~1 hour). |

Selection: `PREVIEW_PROVIDER=ruvicode|replicate` forces one; without it the app
picks whichever key is configured (Ruvicode first).

Optional overrides:

```bash
RUVICODE_MODEL=ruvicode-image
RUVICODE_BASE_URL=https://api.ruvicode.com/v1
```

If the provider answers `403`/`404` for the model (not enabled for the key, or
temporarily unavailable), the API returns `503 model_unavailable` with a
bilingual message instead of a generic failure.

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
curl -X POST http://localhost:3000/api/preview   -F "prompt=industrial living room, brick wall, warm lighting"   -F "preset=industrial" -F "locale=en"
# -> 200 { "status": "succeeded", "imageUrl": "data:image/jpeg;base64,…" }
# -> 422 / 429 / 503 depending on the input and configuration
```

Replicate result URLs expire after roughly an hour; the UI says so and offers a
download button.

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

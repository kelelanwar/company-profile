# Geost Studio — company profile

Bilingual (`id` / `en`) company profile for Geost Studio: dark industrial landing
page, project portfolio, 360° viewer (M3), and AI concept preview (M4).

Stack: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4.
Planned 3D: `three` + `@react-three/fiber` + `@react-three/drei`.
Planned AI: Replicate SDXL img2img, server-side only.

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
| `components/viewer/` | Reserved for `PortfolioViewer.tsx` (M3) |
| `messages/{id,en}.json` | All UI copy — no user-facing strings in components |
| `data/*.json` | Projects, services, team, and studio notes |
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
  `title_en`, `tags`, `images[]`, `modelUrl`). Cards and the detail page follow
  automatically; add `modelUrl: "/models/<slug>.glb"` once the model exists.
- **Services / team / notes** — `data/services.json`, `data/team.json`,
  `data/news.json`.
- **Pricing, FAQ, testimonials, hero slides** — `messages/*.json` under `home`.

## 360° viewer (M3, not built yet)

1. Export from SketchUp (`glTF` exporter) or Blender
   (`.dae/.skp` -> `Export glTF (.glb)` with Draco compression).
2. Keep the final file under 15 MB, store it as `public/models/<slug>.glb` with
   a `poster-<slug>.webp` next to it.
3. Point the project entry's `modelUrl` at it. The detail page renders the
   gallery until a viewer component lands.

## AI preview (M4, not built yet)

- Endpoint will be `app/api/preview/route.ts`, server-side only, with `zod`
  validation, 5 MB upload cap, 500-character prompt cap, and 10 req/min/IP.
- `REPLICATE_API_TOKEN` belongs in `.env.local` and must never be prefixed with
  `NEXT_PUBLIC_`.

## Placeholders to replace before launch

- WhatsApp `+62 812-3456-7890`, email `hello@geost.studio`, studio address.
- All photography points at Unsplash URLs (`next.config.ts` `remotePatterns`);
  replace with real project photos in `public/images` and delete the remote
  pattern.
- Services, pricing tiers, team members, and testimonials are sample copy —
  replace with the real Geost Studio lists (PRD open question #11).
- Default `app/favicon.ico` from the scaffold.

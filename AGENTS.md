<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — company-profile

Stack: Next.js 14+ App Router + TypeScript + Tailwind for Geost Studio. 3D: `three` + `@react-three/fiber` + `@react-three/drei`. AI preview: Replicate SDXL img2img via server-side Next.js Route Handlers only. Content: bilingual `id` / `en`.

## Commands

- `npm run dev` — local dev (Turbopower: `localhost:3000`)
- `npm run build && npm start` — verify production before PR
- `npm run lint` — ESLint; `npm run typecheck` — `tsc --noEmit`
- `npx tsc --noEmit` if no `typecheck` script exists yet

## Structure (create if missing)

- `app/[locale]/` — original Geost routes: `page.tsx` (hero + about + services + 360 highlight + projects + pricing + team + testimonials + FAQ), `projects/`, `projects/[slug]/`, `services/`, `pricing/`, `about/`, `contact/`, `preview/`; `app/api/preview/route.ts` — AI img2img endpoint, never call provider from client
- `components/home/` — one component per Intera section (`HeroSlider.tsx`, `ServicesGrid.tsx`, `ProjectsGallery.tsx`, `PricingTable.tsx`, `TeamGrid.tsx`, `NewsGrid.tsx`) so sections stay swappable
- `components/viewer/` — `PortfolioViewer.tsx` wraps all R3F canvas logic
- `public/models/*.glb` — converted portfolios only; never commit `.skp` / `.blend` / `*.max`
- `messages/id.json`, `messages/en.json` — bilingual copy
- `.env.local` — `REPLICATE_API_TOKEN=`; never prefix AI keys with `NEXT_PUBLIC_`

## Reference design — https://intera-html.vercel.app (tone + palette reference only, never clone sections)

- Borrow Intera's dark industrial tone only; Geost layout stays original: sticky header, hero, about, services, 360 highlight band, filterable projects, 3-tier pricing (Studio/Proyek/Enterprise), team, testimonials, FAQ, footer.
- Contact placeholders: WhatsApp `https://wa.me/6281234567890`, email `hello@geost.studio` — replace with real data when available.
- Project cards need category filter (`All` + tags) and link to `projects/[slug]` detail pages; detail page hosts the 360 `PortfolioViewer` when a `.glb` exists, image gallery otherwise.

## 360 Portfolio Viewer — hard rules

- SketchUp flow: `SketchUp (.skp) -> Export glTF/GLB` via SketchUp glTF exporter or `Blender -> File -> Import .dae/.skp -> Export glTF (.glb)`. Commit only Draco/compressed `.glb` under 15 MB in `public/models/`.
- Loader pattern: `useGLTF("/models/<name>.glb")` + `<OrbitControls autoRotate enableZoom />` + `Suspense` fallback. No raw `three` scene setup in pages.
- Every viewer must have: loading fallback, `onError` state, `dpr={[1,2]}`, and dispose on unmount (`useGLTF.preload` only for above-fold model).
- No server-side import of `three`; mark viewer files `"use client"`.

## AI Preview (img2img) — hard rules

- Flow: client uploads `image/jpeg|png|webp` (max 5 MB) + `prompt` + `locale` -> `POST /api/preview` -> Replicate -> return temporary URL. Validate with `zod` in the route.
- Store uploads in memory or `/tmp` only; never write client uploads to `public/`.
- Never log base64 images or API keys. Rate-limit route (e.g. 10 req/min/IP) and add prompt max length 500 chars.
- Show bilingual disclaimer that AI output is a concept preview, not final construction result.

## Conventions

- TypeScript `strict`, no `any` in `viewer/` or `api/`; all user strings via `messages/*.json`.
- Images: `next/image` with `alt` in both locales; 3D posters: `poster-*.webp` next to model.
- Verify: `lint -> typecheck -> build` before asking for review.

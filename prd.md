# PRD — Geost Studio Company Profile + 360 Portfolio + AI Preview

Status: Draft v0.1 — 2026-10-23
Reference: https://intera-html.vercel.app (design + color tone reference only — do NOT clone section-by-section)
Contact placeholder: WhatsApp +62 812-3456-7890, hello@geost.studio
Stack: Next.js 14+ App Router + TS + Tailwind, three + R3F + drei, Replicate (SDXL img2img) server-side, bilingual id/en

## 1. Background

- **Problem** — static portfolio photos do not sell interior/construction services; clients cannot visualize custom requests.
- **Goal** — original Geost Studio company profile borrowing only Intera's dark industrial tone + palette, plus two differentiators: 360-degree portfolio viewer and AI concept preview from client upload + prompt.
- **Success** — visitor can browse projects, orbit a 3D model, upload a room photo + prompt and get AI preview with disclaimer.

## 2. Users

- **Visitor** — browses services/projects/pricing/team in id/en, contacts via WhatsApp/form.
- **Client** — uploads room photo + prompt to preview "what I want to build".
- **Admin/Owner** — adds projects by dropping `.glb` + images, no code change.

## 3. Scope MVP

In:
- Bilingual (`/id`, `/en`) pages: home (hero, about, services, 360 highlight, best-projects, pricing, team, testimonials, FAQ, footer), `projects`, `projects/[slug]`, `services`, `pricing`, `about`, `contact`, `preview` (AI studio).
- 360 viewer on project detail when `.glb` exists, image gallery fallback.
- `/api/preview` img2img: jpeg/png/webp <=5MB + prompt <=500 chars -> provider -> temp URL.
- Contact via form (mailto/WhatsApp link), no auth, no CMS.

Out:
- Auth, payments, blog CMS, multi-model comparison, persistent user uploads, online quotation calculator.

## 4. IA / Routes

- `app/[locale]/page.tsx` — full Intera home sections.
- `app/[locale]/projects/page.tsx` — filter `All + tags`, cards -> detail.
- `app/[locale]/projects/[slug]/page.tsx` — gallery + specs + conditional `<PortfolioViewer modelUrl>` + CTA to `/preview`.
- `app/[locale]/services|pricing|about|contact/page.tsx` — original Geost pages.
- Contact CTA: WhatsApp `https://wa.me/6281234567890` + `mailto:hello@geost.studio` (placeholder, replace with real).
- `app/[locale]/preview/page.tsx` — upload + prompt + locale + result + disclaimer.
- `app/api/preview/route.ts` — zod validation, rate-limit 10 req/min/IP, Replicate call.

## 5. Feature A — 360 Portfolio Viewer

- **Flow** — SketchUp `.skp` -> export glTF via SketchUp glTF exporter OR via Blender (`Import .dae/.skp -> Export .glb Draco`) -> compress <15MB -> `public/models/<slug>.glb` + `poster-<slug>.webp` -> `projects.json` entry `modelUrl`.
- **UX** — `Suspense` fallback spinner, `OrbitControls autoRotate enableZoom`, reset view button, fullscreen toggle, error card with gallery fallback, mobile touch orbit, `dpr={[1,2]}`.
- **Tech** — `"use client"` `components/viewer/PortfolioViewer.tsx`, `useGLTF`, no `three` import on server, `useGLTF.preload` only above-fold.
- **Acceptance** — loads <5s on 4G for 15MB model, orbit 60fps desktop, error state never blank, unmount disposes geometry.

## 6. Feature B — AI Preview img2img

- **Flow** — select image -> client-side type/size check -> enter prompt (e.g. "industrial living room, brick wall") + style preset -> `POST /api/preview (multipart)` -> polling if async -> display before/after slider + download + "Consult via WhatsApp" with prompt attached.
- **Validation** — zod: file type jpeg/png/webp, <=5MB, prompt 3-500 chars, locale id/en; strip EXIF client-side; store in memory/`/tmp` only, never `public/`.
- **Server keys only (`REPLICATE_API_TOKEN`, never `NEXT_PUBLIC_`), no base64/key logging, 10 req/min/IP, NSFW prompt block list, bilingual disclaimer: "AI concept preview, not final construction result / Hasil AI hanya konsep, bukan hasil akhir."
- **Provider** — Replicate SDXL img2img (`prompt_strength` ~0.35-0.5 to preserve room layout); env `REPLICATE_API_TOKEN` server-only.
- **Acceptance** — invalid file rejected with id/en message, 500-char limit enforced, provider failure shows retry, result URL expires notice.

## 7. Content / i18n

- `messages/id.json`, `messages/en.json` — all UI strings; `data/projects.json`, `data/services.json` with `title_id/title_en`, `slug`, `tags`, `images[]`, `modelUrl?`.
- Default locale `id`; switcher in header; `alt` bilingual; SEO `metadata` per locale.

## 8. Design

- Intera dark industrial: sticky header, full-width hero slider (2 slides min), dual-image about, 6-card services, video CTA band, filterable gallery 8 items, 3-tier pricing (Studio/Proyek/Enterprise), 3-col team, 3-col news, footer info/recent/newsletter.
- No template code copy; rebuild original Geost layout with Tailwind + `next/image`; `poster-*.webp` for 3D cards.

## 9. NFR

- **Perf** — LCP <2.5s home without 3D, lazy-load viewer + below-fold sections, compressed `.glb` only.
- **A11y/SEO** — semantic headings, keyboard-orbit fallback buttons, sitemap + OG per locale.
- **Security** — zod + rate-limit + key isolation; `.env.local` never committed.

## 10. Milestones

- M1 Scaffold + i18n + Intera home static.
- M2 Projects + detail + gallery filter.
- M3 Viewer + 1-2 sample `.glb` conversion pipeline doc.
- M4 `/api/preview` + preview UI + disclaimer.
- M5 Polish, `lint->typecheck->build`, deploy Vercel.

## 11. Open Questions

- Real Geost Studio services/pricing/team list to replace placeholders?

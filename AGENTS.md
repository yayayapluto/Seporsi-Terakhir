# AGENTS.md — Porsi Terakhir

Stack: Next.js 16.4.3 (App Router, `src/`, alias `@/*`), React 19, Tailwind v4
(CSS-first `@theme`, no `tailwind.config.js`), shadcn/ui + `lucide-react` only,
Biome (lint+format, no ESLint/Prettier), Supabase (Postgres/Auth/RLS/RPC via
`@supabase/supabase-js` + `@supabase/ssr`), Google sign-in via Supabase Auth
only, `react-qr-code` (render) + `@yudiel/react-qr-scanner` (scan), Zod +
react-hook-form (+ `@hookform/resolvers`), Vitest via `bun run test` (never bare
`bun test`).

## Commands (exact)

- `bun run dev` / `build` / `start`
- `bun run lint` (`biome check .`), `format` (`biome check --write .`)
- `bun run typecheck` (`tsc --noEmit`), `bun run test` (`vitest run`)
- `bun run check` = lint + typecheck + test, fails on first error (phase gate)
- `bun run db:start|stop|reset|types` (`db:types` regenerates `src/types/database.ts`)

Toolchain: Bun (`bun.lock` committed; no npm/pnpm/yarn locks), Node v24.21.0
(`.nvmrc` + `engines`), plain `next dev`/`next build` on Node.

## Folder map

- `src/app/` route groups `(public)`, `(student)`, `(tenant)`, `(admin)`, `auth/`
- `src/components/ui/` shadcn (generated) — never hand-build these; app components
  grouped by feature beside them
- `src/lib/supabase/` `client.ts`, `server.ts`, proxy/middleware helper
- `src/lib/domain/` PURE logic + Vitest (`constants.ts`, `pricing.ts`, `expiry.ts`, `metrics.ts`)
- `src/lib/auth/` `getCurrentUser`, `requireRole`
- `src/lib/` `env.ts` (Zod-validated), `format.ts` (IDR + WIB helpers)
- `src/types/database.ts` GENERATED — never hand-edit
- `supabase/` `config.toml`, `migrations/`, `seed.sql`, `tests/` (pgTAP)
- `docs/` `product-brief.md`, `decisions.md`, `setup.md`, `design/` (Stitch)

## Coding conventions

- Server Components by default; `"use client"` only when needed.
- Server Actions for mutations; Zod validation at every boundary (forms + actions
  share schemas from `src/lib/domain`).
- No business rules only in the UI — BR-1..8 enforced server-side/RLS/RPC.
- Dates: `Intl.DateTimeFormat` + `timeZone: Asia/Jakarta`; no date library; expiry
  computed from `timestamptz` on server/DB. Currency: integer IDR, formatted via
  `formatIDR` (`Intl.NumberFormat('id-ID', IDR)`).
- Design: Stitch "Campus Harvest & Rescue" tokens in `globals.css` (Plus Jakarta
  Sans headings, Inter body, primary `#2E7D4F`, accent `#F28C28`, canvas
  `#FFFBF5`); mobile-first; light mode only; Indonesian UI copy.

## Domain rules (BR-1..8)

BR-1 cooked storable food only. BR-2 sell window 120–240 min post-cook, default
180; expired = not orderable, not listed. BR-3 cook time mandatory + visible.
BR-4/5 tenant owns quality; ingredients/allergens shown when filled. BR-6
discount ≈ 40–50% of normal (default 45%, nearest Rp500) — suggestion only.
BR-7 zero platform fee in pilot. BR-8 strictly opt-in. 3-tap portion posting;
normal price set once per tenant per menu item.

## Definition of done (every phase)

`bun run check` passes + `bun run build` passes (from Phase 3) + one commit per
phase + report listing: what was done, deviations (also in `docs/decisions.md`),
what was NOT verified, pending manual steps.

## Do NOT

- Don't hand-edit `src/types/database.ts`.
- Don't use the service-role/secret key in client code (not used at all in Phases 1–3).
- Don't write Tailwind v3 config; don't add ESLint/Prettier.
- Don't change the DB without a new migration file.
- Don't mix package managers. Don't add deps without a one-line justification in `docs/decisions.md`.
- Don't build P1 (FR-08/09/15: push notifications, faculty leaderboard, waste-trend insight).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## Iconography & Motion

### Icons
- Use `lucide-react` as the only icon library.
- Never use emoji as UI icons or mix multiple icon libraries.
- Prefer familiar, semantically correct icons with consistent sizing and stroke weight.
- Default sizes: `size-4` for inline metadata, `size-5` for buttons and navigation, `size-6` for prominent actions.
- Align icons optically with their text. Avoid decorative icon tiles and unnecessary icons.
- Use accessible labels for icon-only buttons and provide visible focus states.

### Motion
- Use the `motion` package (Motion for React, imported from `motion/react`) for purposeful, subtle UI animation.
- Add `motion` to the approved dependencies and install it during Phase 1.
- Prefer CSS transitions for simple hover, focus, and color changes. Use Motion for animations that benefit from orchestration or state awareness.
- Define a consistent motion system:
  - Micro-interactions: approximately 120–180ms.
  - Component transitions: approximately 180–280ms.
  - Larger page transitions: approximately 250–400ms, only when they improve orientation.
  - Use subtle opacity and transform changes; avoid exaggerated bounce, elastic effects, and unnecessary parallax.
- Apply motion selectively to page entrances, dropdowns, dialogs, sheets, catalog item transitions, loading states, and meaningful feedback after user actions.
- Avoid animating every card independently or adding animation solely for visual decoration.
- Respect `prefers-reduced-motion`. Disable or simplify non-essential animations when reduced motion is requested.
- Avoid layout shifts and ensure animations never delay essential interactions.
- Use `AnimatePresence` only when exit animations are needed. Keep animation logic out of Server Components unless a small dedicated Client Component is appropriate.
- Keep the initial page render fast and avoid turning entire pages into Client Components just to animate them.

### Design quality gate
- Icons and motion must reinforce the product's visual identity and usability, not compensate for generic layouts.
- Before completion, review animations for consistency, restraint, accessibility, and performance.
- Keep Tailwind CSS v4 and shadcn/ui as the styling and component foundation. Motion supplements them; it does not replace them.

<!-- END:nextjs-agent-rules -->

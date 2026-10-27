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

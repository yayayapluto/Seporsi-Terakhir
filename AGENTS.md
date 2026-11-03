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
 - `bun run db:push`, `db:migrations`, `db:types`, `db:seed`, `seed:auth` (hosted linked, no Docker; `db:types` regenerates `src/types/database.ts`)

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
 - `supabase/` `config.toml` (redirect + mail template), `migrations/` (push via `db:push`)
- `docs/` `product-brief.md`, `decisions.md`, `setup.md`; design authority = `PRODUCT-Siera.MD` + screenshots `docs/siera-ref/` (screenshot menang bila konflik)

## Coding conventions

- Server Components by default; `"use client"` only when needed.
- Server Actions for mutations; Zod validation at every boundary (forms + actions
  share schemas from `src/lib/domain`).
- No business rules only in the UI — BR-1..8 enforced server-side/RLS/RPC.
- Dates: `Intl.DateTimeFormat` + `timeZone: Asia/Jakarta`; no date library; expiry
  computed from `timestamptz` on server/DB. Currency: integer IDR, formatted via
  `formatIDR` (`Intl.NumberFormat('id-ID', IDR)`).
- Design: `PRODUCT-Siera.MD` adalah acuan tunggal. Token §3
  (`primary #2E7D4F`, kanvas putih `#FFFFFF`, radius card 20-24px); card = unit
  utama, maks 1 level, tiap card punya 1 aksi; mobile-first; light mode only;
  Indonesian UI copy. Cek `PRODUCT-Siera.MD` + screenshot `docs/siera-ref/`
  sebelum buat UI apa pun.
- Sejajar: indikator kerapian = teks label yang sejajar (bukan card). Baris header sekolom wajib sama tinggi (`min-h-11 flex items-center`); card mengikuti via grid stretch bawaan (`items-stretch`, section `min-w-0 h-full`), bukan subgrid/wrapper rel. Label panjang dipadatkan satu baris; keterangan kecil boleh tanpa kartu (`px-1 text-[11px]`).
- Komponen UI shadcn-first: selalu pakai primitif `src/components/ui/` (button,
  dialog, sheet, accordion, dsb — jangan hand-build dari nol). Komponen custom
  HANYA boleh sebagai komposisi/wrapper di atas primitif shadcn (varian, layout,
  pola repo seperti `SieraCard`); primitif yang belum ada = `shadcn add`, bukan
  copy-paste atau tulis ulang. Audit berkala: tiap komponen non-ui wajib bisa
  menunjuk primitif shadcn yang mendasarinya.
- Animasi hanya via `motion` (dep yang sudah ada — dilarang tambah lib animasi):
  boleh dipasang HANYA pada komponen yang memang butuh transisi (tur/onboarding,
  dialog/sheet/accordion, shimmer skeleton, perubahan state). Satu momen authored
  per permukaan, hormati `prefers-reduced-motion`, tanpa delay/blokir tugas.

## Domain rules (BR-1..8)

BR-1 cooked storable food only. BR-2 sell window 120–240 min post-cook, default
180; expired = not orderable, not listed. BR-3 cook time mandatory + visible.
BR-4/5 tenant owns quality; ingredients/allergens shown when filled. BR-6
discount ≈ 40–50% of normal (default 45%, nearest Rp500) — suggestion only.
BR-7 zero platform fee in pilot. BR-8 strictly opt-in. 3-tap portion posting;
normal price set once per tenant per menu item.

## Agent workflow (wajib — baca sebelum kerja)

1. Pre-task: `git status --short` + `git branch --show-current`; petakan simbol
   via code-review-graph dulu (MCP tools / skill `explore-codebase` / CLI
   `uvx code-review-graph query|search|impact`), fallback `read_file`/`search_files`;
   cek `package.json` bila butuh lib baru. Graph lokal: `build` sekali, `update` sesudah edit besar.
2. Edit minimal via `patch`; TDD untuk `src/lib/domain/` (test gagal dulu,
   implementasi minimal, hijau). Maks 3x percobaan per file, lalu tanya user.
3. Verifikasi per edit: `bun run lint`, `typecheck`, `test`; penuh sebelum commit:
   `bun run check` + `bun run build` (keduanya exit 0; klaim tanpa output = belum selesai).
4. Commit: stage file spesifik — JANGAN `git add -A` (file junk `nul` di root
   merusaknya). Satu fase = satu conventional-commit. Jangan push/rewrite history
   tanpa diminta. Jangan baca/commit secret (`.env*`).
5. Docs: tiap dep baru / keputusan / deviasi → satu bullet di `docs/decisions.md`.
   DB berubah = file migrasi baru + `db:types` (jangan hand-edit `database.ts`).
6. Laporan akhir format tetap: Done / Changed (`path:baris`) / Verified (exit code
   + output kunci) / Deviations / NOT verified / Pending manual.
7. Port 3001 milik dev server user — jangan dimatikan; verifikasi serve via `curl`,
   bukan notifikasi exit background. `taskkill` butuh prefix `MSYS_NO_PATHCONV=1`.
8. Skill UI wajib `impeccable`: load via `skill_view`, ikuti playbook + baca
   `craft-floor` sebelum edit UI; brief `PRODUCT-Siera.MD` + screenshot menang.
   Tidak ada skill `taste` — jangan mengarang nama skill, pilih dari daftar yang ada.

## Parallel work (multi-agent, anti-corrupt)

Satu shard satu worker. Klaim shard di tabel bawah SEBELUM edit; jangan ambil shard yang sudah diklaim orang lain. File di luar shard = READ-ONLY.

| Shard | File eksklusif | Diklaim oleh / status |
|---|---|---|
| A-public | `src/app/(public)/**`, `notifikasi/**`, `offline/**`, `not-found/forbidden/unauthorized/error` | — |
| B-tenant-katalog | `src/app/tenant/page.tsx`, `menu-saya/**`, `pendaftaran/**`, `porsi/**`, `profil/**`, `menunggu/**` | — |
| C-tenant-transaksi | `src/app/tenant/pesanan/**`, `scan/**`, `tenant-tour.tsx` | — |
| D-admin-akun | `src/app/admin/**`, `src/app/akun/**` | — |

Aturan: `read_file` fresh sebelum tiap `patch`; patch gagal 2x di file yang sama = berhenti di file itu dan lapor; formatter/linter `--write` scoped ke shard sendiri; worker tidak `commit`/`push`/`rebase` tanpa koordinator; full `check` + `build` hanya di merge gate.

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

<!-- END:nextjs-agent-rules -->

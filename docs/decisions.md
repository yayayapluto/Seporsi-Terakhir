# Decisions

Assumptions, deviations, and interpretations. Updated as work proceeds.

## Phase 1

1. **Repo name vs scaffold**: `create-next-app` refuses uppercase project names
   ("INFINITY"). Scaffolded into a temp dir (`porsi-scaffold`) and copied into
   this repo instead. Package renamed to `porsi-terakhir`.

2. **Next.js 16.4.3 / React 19.3.0 / Tailwind v4 / Biome 2.4.2**: installed by the
   scaffold's pinned latest; accepted as "latest stable" per brief.
3. **BR-6 interpretation**: discounted price = 45% of normal price (midpoint of
   40–50%), rounded to nearest Rp500, never below Rp500, always strictly below
   normal price. Constant `DISCOUNT_PRICE_RATIO_DEFAULT = 0.45` in
   `src/lib/domain/constants.ts`.
4. **`MAX_QUANTITY_PER_ORDER = 2` [usulan]**: brief says "order reduces quota"
   without a per-order cap. 2 chosen as a conservative pilot default to prevent
   one buyer sweeping a portion; enforced in RPC in Phase 2. Revisit with tenant
   feedback.
5. **QR scanner library**: `@yudiel/react-qr-scanner` v2.6.0. Last published
   May 2026 (maintained), peer-deps include React 19. Decision: adopt.
6. **Supabase CLI as devDependency**: `bun add -d supabase` initially failed
   extracting the Windows binary; added to `trustedDependencies` per brief and
   install succeeded (`supabase --version` → 2.122.0).
7. **Stitch designs present** (landing, katalog, masuk; `docs/design/`): full
   token mapping done via `DESIGN.md` for Campus Harvest & Rescue (Plus Jakarta
   Sans headings + Inter body, primary `#2E7D4F`, accent `#F28C28`, canvas
   `#FFFBF5`, `rounded-xl` cards). Single light theme only — no dark mode, as
   specified by the design.
8. **shadcn init**: newest CLI (`shadcn@latest`) uses `-d/--defaults` with the
   `base-nova` preset; `button` came from init. Added only the Phase-1 set:
   button, card, input, label, badge, sonner, skeleton, separator, sheet,
   dialog, avatar, dropdown-menu.
9. **`metrics.wastePreventedKg` returns `null`** (not 0) when average weight is
   missing, so UI can distinguish "no data" from "zero waste".

## Phase 3

10. **Blank `/cara-kerja` on prod is a deploy issue, not a code bug**: prod HTML
    is byte-identical to local dev (40003 bytes) and references dev-only
    chunks (`turbopack_browser_dev_hmr-client`, `react-dom_development`) —
    the host serves `next dev`, not `next build` output. All chunk URLs return
    200, and local curl shows the content present in HTML (inline
    `opacity:0;translateY(20px)` SSR styles); the page only stays blank if JS
    never hydrates. Fix is deploy-side: `bun run build && bun run start`.
    No repo/Dockerfile/CI config exists and `git remote` is empty — prod launch
    method unknown, host owner must confirm. Robustness follow-up (unplanned):
    motion wrappers SSR `opacity:0`, so any hydration failure blanks the page;
    prefer visible-by-default + client-effect animation later.
11. **Daily cap 2 porsi/hari enforced in DB** (`20261027000004_daily_cap.sql`,
    `create or replace`, UNTESTED — no Docker/local DB here, `bun run db:reset`
    + `db:test` pending on deploy owner): sums same-day `quantity` (WIB day
    boundary via `at time zone 'Asia/Jakarta'`, cancelled excluded, admin
    exempt), rejects over 2 with `daily limit`; route maps it to 429
    "Batas harian tercapai". Dead `isPortionOrderable` filter removed — SQL
    `.gt/.lte` on `expires_at`/`release_at` carries the per-row window.
12. **Order success feedback narrows, not duplicates**: `KatalogList` shows an
    `<output>` confirmation + decrements local `Sisa N`, clears stale success
    on next order, disables the button at 0 to avoid futile clicks (DB stays
    the real duplicate guard). Copy softened — no QR page exists yet, so no
    QR promise. `/katalog:307` verified expected: middleware redirects anon
    to `/masuk?next=/katalog`, same local and prod.

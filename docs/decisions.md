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
13. **Seed kaya + `bun run seed`**: `supabase/seed.sql` jadi 6 tenant kantin
    (Warteg, Kopi Pojok, Padang, Soto, Pecel, Geprek), 16 menu, 12 porsi
    (segar/hampir habis/hampir kedaluwarsa/1 expired sbg bukti filter BR-2).
    `scripts/seed.ts` cuma `supabase db reset` via node:child_process —
    versi Bun.$ + SQL dibuang karena `tsc --noEmit` tak kenal modul `bun`
    (perlu `bun-types`, dep baru; YAGNI). Trip `db reset` ikut config
    `[db.seed] sql_paths` otomatis, jadi script = reset + log.
14. **Login email+password di samping Google**: `masuk/email-sign-in.tsx`
    (react-hook-form + zod, pola repo yg sudah ada; `signInWithPassword` /
    `signUp` dari supabase-js bawaan — tanpa dep baru). Daftar langsung
    bikin profil student via trigger `handle_new_user`. Error credential
    dibedakan ("Email atau kata sandi salah"), error lain generik.
    Backend butuh **email provider aktif** di Supabase
    (Auth > Providers > Email); konfirmasi email opsional tapi disarankan
    dimatikan utk pilot kampus biar signup langsung login. Tanpa DB lokal
    (Docker mati) — verifikasi fungsional di tangan owner via `bun run seed`
    lalu coba daftar/masuk di `/masuk`.

## Phase 4 (full implementation, 27–28 Okt 2026)

15. **Struktur rute**: student (`katalog/[portionId]`, `pesanan`, `profil`) di
    `src/app/(public)/` — URL tetap `/katalog`, `/pesanan`, `/profil` (tanpa
    prefix grup). `tenant/*` dan `admin/*` di root `src/app/` karena butuh guard
    role; file `src/app/katalog|pesanan|profil` duplikat hasil paralel dihapus.
16. **RPC `place_order` sudah dukung slot** (`p_slot_start/end`, migrasi
    `20261027000002/04`); `src/app/api/orders/route.ts` diteruskan + balikan
    `{ ok, orderId }` agar `OrderForm` push ke `/pesanan/[orderId]`. Validasi
    slot berpasangan di client, ketat di DB (`slot past expiry`, dsb → 400).
17. **Proxy guard `/pesanan`**: `src/lib/supabase/proxy.ts` lindungi
    `/katalog|/pesanan|/profil|/tenant|/admin`; anon → `/masuk?next=`.
18. **Unverified runtime**: order/cancel/scan/approve/CSV butuh DB lokal
    (Docker mati, konsisten #11) + login sungguhan. `bun run build` 20 route
    lolos. `bun run check` gagal hanya di skill vendored
    (impeccable/scripts); typecheck + test hijau, scope `src`/`supabase` bersih.
19. **Advisories audit (28 Okt, weighed)**: `is_active` fix dipindah ke
    migrasi `20261028000002` (000001 dikembalikan utuh — belum pernah apply,
    aman). `scripts` `db:test`/`db:types` ditambah. `getOwnTenant` tanpa
    redirect di dalam; semua RPC snake_case; QR import valid; policy
    replay-safe; grants explicit ke `authenticated`.
20. **DB debt eksplisit**: Docker daemon down → `db:reset`/`db:test`/
    `db:types` belum bisa jalan. `src/types/` dibuat + `.gitattributes`
    (`eol=lf`) agar state nempel. pgTAP policy count dibetulkan 5→6
    (akibat `tenants_admin_read`) + cek 12 RPC; daily-cap skip bertahan.
    Gate sebelum screen baru: Docker hidup → `db:reset` → `db:test` →
    `db:types`. Bukan silent.
21. **Lint truth (28 Okt)**: `biome.json` exclude `.claude/.omp/.pi` (tanpa
    `/**` — rule Biome 2.2 `useBiomeIgnoreFolder`, safe-fix) → `bun run check`
    hijau penuh (lint + typecheck + 29 test).
22. **Deviasi `cara-kerja` dari mockup (28 Okt)**: BR-2 "120–240 mnt pasca-
   masak" (= "2–4 jam") menggantikan copy mockup "sebelum tutup"; klaim
   santan/gulai 4 jam dihapus (tak ada enforcement di RPC/schema — klaim
   berani tanpa kode = dilarang); FAQ "kuota kembali bila dibatalkan"
   (cancel manual via `cancel_order`, bukan auto-release); struktur 3
   langkah/false "nol rupiah" diubah agar selaras RPC (`place_order` gratis,
   bayar tunai/QRIS di tenant, fee pilot 0). Hero reuse foto existing
   `public/images/foto_kantin.webp` (tanpa aset baru).
23. **Bug hunt 28 Okt (14 temuan, P0–P3)**: auth singleton
   (`client.ts`), proxy `/auth/*` dikecualikan dari bounce, header refresh
   hanya SIGNED_IN/OUT, `impact_summary` sum+admin-guard + `update_portion`
   menu-active/release-check di migrasi BARU `20261028000003` (edit langsung
   000001 di-revert — migrasi applied tak boleh diubah), API `not_released`
   → 409, CSV strip tab/CR, `exportCsv` validasi tanggal, detail porsi
   single-fetch, pesanan/admin error state, sign-in pakai `resolveNext`,
   datetime-local prefill `T+slice(0,16)`, pgTAP plan 16. Laporan penuh:
   `docs/qa/bug-hunt-report.md`. Docker mati → RPC Baru unverified
   di DB lokal; `check` + `build` hijau.
24. **Akun seed email+password (BUG-2026-10-28, 28 Okt)**: `seed.sql` tak
   pernah bikin `auth.users` (placeholder UUID + FK ke `auth.users.id`),
   jadi login email gagal `Database error querying schema` sementara Google
   work via trigger `handle_new_user`. Fix: `scripts/seed-auth.ts`
   (dev-only, service-role key dari env tak ter-commit) bikin auth user via
   Admin API + remap `tenants.owner_id` placeholder → id asli + set
   role/`is_approved`; `SEED_ACCOUNTS` di `src/lib/domain/seed-accounts.ts`
   jadi source of truth; password dev (`Porsi123!`) hanya di `docs/setup.md`
   §6, tak di repo. Docker mati → `db:reset`/`db:test` aktual + verifikasi
   login di tangan owner; `bun run check` + 32 unit test hijau.
 25. **Landing impeccable 5-command (28 Okt)**: `page.tsx` (hero `text-balance`/`font-heading`, trust row `min-h-11`, papan: sr-heading + tabular + WIB + baris Habis stempel miring, kickers hapus, section `scroll-mt-20`, CTA primer → `/katalog`). Detector `[]`, `check` (32 test) + `build` hijau. CSS keyframes awal lalu diganti `motion` (lihat 26).
 27. **Audit shadcn+motion penuh (28 Okt, perintah owner)**: 10 primitif baru via `shadcn add` (select/accordion/checkbox/textarea/radio-group/tabs/switch/slider/progress/toggle). 5 `<select>` native → shadcn Select (katalog/pesanan/qty/menu/window; RHF Select via watch+setValue). ~40 button/input/label native → Button/Input/Label/Checkbox (+buttonVariants utk Link). FAQ `<details>` → Accordion. Motion: Pressable (whileHover/whileTap, reduced-motion off) utk 4 CTA landing; accordion pakai animasi bawaan `animate-accordion-down`. Slider generated kena `biome-ignore noArrayIndexKey` (preseden label.tsx). Proof: `check` (32 test) + `build` hijau, FAQ 4 item expand, nol `<select>/<details>/<input>/<button>/<label>` native di app. Skipped skills: tak ada dep baru (base-ui sudah ada).

28. **Masuk magic-link tanpa sandi (28 Okt, harden+shape+adapt `/masuk`, perintah owner)**: `email-sign-in.tsx` ditulis ulang — sandi/konfirmasi/toggle-daftar dibuang; ganti `signInWithOtp` (`emailRedirectTo` = `/auth/callback?next=` bila `isSafeNext`) + state terkirim + "Ganti email". Tanpa dep baru. Harden: error `aria-invalid`+`aria-describedby`+`role=alert`+ikon, rate-limit dibedakan, `inputMode="email"`, `min-w-0`. Adapt: `min-h-11` di input + kedua tombol (≥44px). Heading → "Masuk" + "Tanpa kata sandi…"; ajakan daftar + teks SOP dihapus. Butuh **email provider + template Magic Link aktif** di Supabase + redirect allowlist = origin app. `check` (35 test) + `build` hijau, detector `[]`.
29. **Katalog view grid+list (28 Okt, perintah owner)**: toggle grid (default 2 kol mobile, 3 desktop) + list; kartu grid: gambar rasio 4:3, list: thumb 80px; tanpa kolom gambar di DB (`menu_items`/`portions` polos) → `CatalogPortion.imageUrl?` opsional (selalu null sampai migrasi+upload ada), kosong = placeholder `ImageOff` + caption "tidak ada gambar" via `next/image` (bukan `<img>`). Toggle = `fieldset`+`legend` sr-only + `aria-pressed`. `check` (35 test) + `build` hijau.
30. **Katalog Detail sekunder + link QR (28 Okt, perintah owner)**: tombol "Detail" sekunder (border, h-11) di grid + list → `/katalog/[id]`; banner sukses ganti kata "terkunci" → "1 porsi dipesan" + link "Lihat QR pesanan" (`/pesanan/[orderId]` dari `POST /api/orders`, fallback `/pesanan` bila null). `check` (35 test) + `build` hijau.

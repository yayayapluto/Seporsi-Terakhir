

# Decisions

Assumptions, deviations, and interpretations. Updated as work proceeds.
- Kanvas putih global (30 Okt, pilih user, revisi): `--background` dijadikan `#FFFFFF` â€” seluruh halaman putih, tidak ada krem. Membatalkan override krem 30 Okt; selaras penuh PRODUCT-Siera Â§2/Â§4/Â§8 + hasil sampling screenshot.
- Katalog (30 Okt): Hero Card + filter Siera, grid `1â†’2â†’3` kolom di desktop (`sm`/`lg`), harga rescue pakai token `accent-strong #9A520A` (kontras 5.86:1) bukan `#F28C28` (2.45:1, gagal AA) â€” craft-floor kontras menang atas catatan Siera Â§3.1; sold-out jadi Disabled Card tanpa link (bukan `aria-disabled` semu); filter disusun bertingkat di mobile (temuan audit terjepit 430px).
- Detail katalog (30 Okt): Detail Header Card (badge stok + countdown + judul + tenant + divider + harga + batas ambil), foto rounded-20 + panel pesan sticky 360px + Field rows berikon (jam, timer, bahan, alergen, tenant) + Empty Card; copy humanizer ("tanya langsung saat ambil kalau kamu punya alergi"); mobile: ringkasan â†’ foto â†’ pesan â†’ detail.
- `next.config.ts` (30 Okt): `remotePatterns` hostname `**.supabase.co` â†’ `*.supabase.co` â€” `**` bukan wildcard valid Next (image optimizer 400 untuk foto menu Supabase).
- Pesanan + detail (30 Okt): Hero Card + filter card + Grouped List (tile ikon, harga accent-strong, tombol Batalkan danger-soft) + Motion fade; badge status ikut token Siera; EmptyState jadi Empty Card (dipakai juga notifikasi); detail = Detail Header Card + foto + Field rows + panel QR/aksi sticky 360px; copy humanizer ("Pesanan selesai, selamat menikmati!"); QR panel akhirnya render (tambah `return` yang hilang â€” P0).
- Notifikasi drawer (30 Okt): bell di AppHeader buka drawer kanan (Motion slide + overlay, Esc/fokus/scroll-lock, hormat reduced-motion), isi awal server + realtime via NotifLive; tombol "Tandai semua dibaca" di header + centang per notif (status baca di localStorage per akun, item dibaca meredup); tombol "Lihat semua" dihapus, halaman `/notifikasi` tetap ada.
- Primitif Siera bersama (30 Okt): `src/components/siera.tsx` â€” SieraCard/sieraCardClass, SieraTile, SieraField, SieraSectionTitle, SieraHero, SieraTenantHeader. 20 file dimigrasi (student + tenant + cara-kerja + pengaturan + notif-row), 5 commit. Pengecualian yang disengaja: hero beranda (struktur khusus + target tur), skeleton loading (varian ukuran), nav-tabs (shadow custom), empty-state dashed, badge sukses pesanan. `bun run check` repo masih merah hanya oleh 5 error pre-existing di luar scope.
- Progres tur per langkah (30 Okt): tabel tour_progress (RLS owner-only) + Server Actions get/save + route PUT beacon; hook useTourProgress (localStorage sinkron per user+tur, debounce 300ms, flush visibilitychange/pagehide, rekonsiliasi final-menang, cross-tab, anon-merge). Resume langsung ke langkah tersimpan tanpa kedip; jeda >7 hari â†’ Lanjutkan/Mulai dari awal; versi + stepId stabil + furthest; restart eksplisit via ?fresh=1 (tautan Panduan di Akun). Tes: 14 pure-logic hijau. Terus terang: visual multi-langkah & login-asing belum diverifikasi (tanpa akun uji).
- Error pages Siera (30 Okt, shape): 404/403 hero tanpa eyebrow + tombol primer h-12; error.tsx hero judul + alert danger + Coba lagi; global-error mandiri inline-style; copy kata-per-kata; unauthorized tetap alias.
- Login Siera (30 Okt, shape): Hero Card tanpa eyebrow (patuh ban kicker craft-floor, bukan SieraHero) + Google primer h-12 + Field Card email h-12 + alert danger radius-16; logika/routing/copy utuh; kolom ramping dipertahankan untuk auth.
- Tenant Siera (30 Okt, shape+redesign): dasbor Stat Cards + CTA Scan + Grouped List + Empty Card + Bantuan; scan/pesanan/menu/porsi/daftar/tunggu/detail Siera; /profil multi-role (tenant Kelola kantin, admin Kelola platform); tab Notifikasi dihapus tenant+admin; Akun tenant tidak lagi mental ke /tenant.
- Pengaturan berfungsi penuh (30 Okt, shape): Keamanan -> /akun/keamanan info read-only; Bahasa dihapus; Privasi -> /akun/privasi unduh JSON data sendiri + info hapus via admin; Profil kantin -> /tenant/profil form nama+lokasi via RPC update_tenant_profile (migrasi 00002, security definer). Tes schema+shaping 6 hijau.
- Rantai onboarding URL bersih (30 Okt, revisi): pintu masuk tunggal `?panduan=rantai` (banner new-user auto + link Panduan Akun); halaman rantai tanpa param (`/katalog`, `/pesanan`, `/profil`); status rantai di localStorage `seporsi-tour-chain` (timestamp, kedaluwarsa 7 hari); halaman lanjutan lompat ke langkah 1 tanpa intro; Selesai pindah halaman via next yang dihitung di klien; Lewati/selesai-ujung menutup rantai. Legacy `?tour=journey`/`chaining=true` tetap dikenali.
- Layout per viewport (30 Okt): kontainer 430pxâ†’`sm:max-w-none md:max-w-3xl lg:max-w-6xl` (tablet portrait/landscape HP pakai lebar penuh, tidak lagi kolom ramping); sidebar desktop jadi `fixed inset-y-0` + spacer `w-60` di NavTabs (hanya ter-render di rute in-app â€” sidebar tidak pernah ikut scroll, tanpa gutter mati 240px di halaman publik); footer minimal `SiteFooterMini` via `FooterSlot` di semua halaman dalam kecuali `/`, `/cara-kerja`, `/masuk` (link 44px mobile); `SelectItem` basis min-h-44px (pengecualian edit shadcn: hit-area jempol). E2E 36 cek (6 viewport Ã. 6 rute): overflow 0, footer tepat, gated â†’ `/masuk`.
- Onboarding overlay v2 (30 Okt): portal ke body, cutout SVG sungguhan (tanpa outline hijau), tooltip berpanah + flip/shift via placeTooltip teruji (tour-placement.test.ts, 4 test), gap 12px, padding hole 10px + radius ikut target, ResizeObserver + scroll/resize/fonts settle, inert latar, aria-live, fokus ke judul, panah kiri/kanan, resume journey via banner ("Lanjutkan panduan"), copy netral perangkat, badge jadi "Batas ambil N mnt lagi". Tanpa dep baru; Floating UI tidak jadi ditambah (fungsi 40 baris cukup).
- Bottom-nav clearance (30 Okt): `main` dapat `padding-bottom: 5.5rem + safe-area` khusus mobile + rute in-app (`body:has(nav)` di `globals.css`) â€” konten tidak lagi tertutup bottom bar di semua halaman; `pb-28` per halaman dihapus.
- Tour onboarding app-wide (30 Okt): GuidedTour terpadu gantikan OnboardingTour beranda (file lama dihapus) â€” pola intro â†’ langkah spotlight â†’ konfirmasi lewati, sekali per tourKey (localStorage) kecuali forced `?mode=onboarding`. Terpasang di 11 halaman student+tenant (beranda, katalog, katalog-detail, pesanan, pesanan-detail, profil, tenant dashboard/menu/porsi/pesanan/scan); admin ikut ke-upgrade otomatis. Adaptif device: bottom-sheet + safe-area + dvh di mobile, popover di desktop â‰¥1024px, target sentuh â‰¥44px, hormat reduced-motion. Tombol tur pakai sistem Button yang ada (default/outline/link), transisi antar-langkah mode wait (keluar dulu baru masuk), ikon Kembali dialog konfirmasi dibetulkan. Copy tur Bahasa Indonesia ringkas per alur.
- Skill `humanizer-indonesia` v1.6 (MIT, adhiprib) terpasang di `.claude/skills/humanizer-indonesia/` (tanpa `portable/`). Dipakai untuk copywriting `/beranda`: sapaan ikut jam WIB, `Pickup` -> `Ambil`, en dash jam -> hubung, `Segera habis` -> `Keburu habis`, empty state + ajakan balik, banner tutur kampus. Metrik `metrik.py` preset akademik tidak relevan untuk microcopy UI (kalimat pendek wajar); audit manual: nol verba ringan, nol kalke, nol en dash.
 - Notifikasi realtime (29 Okt): halaman `/notifikasi` per role dari tabel ada (student = `my_orders` selesai/batal, tenant = reservasi masuk, admin = tenants pending), live via Supabase Realtime `NotifLive` (pola `OrderLiveStatus`), idle nol request. Bug badge sudah diperbaiki: query lama pakai tabel `tenant_applications` + kolom `buyer_id` + status `confirmed/ready/placed` yang tidak ada di skema â†’ badge selalu 0; kini `student_id`/`reserved`, join `portions.tenants.owner_id`, `tenants is_approved=false`. Tab Notifikasi + Akun dipisah (`/notifikasi` vs `/profil`), nav-tabs `inApp` ditambah `/notifikasi`. Biome+typecheck+test(41)+build hijau scope; `bun run check` repo tetap gagal di `scripts/gen-link.ts` (pre-existing, bukan scope).
## Phase 1

1. **Repo name vs scaffold**: `create-next-app` refuses uppercase project names
   ("INFINITY"). Scaffolded into a temp dir (`porsi-scaffold`) and copied into
   this repo instead. Package renamed to `porsi-terakhir`.

2. **Next.js 16.4.3 / React 19.3.0 / Tailwind v4 / Biome 2.4.2**: installed by the
   scaffold's pinned latest; accepted as "latest stable" per brief.
3. **BR-6 interpretation**: discounted price = 45% of normal price (midpoint of
   40â€“50%), rounded to nearest Rp500, never below Rp500, always strictly below
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
   install succeeded (`supabase --version` â†’ 2.122.0).
7. **Stitch designs present** (landing, katalog, masuk; `docs/design/`): full
   token mapping done via `DESIGN.md` for Campus Harvest & Rescue (Plus Jakarta
   Sans headings + Inter body, primary `#2E7D4F`, accent `#F28C28`, canvas
   `#FFFBF5`, `rounded-xl` cards). Single light theme only â€” no dark mode, as
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
    chunks (`turbopack_browser_dev_hmr-client`, `react-dom_development`) â€”
    the host serves `next dev`, not `next build` output. All chunk URLs return
    200, and local curl shows the content present in HTML (inline
    `opacity:0;translateY(20px)` SSR styles); the page only stays blank if JS
    never hydrates. Fix is deploy-side: `bun run build && bun run start`.
    No repo/Dockerfile/CI config exists and `git remote` is empty â€” prod launch
    method unknown, host owner must confirm. Robustness follow-up (unplanned):
    motion wrappers SSR `opacity:0`, so any hydration failure blanks the page;
    prefer visible-by-default + client-effect animation later.
11. **Daily cap 2 porsi/hari enforced in DB** (`20261027000004_daily_cap.sql`,
    `create or replace`, UNTESTED at the time â€” no Docker/local DB here, verification via hosted
    `db:push` pending on deploy owner): sums same-day `quantity` (WIB day
    boundary via `at time zone 'Asia/Jakarta'`, cancelled excluded, admin
    exempt), rejects over 2 with `daily limit`; route maps it to 429
    "Batas harian tercapai". Dead `isPortionOrderable` filter removed â€” SQL
    `.gt/.lte` on `expires_at`/`release_at` carries the per-row window.
12. **Order success feedback narrows, not duplicates**: `KatalogList` shows an
    `<output>` confirmation + decrements local `Sisa N`, clears stale success
    on next order, disables the button at 0 to avoid futile clicks (DB stays
    the real duplicate guard). Copy dilunakkan â€” no QR page exists yet, so no
    QR promise. `/katalog:307` verified expected: middleware redirects anon
13. **Seed kaya + `bun run seed`**: `supabase/seed.sql` jadi 6 tenant kantin
    (Warteg, Kopi Pojok, Padang, Soto, Pecel, Geprek), 16 menu, 12 porsi
    (segar/hampir habis/hampir kedaluwarsa/1 expired sbg bukti filter BR-2).
    `scripts/seed.ts` hanya `supabase db reset` via node:child_process â€”
    versi Bun.$ + SQL dibuang karena `tsc --noEmit` tidak kenal modul `bun`
    (perlu `bun-types`, dep baru; YAGNI). Trip `db reset` ikut config
    `[db.seed] sql_paths` otomatis, jadi script = reset + log.
14. **Login email+password di samping Google**: `masuk/email-sign-in.tsx`
    (react-hook-form + zod, pola repo yang sudah ada; `signInWithPassword` /
    `signUp` dari supabase-js bawaan â€” tanpa dep baru). Daftar langsung
    membuat profil student via trigger `handle_new_user`. Error credential
    dibedakan ("Email atau kata sandi salah"), error lain generik.
    Backend butuh **email provider aktif** di Supabase
    (Auth > Providers > Email); konfirmasi email opsional tapi disarankan
    dimatikan untuk pilot kampus agar signup langsung login. Tanpa DB lokal
    (Docker mati) â€” verifikasi fungsional di tangan owner via `bun run seed`
    lalu coba daftar/masuk di `/masuk`.

## Phase 4 (full implementation, 27â€“28 Okt 2026)

15. **Struktur rute**: student (`katalog/[portionId]`, `pesanan`, `profil`) di
    `src/app/(public)/` â€” URL tetap `/katalog`, `/pesanan`, `/profil` (tanpa
    prefix grup). `tenant/*` dan `admin/*` di root `src/app/` karena butuh guard
    role; file `src/app/katalog|pesanan|profil` duplikat hasil paralel dihapus.
16. **RPC `place_order` sudah dukung slot** (`p_slot_start/end`, migrasi
    `20261027000002/04`); `src/app/api/orders/route.ts` diteruskan + balikan
    `{ ok, orderId }` agar `OrderForm` push ke `/pesanan/[orderId]`. Validasi
    slot berpasangan di client, ketat di DB (`slot past expiry`, dsb â†’ 400).
17. **Proxy guard `/pesanan`**: `src/lib/supabase/proxy.ts` lindungi
    `/katalog|/pesanan|/profil|/tenant|/admin`; anon â†’ `/masuk?next=`.
18. **Unverified runtime**: order/cancel/scan/approve/CSV butuh DB lokal
    (Docker mati, konsisten #11) + login sungguhan. `bun run build` 20 route
    lolos. `bun run check` gagal hanya di skill vendored
    (impeccable/scripts); typecheck + test hijau, scope `src`/`supabase` bersih.
19. **Advisories audit (28 Okt, weighed)**: `is_active` fix dipindah ke
    migrasi `20261028000002` (000001 dikembalikan utuh â€” belum pernah apply,
    aman). `scripts` `db:types` ditambah (`db:test` wacana pgTAP tidak jadi). `getOwnTenant` tanpa
    redirect di dalam; semua RPC snake_case; QR import valid; policy
    replay-safe; grants explicit ke `authenticated`.
 20. **DB debt eksplisit [retired â€” era Docker, kini hosted-only]**: Docker daemon down â†’ perintah lokal
    `db:reset`/`db:test`/`db:types` belum bisa jalan saat itu. Kini: `db:push`, `db:migrations`,
    `db:types` ke hosted linked; `seed:auth` â†’ `db:seed` untuk data demo. `src/types/` dibuat +
    `.gitattributes` (`eol=lf`) agar state nempel. pgTAP policy count dibetulkan 5â†’6
    (akibat `tenants_admin_read`) + cek 12 RPC; daily-cap skip bertahan.
21. **Lint truth (28 Okt)**: `biome.json` exclude `.claude/.omp/.pi` (tanpa
    `/**` â€” rule Biome 2.2 `useBiomeIgnoreFolder`, safe-fix) â†’ `bun run check`
    hijau penuh (lint + typecheck + 29 test).
22. **Deviasi `cara-kerja` dari mockup (28 Okt)**: BR-2 "120â€“240 mnt pasca-
   masak" (= "2â€“4 jam") menggantikan copy mockup "sebelum tutup"; klaim
   santan/gulai 4 jam dihapus (tidak ada enforcement di RPC/schema â€” klaim
   berani tanpa kode = dilarang); FAQ "kuota kembali bila dibatalkan"
   (cancel manual via `cancel_order`, bukan auto-release); struktur 3
   langkah/false "nol rupiah" diubah agar selaras RPC (`place_order` gratis,
   bayar tunai/QRIS di tenant, fee pilot 0). Hero reuse foto existing
   `public/images/foto_kantin.webp` (tanpa aset baru).
23. **Bug hunt 28 Okt (14 temuan, P0â€“P3)**: auth singleton
   (`client.ts`), proxy `/auth/*` dikecualikan dari bounce, header refresh
   hanya SIGNED_IN/OUT, `impact_summary` sum+admin-guard + `update_portion`
   menu-active/release-check di migrasi BARU `20261028000003` (edit langsung
   000001 di-revert â€” migrasi applied tidak boleh diubah), API `not_released`
   â†’ 409, CSV strip tab/CR, `exportCsv` validasi tanggal, detail porsi
   single-fetch, pesanan/admin error state, sign-in pakai `resolveNext`,
   datetime-local prefill `T+slice(0,16)`, pgTAP plan 16. Laporan penuh:
   `docs/qa/bug-hunt-report.md`. Docker mati â†’ RPC Baru unverified
   di DB lokal; `check` + `build` hijau.
24. **Akun seed email+password (BUG-2026-10-28, 28 Okt)**: `seed.sql` tidak
   pernah membuat `auth.users` (placeholder UUID + FK ke `auth.users.id`),
   jadi login email gagal `Database error querying schema` sementara Google
   berfungsi lewat trigger `handle_new_user`. Perbaikan: `scripts/seed-auth.ts`
   (dev-only, service-role key dari env tidak ter-commit) membuat auth user via
   Admin API + remap `tenants.owner_id` placeholder â†’ id asli + set
   role/`is_approved`; `SEED_ACCOUNTS` di `src/lib/domain/seed-accounts.ts`
   jadi source of truth; password dev (`Porsi123!`) hanya di `docs/setup.md`
   Â§6, tidak di repo. Saat itu Docker mati â†’ verifikasi aktual di tangan owner via hosted
   `db:push` + login; `bun run check` + 32 unit test hijau.
25. **Landing impeccable 5-command (28 Okt)**: `page.tsx` (hero `text-balance`/`font-heading`, trust row `min-h-11`, papan: sr-heading + tabular + WIB + baris Habis stempel miring, kickers hapus, section `scroll-mt-20`, CTA primer â†’ `/katalog`). Detector `[]`, `check` (32 test) + `build` hijau. CSS keyframes awal lalu diganti `motion` (`Pressable` whileHover/whileTap, reduced-motion off â€” lihat #26).
26. **Audit shadcn+motion penuh (28 Okt, perintah owner)**: 10 primitif baru via `shadcn add` (select/accordion/checkbox/textarea/radio-group/tabs/switch/slider/progress/toggle). 5 `<select>` native â†’ shadcn Select (katalog/pesanan/qty/menu/window; RHF Select via watch+setValue). ~40 button/input/label native â†’ Button/Input/Label/Checkbox (+buttonVariants untuk Link). FAQ `<details>` â†’ Accordion. Motion: Pressable (whileHover/whileTap, reduced-motion off) untuk 4 CTA landing; accordion pakai animasi bawaan `animate-accordion-down`. Slider generated kena `biome-ignore noArrayIndexKey` (preseden label.tsx). Bukti: `check` (32 test) + `build` hijau, FAQ 4 item expand, nol `<select>/<details>/<input>/<button>/<label>` native di app. Skipped skills: tidak ada dep baru (base-ui sudah ada).

27. **Masuk magic-link tanpa sandi (28 Okt, harden+shape+adapt `/masuk`, perintah owner)**: `email-sign-in.tsx` ditulis ulang â€” sandi/konfirmasi/toggle-daftar dibuang; ganti `signInWithOtp` (`emailRedirectTo` = `/auth/callback?next=` bila `isSafeNext`) + state terkirim + "Ganti email". Tanpa dep baru. Harden: error `aria-invalid`+`aria-describedby`+`role=alert`+ikon, rate-limit dibedakan, `inputMode="email"`, `min-w-0`. Adapt: `min-h-11` di input + kedua tombol (â‰¥44px). Heading â†’ "Masuk" + "Tanpa kata sandiâ€¦"; ajakan daftar + teks SOP dihapus. Butuh **email provider + template Magic Link aktif** di Supabase + redirect allowlist = origin app. `check` (35 test) + `build` hijau, detector `[]`.

28. **Katalog view grid+list (28 Okt, perintah owner)**: toggle grid (default 2 kol mobile, 3 desktop) + list; kartu grid: gambar rasio 4:3, list: thumb 80px; tanpa kolom gambar di DB (`menu_items`/`portions` polos) â†’ `CatalogPortion.imageUrl?` opsional (selalu null sampai migrasi+upload ada), kosong = placeholder `ImageOff` + caption "tidak ada gambar" via `next/image` (bukan `<img>`). Toggle = `fieldset`+`legend` sr-only + `aria-pressed`. `check` (35 test) + `build` hijau.
29. **Slot pickup chip bertanggal (28 Okt)**: `datetime-local` di `order-form.tsx` diganti chip 30 menit bertanggal ("28 Okt Â· 12.00â€“12.30") dalam `[releaseAt, expiresAt]` + opsi "Ambil kapan saja" (default); Calendar/Popover tanggal-perintah dibatalkan â€” chip cukup, tanpa dep baru. Tanggal WIB via `Intl` (`toWibDayKey`/`toWibTime`), tanpa `date-fns`. Label `fieldset`/`legend` + `radiogroup`. `check` (40 test) + `build` hijau.
30. **Profil critique fix 5 isu (28 Okt, perintah owner)**: eyebrow "PROFIL" hapus (ban craft-floor); link riwayat dapat label "Lihat riwayat pesanan" + CTA zero-order "Cari porsi sore ini" (`savedPortions==0`, non-error); RPC gagal â†’ `role=alert` "Gagal memuat data dampak" + "Coba lagi" (bukan nol palsu); brand diseragamkan ke "Porsi Terakhir" (ikut PRODUCT/DESIGN, 7 titik di `src/`); sign-out `outline/destructive` â†’ `ghost/muted`; hover hex â†’ token (`primary/90`, `muted`); EmptyState CTA `h-10` â†’ `h-11`. Scope netral (tanpa h1 angka/rescue-bold). `check` (40 test) + `build` hijau.
31. **Banner "Gagal memuat data dampak" = cloud ketinggalan migrasi (28 Okt)**: `my_orders` (+ semua fungsi `20261028000001_portion_details.sql`: post/update_portion, upsert_menu_item, own_tenant_id, admin_report) 404 (`PGRST202`) di cloud â€” `migration list --linked` tunjukkan `20261028000001-03` belum applied padahal `impact_summary` (file lama) hidup. Perbaikan: `bunx supabase db push --linked` (konfirmasi owner), `my_orders` â†’ 200. Pelajarannya: banner profil/pesanan = sinyal migrasi, bukan bug UI.
32. **Deploy CF via OpenNext, worker name `seporsi-terakhir`**: `bun run build` lolos tapi deploy gagal â€” `migrate` dadakan di mesin CF ciptakan `wrangler.jsonc` name `porsi-terakhir` (ikut `package.json`) sementara Worker existing `seporsi-terakhir`; binding self-reference 10143. Perbaikan: `bun add -d wrangler @opennextjs/cloudflare`, `migrate` lokal, `wrangler.jsonc` name+service â†’ `seporsi-terakhir`, commit file config (jangan andalkan migrate dadakan). Tanpa R2 cache (default non-cached, cukup untuk pilot).
33. **Pesanan: QR modal + Detail terpisah (28 Okt, perintah owner)**: list reserved kini `[Lihat QR pickup]` (modal `qr-modal.tsx`, token on-open via `getPickupToken`, QR-value only) + `[Detail]` outline â†’ detail page + `[Batalkan]` per-baris. Harga total detail selaras konvensi katalog = tinta `font-bold` (bukan oranye); badge `reserved` tetap oranye ikut badge tenant existing. `check` (40 test) + `build` hijau.
34. **Seed email â†’ yopmail + timestamp (28 Okt, perintah owner)**: 9 akun seed `*@kampus.ac.id`/`student.ac.id` â†’ `[nama]1793198479@yopmail.com` di semua sumber (seed-accounts, seed-catalog, seed-demo, seed.sql, seed-hosted.sql, reseed_tenants). Alasan: domain fake tidak punya inbox â†’ magic link tidak bisa diterima. Suffix timestamp fix (rerun aman, bukan random). `check` hijau (40 test).
 35. **Docs seed rewrite (28 Okt, perintah owner)**: `setup.md` Â§4 kini urutan sekali jalan (`db:push` â†’ `seed:auth` â†’ `db:seed`) + daftar 9 email yopmail + tegaskan password seed tidak dipakai login + warning `seed:auth` dulu sebelum login pertama (cegah role student salah). `build` + `check` hijau.
 38. **Smooth scroll + page blur via motion/lenis (29 Okt, perintah owner)**: transisi CSS-only dicabut (ganti `page-transition.tsx` â†’ `smooth-provider.tsx`). `motion/react` (sudah ada) untuk blur-enter per route (`key=pathname`, blur 8px + y 12px â†’ tajam, 450ms, `useReducedMotion` â†’ opacity saja). `lenis@1.3.27` baru (satu-satunya lib smooth-scroll; CSS `scroll-behavior` + Next warning `data-scroll-behavior` tidak cukup inersia) â€” 1 instance global, anchor `#faq`/`#keamanan` via `lenis.scrollTo`, scroll-top tiap route. `page-enter/exit` keyframes dihapus. `check` (41 test) + `build` hijau.
39. **Jam masak date-picker resmi shadcn (29 Okt, revisi "porsi baru" disetujui owner)**: `calendar`+`popover` via `shadcn add` â†’ `react-day-picker@10` + `date-fns@4` baru (1 baris justifikasi ini; AGENTS.md). Alasan: `datetime-local` render mentah + tidak satu-tangan; tanggal kini Popover+Calendar, jam `Input type="time"` â€” nilai gabung kembali ke `cookedAtLocal` (skema/RPC tidak berubah). Akar masalah UUID-di-trigger adalah draf simpan `menuItemId` menu yang sudah hilang â†’ restore kini validasi keanggotaan + buang draf basi; tombol "Pakai postingan terakhir" dikembalikan (copy akurat, bukan "kemarin"). Saran 45% tidak timpa ketikan (`lastSuggested` ref). Preview "Tâ€¦" â†’ "29 Okt 14:30". Jarak atas `py-8` = standar konsisten, tidak diubah. `check` (41 test) + `build` hijau, detector `[]`.
40. **Foto menu per menu_items.image_path (29 Okt, perintah owner)**: klaim "bucket sudah ada" keliru â€” `config.toml` bucket masih komen, nol kolom gambar, `imageUrl` selalu null. Dibangun penuh: migrasi `20261029000004` (kolom `image_path`, bucket public `menu-images` 2MB jpg/png/webp, policy select publik + tulis folder-scoped `<tenant_id>/`, RPC `p_image_path` + guard path milik sendiri), upload browserâ†’storage langsung dari dialog Menu (preview + hapus + validasi tipe/ukuran), thumb list + hero detail + grid/list katalog via `publicMenuImageUrl`, `next.config` remotePattern storage. Desain: 1 foto/menu (bukan per porsi â€” posting tetap 3 ketuk, BR-8). `check` (41 test) + `build` hijau, detector `[]`.
41. **Tailwind loader `turbopack.rules["*.css"]` pecahkan `next/font` (29 Okt, build error)**: override `*.css` menimpa penanganan CSS bawaan â†’ `@vercel/turbopack-next/internal/font/google/font` tidak ter-resolve. Perbaikan: hapus blok turbopack + dep `@tailwindcss/turbopack`, ganti plugin PostCSS resmi (`tailwindcss` + `@tailwindcss/postcss` + `postcss`, 1 baris justifikasi ini) + `postcss.config.mjs`. `build` + `check` (41 test) hijau.
42. **Sweep font-ramp penuh (29 Okt, temuan detector)**: 8 `text-[11px]/[15px]/[10px]` di landing/cara-kerja/katalog/portion-form â†’ snap ke ramp (`text-xs` caption, `text-sm` judul preview). Penukaran string lewat skrip (edit per-baris makan closing tag â†’ revert + `str.replace`; skrip python rusak CRLF â†’ normalisasi LF). `check` (41 test) + `build` + detector `[]` hijau.

## 43. Fix 6 isu P review (29 Okt, perintah owner)
- P0: `tenant/pesanan/[id]` tampil token penuh + `CopyTokenButton` (clipboard, fallback diam bila deny). 8 huruf tidak pernah valid vs `TokenSchema` UUID.
- P1a: dashboard countdown `Math.max(0, ...)` â€” tidak pernah `-N mnt`.
- P1b: migration `reject_tenant` (guard = `approve_tenant`), action `rejectTenant`, UI Setuju/Tolak. Penghapusan aman: profile applicant utuh, bisa daftar ulang.
- P2a: confirm pickup via Dialog (pola `TenantCancelButton`); P2b: sukses tampil `totalPrice` (snapshot x qty); P2c: echo "baru kedaluwarsa <=1 jam" di dashboard.
- `check` hijau (41 test), `build` hijau, `detect --json` 7 file `[]`.

 44. **Shell navigasi adaptif + 4 rute role (30 Okt, shape+adapt)**: `BottomNav` jadi sidebar `md+` (student 4 tab: Beranda/Katalog/Pesanan/Akun, badge hanya Pesanan; bell header satu-satunya indikator global), `AppHeader` sticky. Notifikasi: bell dot + reset badge baca; profil kartu ringkas + CTA tenant/pendaftaran + admin. `check` + `build` hijau, smoke 5 rute auth `:3001`.
45. **Aturan Animasi + audit (30 Okt)**: `sonner` + `next-themes` dibuang (tidak dipakai; toast mati tanpa pengganti). Pelanggaran CSS→Motion: `scroll-behavior` hapus (Lenis global), akordeon jadi Motion height/opacity via `render`+`keepMounted`+`inert`, ikon menu Motion morph, `transition-all`→`transition-colors`, tur pakai `lenis-host` + tanpa animasi top/left.
46. **PWA best-practice (2 Nov)**: `src/app/manifest.ts` (standalone, id+scope `/`, tema `#2E7D4F`, ikon 192/512 + maskable) + `manifest.test.ts` (2 test hijau); ikon `public/icons/` render sekali-pakai via sharp dari SVG inline (skrip dihapus); `public/sw.js` tulis ulang — navigasi network-first + fallback `/offline`, aset same-origin SWR, tanpa push server (notif lokal tetap via PushBridge); registrasi global `SwRegister` (prod saja) gantikan daftar per-halaman di push-toggle; header `_headers` (`sw.js` no-cache, ikon 1 hari); `src/app/offline/page.tsx` publik statis; kartu `InstallPwa` di Pengaturan (hanya saat `beforeinstallprompt`); layout tambah `manifest`+`appleWebApp`+`viewport` (`themeColor`, `viewportFit cover`). Tanpa dep baru (tanpa next-pwa/workbox — SW 90 baris cukup). Smoke dev `:3001`: manifest/offline/sw/4 ikon 200, meta theme/manifest/apple OK.

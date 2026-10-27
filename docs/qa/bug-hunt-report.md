# Bug Hunt Report — 28 Okt 2026

Scope: audit menyeluruh repo (routes, auth, RPC, schema, domain, UI copy) +
perbaikan bug terkonfirmasi + regression test. Tanpa Docker/DB lokal:
verifikasi = `bun run check` (lint+typecheck+30 test) + `bun run build`
(20 route, lolos).

## Baseline (sebelum fix)
- `bun run check`: 1 file error (biome format, artifact `.impeccable/`).
- `bun run build`: gagal — `"use client"` hilang di `email-sign-in.tsx`
  (import `useRouter`/`useState`/`useForm` di Server Component).

## Temuan terkonfirmasi & fix
1. **P0 — Auth logout/login rusak** (laporan user): `createClient()` browser
   bikin instance baru tiap panggil → `signOut` di instance A, listener
   `onAuthStateChange` di instance B → navbar nyangkut `Masuk`, login lagi
   gagal. Fix: `src/lib/supabase/client.ts` jadi singleton browser.
2. **P0 — `update_portion` Tanpa validasi `release_at`/menu aktif**:
   release bisa di luar jendela jual, menu nonaktif bisa dipakai. Fix di
   migrasi baru `20261028000003`: tolak `menu not active` + `release past
   expiry`. (Edit langsung file `20261028000001` di-revert — migrasi
   applied tidak boleh diubah.)
3. **P1 — API samakan `not_released` dengan expired (410)**: user kira basi
   padahal belum rilis. Fix `src/app/api/orders/route.ts`: `not_released`
   → 409 "Porsi belum mulai dijual".
4. **P1 — `impact_summary` hitung porsi salah + Tanpa guard admin**:
   `count(*)` hitung order, bukan item; Tanpa filter role → anon bisa baca
   agregat global. Fix di migrasi baru: `sum(quantity)` picked_up + guard
   `exists (… role = 'admin')`.
5. **P1 — CSV injection lolos tab/CR**: regex `^[=+\-@]` Tanpa cegah
   `\t=cmd`/`\r=cmd`. Fix `src/app/admin/csv.ts`: strip `[\t\r]`
   leading sebelum cek. Test tab+CR ditambah.
6. **P1 — Proxy `/auth/*` dianggap auth page**: bounce user login di
   OAuth callback sebelum exchange → loop login Google. Fix:
   hanya `/masuk` yang bounce; `/auth/*` selalu lanjut.
7. **P1 — `exportCsv` `Invalid Date` → 500**: `toISOString()` di string
   tanggal sampah. Fix `src/app/admin/actions.ts`: validasi
   `YYYY-MM-DD`, error ramah.
8. **P2 — Header `router.refresh()` tiap `INITIAL_SESSION`/token refresh**:
   churn re-render tiap jam. Fix `site-header.tsx`: refresh hanya di
   `SIGNED_IN`/`SIGNED_OUT`.
9. **P2 — Detail porsi fetch 2×** (`DetailHeading` + `DetailBody` panggil
   `loadPortion` masing-masing). Fix: parent fetch sekali, oper prop;
   `Suspense` + `getCurrentUser` mati dihapus.
10. **P2 — Halaman pesanan telan RPC error** (`data` Tanpa `error`).
    Fix: cek `error`, tampil "Gagal memuat pesanan".
11. **P2 — `next=/evil.com` open redirect minim** di sign-in email
    (Google callback sudah aman). Fix: pakai `resolveNext()` yang ada.
12. **P2 — Form edit porsi prefill `datetime-local` rusak**: `sv-SE`
    kasih `"2026-10-28 10:00:00"` (spasi+detik), input butuh
    `"YYYY-MM-DDTHH:MM"`. Fix: `replace(" ","T").slice(0,16)`.
13. **P3 — Queue admin Tanpa error state** (`loadPending` gagal → `[]`
    sunyi). Fix `admin/tenant/page.tsx`: `PendingBody` tampil banner error.
14. **P3 — pgTAP `plan(14)` vs 16 tes aktual** + Tanpa regresi
    impact_summary. Fix: `plan(16)` + 2 skip berlabel kebutuhan DB lokal.

## Bukan bug (verifikasi, Tanpa diubah)
- `approve_tenant` tanpa cek row: `single()` error → 404, benar.
- `admin_report`/`my_orders`/`tenant_*`: SECURITY DEFINER + role check
  internal, grants `authenticated` only — aman.
- `owned-tenant guard` + `profiles_role_guard` (role immutable) — aman.
- Copy BR-1..BR-8 di `cara-kerja`/UI selaras RPC terverifikasi.
- 7-hari tenant dashboard limit 50 + date UTC vs WIB: minor, pilot-scale,
  ditunda (ponytail).

## Belum terverifikasi (butuh DB lokal / akun test)
- Semua RPC Baru (`update_portion` guard, `impact_summary` sum+admin,
  `not_released` mapping) — butuh `bun run db:reset` + seed + login
  student/tenant/admin sungguhan. Docker daemon mati saat hunt.
- OAuth Google end-to-end (callback exchange + `next` aman).
- Scan QR pickup + approve tenant + CSV export live.
- Daily-cap 2/hari (pgTAP skip bertahan).

## Gate akhir
- `bun run check`: hijau (lint + typecheck + 30 test, 5 file).
- `bun run build`: lolos, 20 route.

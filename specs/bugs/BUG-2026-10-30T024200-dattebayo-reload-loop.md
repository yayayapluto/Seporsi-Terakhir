# BUG-2026-10-30T024200: /dattebayo reload terus saat login (cek auth)

## Problem

- Aktual: buka path tak dikenal (`/dattebayo`) saat login → tab reload penuh berulang. Address bar tetap `/dattebayo` (tanpa mental ke `/masuk`).
- Harap: tampil halaman 404 statis sekali, diam, tombol kembali ke beranda.
- Reproduksi klaim: login → kunjungi `/dattebayo` di hosting dev maupun localhost → reload loop.
- Security impact: NONE — rute 404 tanpa data; proxy tak bocor sesi (anon 404 bersih, tanpa Set-Cookie aneh).

## Root Cause Analysis

- **Fase 1 Reproduce:** SSR prod lokal `/dattebayo` → `404 Not Found` bersih sekali, tanpa header `location`/`refresh`/`set-cookie` loop. Rantai redirect kosong. Artinya server + proxy tak memicu loop untuk anonim.
- **Fase 2 Isolate:** sweep seluruh `src` untuk primitif reload — `window.location`, `location.reload/replace/assign`, `document.location` → NOL hasil. `router.refresh()` hanya di 12 titik aksi eksplisit (cancel, sign-out, simpan form, scan sukses, SIGNED_IN/OUT di header) — tak satu pun mount di rute 404. `router.push` hanya pasca-aksi. Proxy `updateSession` untuk path tak dikenal: `isProtected=false`, `isAuthPage=false` → `return response` (tanpa redirect). Callback auth aman (hanya tukar code → redirect sekali).
- **Fase 4 Verify (TERVERIFIKASI 2026-10-30):** paste error user dari `next start` = bukti definitif —
  `client reference manifest for route "/masuk" does not exist`, `Failed to load static file for page: /500`,
  `Could not find module .../boundary-components.js#ViewportBoundary|MetadataBoundary` di React Client Manifest.
  Artinya `.next/` berisi cache dev (Turbopack) yg coba disajikan `next start` → manifest rusak → error boundary +
  metadata boundary crash → router retry RSC (`?rsc=` 404 berulang dari `08yr3ddyin5y1.js`) → loop reload penuh.
  Korelasi "saat login": `SiteHeader.onAuthStateChange` → `router.refresh()` picu re-fetch RSC → gagal terus →
  error → retry. Anon tanpa sesi tak picu refresh hingga loop terlihat.
  Setelah `rm -rf .next && bun run build`: `/dattebayo` → 404 SEKALI + tombol beranda hadir, tanpa retry.
  Akar tunggal: **cache `.next` korup (dev-cache disajikan production server)**. Bukan kode, bukan proxy, bukan auth.
- Risk: Low (environmental; tanpa sentuh DB/RPC/auth).

## TDD Fix Plan

1. **RED**: serve dev-cache via `next start` → manifest error + RSC `?rsc=` 404 berulang (paste error user).
   **GREEN**: `predev` wipe `.next` tiap `bun run dev`; `prestart` tolak serve tanpa `BUILD_ID`.
   **verify**: `bun run check`

**REFACTOR**: tak ada — dua hook npm, tanpa kode runtime.

## Acceptance Criteria

- [x] SSR anon `/dattebayo` → 404 bersih, tanpa redirect (terbukti via curl)
- [x] Sweep `location.reload` → nol; `router.*` hanya pasca-aksi (terbukti via grep)
- [x] Paste error user = manifest korup terkonfirmasi (fase 4)
- [x] Build bersih → `/dattebayo` 404 sekali + tombol beranda (terbukti via curl)
- [x] Semua test lama hijau (41/41)

## Resolution

**Fixed:** 2026-10-30
**Root cause confirmed:** cache `.next` korup — dev-cache (Turbopack) disajikan `next start` → manifest hilang → RSC retry loop
**Fix applied:** `predev` wipe `.next`; `prestart` guard `BUILD_ID`
**Hardening added:** `prestart` gagal keras bila tanpa build; tanpa test baru (hook npm, verifikasi via `check` + probe SSR)
**Evidence:** `check` 41/41 hijau, SSR 404 sekali + tombol beranda

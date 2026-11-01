# BUG-2026-10-29T120000: Link tombol diam saat navigasi, tanpa umpan balik

## Problem
- Aktual: Link bergaya tombol (CTA "Lihat katalog", "Scan pickup", dsb) diklik → halaman lama diam beberapa detik, baru pindah. User tak tahu klik diproses.
- Harap: dalam ≤1 frame muncul indikator (spinner/disabled/skeleton) sampai halaman baru tampil.
- Reproduksi: klik CTA mana pun menuju rute server (katalog, detail porsi, pesanan, tenant) di koneksi lambat / server dingin. Dev (= tanpa prefetch) paling terasa.

## Root Cause Analysis
- `ls src/app/**/loading.tsx` → nol. Satu-satunya layout `src/app/layout.tsx`; tak ada boundary loading di segmen mana pun. Saat transisi App Router, halaman lama dipertahankan tanpa fallback → beku.
- Semua navigasi pakai `<Link>` mentah (16+ titik); tak satu pun baca status pending. Padahal Next 16.4.3 menyediakan `useLinkStatus` (terverifikasi di `node_modules/next/dist/client/app-dir/link.d.ts`).
- Form async (`order-form`, `cancel-button`) sudah benar — punya `submitting` + `<Spinner/>`. Celah hanya di navigasi Link.
- Faktor "ngelag" (DB lambat, prefetch mati di dev) hanya memperparah; akar tetap: tak ada UI pending.
- Security impact: NONE. Risk: Low (perubahan aditif, tanpa sentuh DB/RPC/auth).

## TDD Fix Plan
1. **RED**: manual — klik CTA di throttling "Slow 4G", catat tak ada feedback.
   **GREEN**: buat `src/components/nav-link.tsx` ("use client"): bungkus `next/link`, anak dalam baca `useLinkStatus()` → saat `pending` tampil `<Spinner/>` + `aria-disabled` + tolak klik ganda.
   **verify**: `bun run typecheck`
2. **RED**: CTA masih `<Link>` mentah (grep `from "next/link"`).
   **GREEN**: migrasi Link navigasi CTA (landing, cara-kerja, katalog, pesanan, tenant, `empty-state`, header) ke `NavLink`.
   **verify**: `bun run lint`
3. **RED**: `ls src/app/**/loading.tsx` kosong → transisi server beku.
   **GREEN**: tambah `loading.tsx` di segmen server lambat, reuse `LoadingSkeleton` (cards/list/report sesuai bentuk).
   **verify**: `bun run build` + klik ulang di throttling, spinner/skeleton muncul ≤1 frame.
4. **REFACTOR**: tak ada — komponen satu, tanpa abstraksi baru.

## Acceptance Criteria
- [ ] Klik CTA → indikator pending (spinner di tombol / skeleton halaman) terlihat sebelum navigasi selesai
- [ ] Klik ganda saat pending tak picu navigasi ganda
- [ ] `prefers-reduced-motion` tetap dihormati (spinner CSS sudah `animate-spin`; skeleton statis bila perlu)
- [ ] `bun run check` + `bun run build` hijau

## Resolution
<!-- filled in by validate-fix -->

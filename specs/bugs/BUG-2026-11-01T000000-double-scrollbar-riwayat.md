# BUG-2026-11-01T000000: double scrollbar + garis di riwayat pesanan tenant

## Problem

- Aktual: di section "Selesai & dibatalkan" (`/tenant/pesanan`) tampil DUA scrollbar vertikal berdampingan di tepi kanan, plus satu "garis" vertikal tipis. Kartu riwayat kanan terpotong di balik kolom scrollbar.
- Ekspektasi: satu scrollbar shadcn base, tak ada garis; kartu utuh.
- Reproduksi: buka `/tenant/pesanan` dengan riwayat > ~4 baris (melebihi `max-h-560px`) → sisi kanan area riwayat ada dua thumb + satu garis.

## Root Cause Analysis

- Jalur: komponen scroll-area bersama merender satu `ScrollBar` vertikal internal secara otomatis; halaman riwayat merender satu `<ScrollBar />` eksplisit lagi di dalam viewport yang sama. Dua instance = dua track + dua thumb berdampingan.
- Kenapa ada "garis": track scrollbar shadcn membawa `border-l` + padding 1px di kolom `w-2`; dua kolom berdampingan (16px) plus kartu yang terpotong di belakangnya terbaca sebagai garis vertikal, bukan sekadar thumb.
- Faktor kontribusi: komponen bersama menyimpang dari pola dokumentasi shadcn (di docs, `ScrollBar` dirender opsional oleh pemakai, bukan otomatis di dalam komponen). Satu-satunya pemakai komponen ini adalah halaman riwayat, jadi duplikasi tak terlihat di tempat lain.
- Terkait BUG-2026-10-30T062654 (scrollbar horizontal footer): sama-sama scrollbar, beda akar (footer = `w-screen` vs viewport; ini = duplikasi instance). Bukan residu — bug baru dari sesi redesign riwayat.
- Security impact: NONE — murni presentasi, tanpa jalur exploit.
- Risk level: Low — satu section presentasional, tanpa logika/state.

## TDD Fix Plan

1. **RED**: uji render section riwayat — jumlah elemen `[data-slot="scroll-area-scrollbar"]` tepat 1 saat riwayat meluap.
   **GREEN**: hapus SATU dari dua sumber (pilih: hapus render internal di komponen bersama ATAU hapus eksplisit di halaman — jangan keduanya). Rekomendasi: hapus yang eksplisit di halaman, karena komponen bersama sudah selalu menyediakan scrollbar vertikal; ATAU hapus internal dan biarkan pemakai mengontrol (sesuai docs shadcn) bila diprediksi butuh orientasi horizontal.
   **verify**: `bun run test -- <file-baru>`, `bunx biome check <file-ubah>`, `bun run typecheck`, `bun run build`

**REFACTOR**: selaraskan komponen bersama dengan pola docs (ScrollBar opsional oleh pemakai) bila dipilih arah itu; pastikan kartu kanan tak terpotong (ruang thumb overlay).

## Acceptance Criteria

- [ ] Tepat satu `[data-slot="scroll-area-scrollbar"]` di section riwayat saat meluap
- [ ] Tak ada garis vertikal di tepi kanan; kartu kanan utuh
- [ ] Scroll wheel/touch tetap jalan (viewport `max-h-inherit` + `data-lenis-prevent` bertahan)
- [ ] Semua test existing tetap lolos (`bun run test`)

## Resolution

<!-- filled in by validate-fix -->

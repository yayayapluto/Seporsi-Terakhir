# BUG-2026-10-30T062654: scrollbar horizontal di landing (Windows scrollbar klasik)

## Problem

- Aktual: scrollbar horizontal (sumbu X) muncul di halaman landing pada browser Windows dengan scrollbar klasik (non-overlay).
- Ekspektasi: tak ada scroll horizontal di viewport berapa pun; footer tetap full-bleed.
- Reproduksi: buka `/` di Chrome Windows (scrollbar klasik ±17px, konten lebih tinggi dari viewport sehingga Y-scrollbar tampil) → X-scrollbar muncul selebar scrollbar.

## Root Cause Analysis

- Jalur: komponen footer situs memakai trik full-bleed klasik dari dalam kontainer `max-w-6xl`: posisi relatif + `left-1/2` + lebar `100vw` + geser `-translate-x-1/2`.
- Kenapa gagal: `100vw` mencakup lebar scrollbar klasik, sedangkan area konten (`100%`) tidak. Begitu Y-scrollbar tampil, footer jadi ±17px lebih lebar dari viewport → overflow-X → browser tampilkan X-scrollbar. Di headless/macOS (overlay scrollbar) `100vw == innerWidth` sehingga tak terlihat — konsisten dengan pengukuran (`scrollWidth == innerWidth`, nol pelanggar) di lingkungan uji.
- Pola dialog (`fixed top-1/2 left-1/2`) tidak terkait — elemen fixed tak memengaruhi scroll dokumen.
- Security impact: NONE — murni presentasi, tanpa jalur exploit.
- Risk level: Low — satu komponen presentasional, tanpa logika/state.

## TDD Fix Plan

1. **RED**: uji render footer — lebar footer tidak melebihi viewport saat Y-scrollbar disimulasikan (mis. assert `footer.getBoundingClientRect().right <= window.innerWidth` dengan scrollbar klasik / `overflow-y: scroll` paksa di dokumen uji).
   **GREEN**: ganti trik `w-screen` dengan full-bleed berbasis `100%`: footer `w-full` + latar full-bleed via `box-shadow: 0 0 0 100vmax` pada warna yang sama, atau pindahkan footer keluar dari kontainer `max-w-6xl` di layout sehingga `w-full` alami sudah full-bleed.
   **verify**: `bun run test -- <file-baru>` lalu cek manual Chrome Windows: X-scrollbar hilang, footer tetap selebar viewport.

**REFACTOR**: hapus sisa trik translate bila tak dipakai di tempat lain; pastikan tak ada `w-screen` tersisa (`grep w-screen src`).

## Acceptance Criteria

- [ ] Nol scroll horizontal di `/` dengan scrollbar klasik tampil (Windows) pada 390px dan 1440px
- [ ] Footer tetap full-bleed selebar viewport
- [ ] Tidak ada `w-screen` tersisa di `src`
- [ ] Semua test existing tetap lolos (`bun run test`)

## Resolution

<!-- filled in by validate-fix -->

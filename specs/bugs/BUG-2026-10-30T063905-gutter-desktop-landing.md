# BUG-2026-10-30T063905: gutter kiri-kanan lebar di tampilan desktop

## Problem

- Aktual: di layar desktop (mis. 1440px), konten landing terjepit di kolom tengah ±1152px dengan ruang kosong ±136px di kiri dan kanan.
- Ekspektasi: belum diputuskan — apakah gutter ini disengaja (kontainer baca) atau harus full-bleed. Perlu keputusan desain sebelum diubah.
- Security impact: NONE — no security exploit path identified (murni presentasi).

## Root Cause Analysis

- Jalur render: komposisi kolom tengah berasal dari tiga lapis pembatas yang saling menumpuk — kerangka akar, pembungkus konten halaman, dan gaya halaman arahan itu sendiri — semuanya mempersempit lebar ke kolom tengah yang sama.
- Kenapa tampil bergutter: kolom tengah ~1152px dipusatkan di viewport 1440px → sisa ±136px per sisi jadi kanvas kosong. Lapisan footer full-bleed sebelumnya menutupi kesan ini di bagian bawah saja, sehingga gutter kini terlihat tegas dari hero sampai footer.
- Verifikasi: pengukuran DOM di viewport 1440px — konten utama L=136 W=1152, footer menyusul pola sama (L=136 W=1152); bukan overflow (scrollWidth == innerWidth).
- Konteks desain: acuan produk menetapkan basis mobile 360–430px dengan kontainer sempit terpusat di desktop; brief etalase menuntut rentang 360px→1440px tanpa scroll horizontal tetapi tidak menetapkan perilaku gutter desktop. Jadi gutter konsisten dengan acuan, bukan regresi.
- Risk level: Low (visual). Perubahan menyentuh kesan seluruh situs bila diubah global — keputusan ada di pemilik desain.

## TDD Fix Plan

> Opsi A (pertahankan, tanpa kode): nyatakan gutter sebagai perilaku resmi; tutup bug sebagai by-design. Opsi B bila pemilik ingin full-bleed: satu siklus di bawah.

1. **RED**: uji visual/asersi — di viewport 1440px, blok hero membentang ke tepi kanvas dengan padding 16–24px (tanpa kolom tengah), dan tidak ada scroll horizontal.
   **GREEN**: longgarkan pembatas lebar hanya di halaman arahan (hero→footer full-width, padding tepi, konten dalam tetap dibatasi agar keterbacaan terjaga).
   **verify**: `bun run typecheck && bun run test` + cek visual 390px dan 1440px.
2. **RED**: halaman lain (katalog, masuk, dasbor) tidak berubah — tetap kolom tengah seperti semula.
   **GREEN**: batasi perubahan pada modul halaman arahan; kerangka global tidak disentuh.
   **verify**: `bun run build` + cek visual 2 halaman lain.

**REFACTOR**: bila pola full-bleed dipakai di >1 halaman, ekstraksi satu pembungkus seksi bersama; bila hanya arahan, biarkan lokal.

## Acceptance Criteria

- [ ] Keputusan pemilik: pertahankan gutter (tutup by-design) ATAU full-bleed (lanjut siklus di atas)
- [ ] Bila full-bleed: nol scroll horizontal di 390px dan 1440px
- [ ] Bila full-bleed: halaman non-arahan tidak berubah
- [ ] Semua test existing tetap lolos

## Resolution

<!-- filled in by validate-fix -->

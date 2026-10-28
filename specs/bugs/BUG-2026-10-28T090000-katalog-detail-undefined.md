# BUG-2026-10-28T090000: Detail katalog kadang empty-state + log "undefined"

## Problem

- Aktual: beberapa ID porsi dibuka → halaman "Porsi tidak tersedia" + console error `load gagal "<uuid>" undefined`.
- Harap: porsi masih jual tampil detail; porsi habis/kedaluwarsa tampil empty-state TANPA error log menyesatkan.
- Reproduksi: buka detail porsi yang sudah habis/kedaluwarsa (atau tenant belum approved) saat DB hosted belum dimigrasi → selalu masuk jalur fallback lalu log `undefined`.

Security impact: NONE — jalur read-only, RLS tetap sembunyikan baris; tidak ada exploit path. UUID di log bukan data sensitif.

Riwayat: registry hanya punya 2 bug scope auth/seed → ini novel (scope katalog/detail). Temuan kritik P0 sebelumnya (migrasi hosted + RLS) adalah faktor pemicu, bukan file bug yang sama.

## Root Cause Analysis

4 fase (diagnose-root):

1. Reproduce — log user tunjukkan error berasal dari cabang fallback (query kedua tanpa kolom baru) dengan arg ketiga `undefined`, lalu halaman render empty-state. Sifat "terkadang": hanya ID yang tak terlihat sesi buyer yang kena.
2. Isolate — modul pemuat detail porsi: query pertama select kolom baru, query fallback select minimal. Keduanya pakai `maybeSingle`.
3. Hypothesize —
   - H1: baris disembunyikan RLS/jendela jual (habis, kedaluwarsa, belum rilis, tenant tak approved) → nol baris. Lolos uji: semantik `maybeSingle` nol-baris = data null + error null (terverifikasi di lib PostgREST terpasang).
   - H2: kolom baru belum ada di hosted → query pertama selalu gagal, semua trafik dipaksa ke fallback. Lolos uji: migrasi kolom ada di repo, error kolom sempat terlihat di sesi kritik.
   - H3: kode log anggap tiap kegagalan punya objek error. Lolos uji: `error?.message` saat error null = `undefined` — persis isi log.
4. Verify — H1+H2 pemicu, H3 akar tunggal: cabang fallback tak bedakan "nol baris yang sah" vs "error nyata". Akibat: kasus sah (habis/kedaluwarsa/RLS) dicatat sebagai load gagal + tak bisa dibedakan dari kerusakan.

Kontrak yang dilanggar: `maybeSingle` nol-baris bukan error. Cabang sukses-minimal juga tak samakan filter jendela dengan list (list filter eksplisit sisa/kedaluwarsa/rilis; detail andalkan RLS) → race list→detail ikut jadi empty-state, memperbesar kesan "terkadang".

Risk level: Low (UX + log noise; tidak ada kehilangan data/mutasi).

## TDD Fix Plan

1. **RED**: uji helper keputusan log: hasil `{ data: null, error: null }` → jangan log; hasil `{ error }` → log sekali.
   **GREEN**: guard `console.error` dengan `if (error)` di kedua cabang (penuh + fallback); nol-baris return null diam.
   **verify**: `bun run test`

2. **RED**: uji pemicu fallback: hanya pesan missing-column (ingredient/allergen/column) yang picu select minimal; error lain (mis. RLS 42501, FK) langsung return null + log.
   **GREEN**: ekstraksi predikat pesan error ke helper murni + pakai di cabang fallback.
   **verify**: `bun run test`

3. **RED**: uji merge fallback: baris retry tanpa kolom baru → porsi terisi `ingredients: null, allergen_note: null`, field lain utuh.
   **GREEN**: kunci perilaku merge yang sudah ada (tanpa ubah bentuk).
   **verify**: `bun run test && bun run typecheck && bun run lint`

**REFACTOR**: tak ada — helper murni kecil,留在 modul pemuat.

Ops di luar kode (bukan acceptance): jalankan migrasi kolom di hosted agar trafik keluar dari fallback.

## Acceptance Criteria

- [ ] Detail porsi valid tampil normal, tanpa error log
- [ ] Porsi habis/kedaluwarsa/tak terlihat tampil empty-state TANPA console error
- [ ] Error nyata (DB/kolom/RLS) tetap log sekali dengan pesan terisi, tak pernah `undefined`
- [ ] All new tests pass
- [ ] Existing tests still pass

## Resolution

<!-- filled in by validate-fix -->

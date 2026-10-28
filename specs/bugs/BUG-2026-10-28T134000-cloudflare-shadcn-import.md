# BUG-2026-10-28T134000: Cloudflare build gagal — `@import "shadcn/tailwind.css"` tak ter-resolve

## Problem

- Aktual: `bun run build` di Cloudflare gagal: `Can't resolve 'shadcn/tailwind.css'`.
- Harap: build hijau di fresh install (lockfile-only).
- Lokal hijau hanya karena `node_modules/shadcn` stray (CLI v4.23.0, tak ada di `package.json`/`bun.lock`).

## Security impact

NONE — build-time CSS import, no exploit path.

## Root Cause Analysis

- Modul: `src/app/globals.css` baris 3, dibawa sejak scaffold Phase 1.
- `shadcn` bukan dependensi (tak ada di lock); resolver Turbopack gagal di env bersih.
- Isi file stray (637 baris): keyframes `accordion-down/up` + varian `data-open/closed/checked/unchecked/selected` + utilitas `shimmer`.
- Terpakai nyata: keyframes accordion (`ui/accordion.tsx`) + varian `data-open`/`data-closed` (dialog, dropdown, select). `shimmer` tak dipakai di `src/`.
- Hapus import mentah → animasi accordion mati. Fix benar: inline blok terpakai ke `globals.css`, bukan tambah dep baru.
- Risk: Low.

## TDD Fix Plan

1. **RED**: reproduksi — hapus `node_modules/shadcn`, `bun run build` gagal dengan error resolve yang sama.
   **GREEN**: hapus baris `@import "shadcn/tailwind.css"` + inline keyframes `accordion-down/up` dan varian `data-open`/`data-closed` (salin dari stray file, ~60 baris) ke `globals.css`.
   **verify**: `bun run build` hijau + `grep accordion-down` kena di output CSS build.
2. **RED**: pastikan tak ada sisa referensi — `grep -rn "shadcn/" src/`.
   **GREEN**: bersih jika masih ada.
   **verify**: `bun run check` hijau.

**REFACTOR**: tak ada.

## Acceptance Criteria

- [ ] `bun run build` hijau dari fresh install (tanpa `node_modules/shadcn`)
- [ ] Animasi accordion/dialog/dropdown utuh (keyframes + varian ada di CSS build)
- [ ] `bun run check` hijau, tanpa dep baru
- [ ] Existing tests pass

## Resolution

Fixed 2026-10-28: hapus `@import "shadcn/tailwind.css"` (1 baris). `tw-animate-css` sudah sediakan keyframes accordion + `animate-in/out`; CSS build verifikasi masih berisi keduanya. Tanpa dep baru. `check` (40 test) + `build` hijau dari env tanpa stray `node_modules/shadcn`.

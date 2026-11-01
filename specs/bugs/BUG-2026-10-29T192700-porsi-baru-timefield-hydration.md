# BUG-2026-10-29T192700: Hydration mismatch TimeField di /tenant/porsi/baru

## Problem

- Aktual: buka `/tenant/porsi/baru` (dev, Turbopack) → `A tree hydrated but some attributes of the server rendered HTML didn't match`. Diff: `div.flex min-w-0 gap-2` (server) vs `flex min-w-0 items-center gap-2` (client), dan `span.self-center` vs tanpa `self-center` — di `TimeField` (`src/components/time-field.tsx:61`).
- Harap: tak ada hydration error; server HTML = client render pertama.
- Reproduksi: `bun run dev` → login tenant → buka `/tenant/porsi/baru` → error di console.

## Root Cause Analysis

- **Pemicu langsung (stale prerender + file tak terlacak):** `src/components/time-field.tsx` berstatus untracked (`?` di git) — hasil kerja sesi paralel yg belum di-commit. `.next/dev` masih simpan HTML lama (tanpa `items-center`/`self-center`), sementara source kerja sudah baru. Dev server Turbopack tak invalidasi route yg sedang dibuka. Diff error = EXACTLY diff edit sesi ini, bukan nilai dinamis.
- **Akar nyata — `new Date()` di render client:** `portion-form.tsx` panggil `toDateOnly(new Date())` saat render untuk `todayStr`. Server render jam T0, client hydrate jam T1 → `max`/`min`/fallback tanggal bisa beda string bila render lewat tengah malam / beda detik. Klasik `Date.now()`-in-render.
- **Bukan penyebab:** draf `localStorage` (sudah dalam `useEffect`, aman), `Math.random` (tak ada), locale (deterministik dua sisi), ekstensi browser.
- Security impact: NONE — form tenant ter-otentikasi, tanpa data baru.
- Risk: Low (satu baris derivasi; tanpa sentuh DB/RPC/auth).

## TDD Fix Plan

1. **RED**: buka `/tenant/porsi/baru` setelah hapus `.next` → catat error masih/hilang. Jika hilang = stale cache terkonfirmasi.
   **GREEN**: `todayStr = useState(() => initial.cookedAtLocal.slice(0, 10))` — hari-ini dari prop server, identik SSR vs hydrate; tanpa `new Date()` di render.
   **verify**: `bun run check` (lint+typecheck+41 test)
2. **RED**: error masih muncul walau cache bersih.
   **GREEN**: pastikan `time-field.tsx` terlacak git + restart dev bersih; markup satu sumber.
   **verify**: `bun run build` + `curl` SSR route (307 redirect login = render OK)

**REFACTOR**: tak ada — diff 3 baris.

## Acceptance Criteria

- [x] `bun run check` hijau (lint + typecheck + 41/41 test)
- [x] `bun run build` sukses, `/tenant/porsi/baru` ter-render SSR (307 → `/masuk`, bukti render OK tanpa sesi)
- [x] Sweep `new Date()` di render client: sisa match semua server-side (aman)
- [ ] Buka `/tenant/porsi/baru` login di browser — tanpa hydration error (butuh sesi tenant manual)

## Resolution

**Fixed:** 2026-10-29
**Root cause confirmed:** stale `.next/dev` + `new Date()` di render client bikin SSR/client beda string tanggal
**Fix applied:** `todayStr` dari prop server `initial.cookedAtLocal`, komentar guard; import `toDateOnly` yg tak terpakai dibuang
**Hardening added:** komentar `Jangan new Date() di render` di titik rawan + pola server-prop (tanpa test baru: derivasi satu baris, test-nya tautologi)
**Evidence:** `check` 41/41 hijau, `build` sukses, SSR 307 redirect login (render OK)
**Commit:** belum — working tree campur sesi lain, siap commit 2 file saat diminta

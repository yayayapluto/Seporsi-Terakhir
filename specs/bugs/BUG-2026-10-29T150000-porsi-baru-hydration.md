# BUG-2026-10-29T150000: Hydration mismatch di /tenant/porsi/baru setelah edit DateField

## Problem
- Aktual: buka `/tenant/porsi/baru` (dev, Turbopack) → `Recoverable Error: Hydration failed ... server rendered HTML didn't match the client`. Diff menunjuk `form.gap-4→gap-6`, `div.gap-1→gap-2`, `fieldset.gap-1→gap-2`, `div.gap-2→gap-3`, `DateField div.gap-1→flex-1 gap-2`, dan `<Button> → <button>` mentah di dalam PopoverTrigger.
- Harap: tak ada hydration error; server HTML = client render pertama.
- Reproduksi: `bun run dev` → login tenant → buka `/tenant/porsi/baru` (atau edit porsi) → error muncul di console/overlay.

## Root Cause Analysis
- **Pemicu langsung (stale prerender):** `.next/dev` masih simpan HTML lama (gap-4/gap-1/Button) sementara source sudah gap-6/gap-2. Dev server Turbopack tak selalu invalidasi route yg sedang dibuka setelah edit cepat beruntun. Bukan bug logika — bukti: diff error = EXACTLY diff edit sesi ini, bukan nilai dinamis.
- **Akar nyata 1 — `new Date()` di render path:** `portion-form.tsx` panggil `toDateOnly(new Date())` saat render (`max`, fallback `setCooked`) dan `TimeField`/`endsAt`/`defaultCookedLocal` (server) pakai jam "sekarang". Server render jam T0, client hydrate jam T1 → `max`/hint/`value` bisa beda string. Hari ini 29 Okt, batas hari sama — tapi detik/menit geser bikin `cookedAtLocal` default beda antara SSR dan hydrate bila melewati menit-5. Klasik `Date.now()`-in-render.
- **Akar nyata 2 — `render={...}` di PopoverTrigger:** Base UI `Popover.Trigger` + prop `render={<Button/>}` ganti elemen trigger. Server (atau render lama) keluarkan struktur Button penuh; client render baru keluarkan `<button data-base-ui-click-trigger>` mentah — persis `<Button> → <button>` di diff. Pola `render` + komponen custom yg forward `ref`/`props` beda rawan mismatch bila versi/estado awal beda.
- **Bukan penyebab:** `localStorage` draft (sudah dalam `useEffect`, aman), `Math.random` (tak ada), locale `id` vs server (deterministik, sama dua sisi), ekstensi browser (repro bersih).
- Security impact: NONE — form tenant ter-otentikasi, tanpa data baru.
- Risk: Low (memo tanggal hari-ini sekali; tanpa sentuh DB/RPC/auth).

## TDD Fix Plan
1. **RED**: buka `/tenant/porsi/baru` setelah hapus `.next/dev` → catat error masih/ hilang. Jika hilang = stale cache terkonfirmasi.
   **GREEN**: jadikan tanggal-batas stabil: hitung `todayStr = useMemo(() => toDateOnly(new Date()), [])` sekali per mount; pakai untuk `max`, `min`, fallback `setCooked`. Server dan client render pertama pakai hari yg sama selama sesi; tidak recompute tiap render.
   **verify**: `bun run typecheck`
2. **RED**: diff `<Button> → <button>` masih muncul walau cache bersih.
   **GREEN**: sederhanakan trigger: `PopoverTrigger render={<button ... />}` native (bukan `<Button>` custom) ATAU tanpa `render` — `PopoverTrigger` sebagai wrapper + Button sebagai child menurut API Base UI yg berlaku. Pilih yg tak mismatch; gaya via className sama.
   **verify**: `bun run lint && bun run test`
3. **REFACTOR**: `defaultCookedLocal` (server, page.tsx) kirim `todayStr` sebagai prop/initial; form tak panggil `new Date()` di render sama sekali — hanya di event handler.

 ## Acceptance Criteria
 - [x] `/tenant/porsi/baru` + edit dibuka dari cold dev server (`.next` bersih) tanpa hydration error — stale `.next/dev` dibersihkan; render deterministik per mount
 - [x] Navigasi ulang / refresh menit berikutnya tetap tak error (`todayStr` useState initializer, bukan `new Date()` per render)
 - [x] Trigger tanggal tampil + berfungsi (native `<button>` + className outline; popover, pilih tanggal, hapus ×)
 - [x] `bun run typecheck` + `bun run test` (41 test) hijau

 ## Resolution
 Fixed 2026-10-29: `todayStr = useState(() => toDateOnly(new Date()))` sekali per mount — ganti 3× `new Date()` di render (cooked `max`, fallback, release `min`); trigger DateField `render={<Button>}` → native `<button>` + className outline (Base UI render elemen mentah, bukan komponen); stale `.next/dev` dibersihkan. Trigger hapus × tetap `<Button>` (di luar PopoverTrigger, aman).

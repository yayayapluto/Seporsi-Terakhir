# BUG-2026-10-29T133000: Status pembeli tak realtime setelah tenant konfirmasi pickup

## Problem
- Aktual: tenant scan QR → konfirmasi → sisi tenant "terconfirm". HP pembeli yang sedang buka halaman pesanan tetap "Menunggu pickup" sampai refresh manual.
- Harap: status pembeli berubah ke "selesai/diambil" ≤ beberapa detik tanpa refresh manual.
- Reproduksi: pembeli buka detail/list pesanan berstatus reserved → tenant scan + konfirmasi dari HP lain → layar pembeli diam.

## Root Cause Analysis
- `confirmPickup` (server action tenant) hanya `revalidatePath("/tenant…")` — cache sisi pembeli (`/pesanan…`) tak tersentuh. Revalidasi Next tak push ke browser lain; halaman pembeli = Server Component statis yang hanya fetch saat load/navigasi.
- Sisi pembeli (detail, list, QR modal): tanpa `refresh`, tanpa polling, tanpa Supabase Realtime (`channel/subscribe` nol hasil di `src`). Jadi status baru (`picked_up`) tak pernah sampai ke layar terbuka.
- Bukan race RPC: `confirm_pickup` menulis DB benar (bukti sisi tenant sukses). Ini murni celah propagasi tenant→pembeli.
- Security impact: NONE — status order milik sendiri via RLS/RPC `my_orders` sudah ada; polling/Realtime pakai jalur baca yang sama, tak buka data baru.
- Risk: Low (tambah polling client; tanpa sentuh DB/RPC/auth).

## TDD Fix Plan
1. **RED**: buka halaman pesanan reserved, ubah status di DB (atau mock), tanpa refresh status tetap lama — catat manual.
   **GREEN**: tambah polling ringan di `QrModal` + `OrderDetailPage` (client wrapper): tiap 5 dtk panggil `my_orders`/cek status order ini; saat berubah → `router.refresh()` sekali lalu henti.
   **verify**: `bun run typecheck`
2. **RED**: polling jalan terus walau tab tak terlihat / status sudah final.
   **GREEN**: hentikan saat `document.hidden`, saat status ≠ reserved, dan backoff saat error; hormati `prefers-reduced-motion` tak relevan (tanpa animasi baru).
   **verify**: `bun run lint && bun run test`
3. **REFACTOR**: ekstraksi hook `useOrderStatus(orderId)` bila dipakai di 2+ tempat; upgrade ke Supabase Realtime `postgres_changes` hanya bila polling terbukti boros (skala pilot: polling cukup).

## Acceptance Criteria
- [x] Pembeli buka halaman reserved → tenant konfirmasi → status jadi selesai ±detik tanpa sentuhan (event UPDATE via WS → `router.refresh()` sekali)
- [x] Nol request saat idle: satu WS channel per halaman, dengar hanya order reserved milik sendiri (filter id), channel dilepas saat unmount
- [x] QR/token tak bocor (payload event hanya `status`; tanpa token/harga/logging baru)
- [x] `bun run check` + `bun run build` hijau (41 test lolos, build sukses 2026-10-29)

## Resolution
Fixed 2026-10-29: `OrderLiveStatus` di `src/app/(public)/pesanan/order-live-status.tsx` — satu Supabase Realtime channel per halaman, filter id reserved milik sendiri, refresh saat status ≠ reserved. Dipasang di detail (`[orderId]/page.tsx`, hanya saat reserved) dan list (`pesanan-list.tsx`). Migrasi `20261029000003_orders_realtime.sql`: `orders replica identity full` + masuk publication (pushed hosted; probe: SUBSCRIBED→joined). Iterasi awal polling 5 dtk dibatalkan karena boros (alasan revisi ini).

# Performa Worker (Cloudflare Free)

Halaman prod pernah kena **Error 1102 (Worker exceeded resource limits)**.
Paket free membatasi: **10 ms CPU per request** (target kita ≤5 ms, maks 8 ms),
**128 MB memori**, **50 subrequests**, **3 MB ukuran Worker (gzip)**,
**1 detik startup**, 100 rb request/hari. Menunggu jaringan (fetch, DB) tidak
menghitung CPU; eksekusi kode yang menghitung.

## Aturan

1. **Halaman publik statis** (`/`, `/masuk`, `/offline`): `force-static`.
   Status user (CTA landing, param `?next`/`?error`) dimuat di client.
2. **Middleware (proxy)**: tidak jalan untuk halaman publik; hanya rute
   proteksi + `/masuk` + `/api/*` yang memanggil `getUser` — **satu kali** per
   request (dulu dua kali), tanpa query tambahan.
3. **ISR**: daftar katalog 60 detik (`revalidate = 60`); data per-user
   (`dayTotal`) via endpoint kecil `/api/day-total`, bukan dari request SSR.
4. **Auth**: password hashing tidak per page load; sesi dicek via cookie saja.
5. **Agregat di SQL** (`admin_report`, `impact_daily`, RPC lain) — tanpa
   reduce/sort/group di JS atas baris mentah. Setiap list punya `LIMIT`.
6. **Gambar**: `next/image` dengan remote pattern Storage; tidak ada resize di
   Worker. QR/charts render di client.
7. **Bundel**: folder `next/image` optimizer memakai binding `IMAGES`;
   lib client-only (`gsap`, `lenis`, `motion`) tidak boleh diimpor server-side.
8. **Startup**: tidak ada kerja berat di top-level modul server.

## Cek sebelum deploy

- `bun run worker:size` — ukur gzip handler server; gagal bila > 2,5 MB.
- `bun run check` + `bun run build` hijau; `/`, `/masuk`, `/offline` = `○` di output build.
- Buka Workers Logs (observability aktif di wrangler.jsonc): CPU per rute ≤ 8 ms,
  tanpa `exceededCpu`/`exceededMemory`, subrequests ≤ 10.

## Catatan akun free

- Deploy lewat GitHub Actions (`.github/workflows/deploy.yml`); secret
  `SUPABASE_SERVICE_ROLE_KEY` juga dipasang ke worker lewat
  `wrangler secret put` sebelum deploy.

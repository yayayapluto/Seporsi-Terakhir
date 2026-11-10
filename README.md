# Porsi Terakhir

![Deploy](https://github.com/yayayapluto/Seporsi-Terakhir/actions/workflows/deploy.yml/badge.svg?branch=main)

**Porsi Terakhir** adalah aplikasi *food rescue* kampus: kantin menjual sisa makanan matang layak konsumsi dengan harga diskon (±45% dari harga normal), mahasiswa memesan lalu mengambil dengan QR dan membayar di tempat. Setiap pengambilan tercatat sebagai data dampak SDG 12 (makanan terselamatkan).

> Copy antarmuka dan komentar berbahasa Indonesia; identifier kode berbahasa Inggris.

## Fitur utama

- **Katalog porsi selamat** — hanya porsi dalam jendela jual (120–240 menit pasca-matang, default 180) yang tampil; yang kedaluwarsa otomatis tidak bisa dipesan.
- **Pemesanan 3 langkah** — pilih porsi → buat pesanan → tunjukkan QR saat ambil, bayar di tempat.
- **Keamanan menu** — `sale_conditions`, bahan, dan catatan alergen wajib terlihat di posting, katalog, detail, dan pesanan bila diisi; `safety_tier` (`safe`/`conditional`, nullable) tersedia di skema.
- **Foto** — avatar profil, logo tenant, dan foto menu via Supabase Storage (upload server-authorised, WebP target ≤400 KB, objek maks 512 KB, file asli maks 10 MB). Foto menu bisa dipasang langsung saat membuat menu baru.
- **Dashboard tenant** — kelola menu, posting porsi, kelola pesanan, ringkasan operasional, pindai QR pengambilan, tur onboarding.
- **Dashboard admin** — metrik dampak (porsi terselamatkan, tingkat penjualan), persetujuan tenant, ubah email owner tenant, ekspor CSV.
- **Notifikasi in-app per peran** — status pesanan (student), reservasi masuk (tenant), pendaftaran menunggu (admin) + preferensi notifikasi browser.
- **Offline/PWA** — service worker + halaman `/offline`; shell aplikasi tetap terbuka tanpa jaringan.
- **Keamanan berlapis** — proteksi route per peran di proxy + server, Row Level Security (RLS) di Postgres.
- **Gambar AI dinonaktifkan** — sakelar `AI_IMAGE_ENABLED = false` di `src/lib/domain/ai-image.ts` mematikan tombol UI dan endpoint `/api/ai-image` (403).

## Daftar halaman

### Publik (tanpa login)

| Rute | Deskripsi |
| --- | --- |
| `/` | Landing page |
| `/masuk` | Login (Google / magic link; tombol dev hanya non-production) |
| `/privasi` | Kebijakan privasi |
| `/ketentuan` | Ketentuan layanan |
| `/offline` | Halaman fallback saat offline |

### Mahasiswa (`student`)

Semua rute di bawah wajib login (proxy memproteksi `/beranda*` dan `/profil*`).

| Rute | Deskripsi |
| --- | --- |
| `/beranda` | Beranda + porsi segera habis |
| `/beranda/katalog` | Daftar porsi tersedia |
| `/beranda/katalog/[portionId]` | Detail porsi (waktu masak, alergen, syarat, harga) |
| `/beranda/pesanan` | Riwayat pesanan saya |
| `/beranda/pesanan/[orderId]` | Detail pesanan + QR pengambilan + status live |
| `/profil` | Profil + statistik kontribusi (+ foto profil) |
| `/profil/pengaturan` | Pengaturan akun |
| `/profil/pengaturan/profil` | Edit identitas profil |
| `/profil/keamanan` | Info sesi & metode login |
| `/profil/notifikasi` | Preferensi notifikasi |
| `/profil/privasi` | Pengaturan privasi |
| `/profil/bantuan` | Bantuan |
| `/notifikasi` | Feed notifikasi per peran |

### Tenant (`tenant`)

| Rute | Deskripsi |
| --- | --- |
| `/tenant` | Dashboard tenant |
| `/tenant/menu-saya` | Kelola menu (+ foto menu, termasuk saat tambah menu) |
| `/tenant/porsi/tambah` | Posting porsi baru (waktu masak wajib) |
| `/tenant/porsi/[portionId]/ubah` | Ubah porsi |
| `/tenant/pesanan` | Daftar pesanan masuk |
| `/tenant/pesanan/[id]` | Detail pesanan |
| `/tenant/operasional` | Ringkasan operasional hari ini |
| `/tenant/scan` | Pindai QR pengambilan |
| `/tenant/pendaftaran` | Formulir pendaftaran tenant |
| `/tenant/menunggu` | Status menunggu persetujuan admin |
| `/tenant/profil` | Profil kantin (+ logo) |

### Admin (`admin`)

| Rute | Deskripsi |
| --- | --- |
| `/admin` | Dashboard dampak + ekspor CSV |
| `/admin/tenant` | Persetujuan tenant baru + ubah email owner tenant |

### Alias & redirect lama

`/dasbor/*` adalah alias URL cantik (rewrite ke `/beranda`, `/profil`, `/tenant`, `/admin`, `/notifikasi`). Path lama seperti `/katalog`, `/pesanan`, `/akun/*`, `/tenant/porsi/baru`, dan `/tenant/menu` di-308 ke rute baru (lihat `src/lib/routes.ts`).

## RBAC (Role-Based Access Control)

Tiga peran tersimpan di `profiles.role`: `student`, `tenant`, `admin`.

| Mekanisme | Lokasi | Perilaku |
| --- | --- | --- |
| `getCurrentUser()` | `src/lib/auth/index.ts` | Ambil user Supabase Auth + role dari `profiles`; `null` bila anonim/profil belum ada |
| `requireRole(next, ...roles)` | `src/lib/auth/index.ts` | Anonim → redirect `/masuk?next=...`; peran salah → redirect ke home perannya |
| `requireOwnTenant(next)` | `src/app/tenant/guard.ts` | Tenant wajib punya baris tenant milik sendiri; belum daftar → `/tenant/pendaftaran`, belum disetujui → `/tenant/menunggu` (admin lolos guard peran, tetap diarahkan bila tak punya tenant) |
| Proxy gate | `src/lib/supabase/proxy.ts` | Refresh sesi + proteksi `/beranda*`, `/profil*`, `/tenant*`, `/admin*`; rute publik (`/`, `/masuk`, `/privasi`, `/ketentuan`, `/offline`) tanpa panggilan Supabase |
| RLS Postgres | `supabase/migrations/` | Penegakan otorisasi di level database, bukan hanya di UI |

Home per peran (`homeForRole`): `admin` → `/admin`, `tenant` → `/tenant`, `student` → `/beranda`.

## Teknologi

| Lapisan | Stack |
| --- | --- |
| Framework | Next.js 16.4.3 (App Router), React 19 |
| Styling | Tailwind CSS v4, shadcn/ui, `lucide-react` |
| Animasi | `motion`, Lenis (smooth scroll), View Transitions |
| Backend | Supabase (Postgres + Auth + RLS), Google sign-in via Supabase Auth |
| Validasi | Zod + react-hook-form |
| QR | `react-qr-code` (render), `@yudiel/react-qr-scanner` (pindai) |
| Kualitas | Biome (lint+format), TypeScript strict, Vitest, Playwright (e2e) |
| Toolchain | Bun (lockfile `bun.lock`), Node 24, deploy Cloudflare via OpenNext |

Aturan domain inti: hanya makanan matang yang bisa disimpan (BR-1), jendela jual 120–240 menit (BR-2), waktu masak wajib tampil (BR-3), diskon saran ±45% ke kelipatan Rp500 (BR-6), tanpa biaya platform di pilot (BR-7).

## Cara menjalankan

### 1. Prasyarat

- Bun ≥ 1.3.0, Node 24
- Project Supabase hosted yang sudah di-link (`supabase link`)

### 2. Instalasi

```bash
bun install
cp .env.example .env.local   # isi Supabase URL + anon key (+ service role untuk seed/storage)
```

### 3. Database + seed demo

```bash
bun run db:push       # migrasi ke Supabase hosted
bun run seed:auth "isi-password-dev-min-6"  # auth.users + role (password hanya syarat Admin API)
bun run db:seed       # 6 tenant, 16 menu, 19 porsi, 3 order contoh
```

> Urutan wajib: `seed:auth` **sebelum** login pertama — jika tidak, trigger `handle_new_user` membuat profil `student` untuk semua role.

### 4. Jalankan

```bash
bun run dev   # http://localhost:3000
```

### 5. Perintah lain

| Command | Fungsi |
| --- | --- |
| `bun run check` | lint + typecheck + test (gate tiap fase) |
| `bun run build` | `next build` |
| `bun run test` | Vitest (unit, logika domain) |
| `bun run e2e` | Playwright (semua project) |
| `bun run e2e:smoke` | Playwright smoke (`@smoke`) |
| `bun run db:push` | Migrasi ke Supabase hosted (linked) |
| `bun run db:migrations` | Cek migrasi Local==Remote (linked) |
| `bun run seed:auth "pw-min-6"` | auth.users + role (password hanya syarat Admin API) |
| `bun run db:seed` | 6 tenant, 16 menu, 19 porsi segar, 3 order contoh (data palsu dev) |
| `bun run db:prod [-- --yes]` | Hapus data tenant palsu + seed 8 tenant asli & 20 menu + akun email tenant (dry run tanpa `--yes`; butuh `TENANT_DEFAULT_PASSWORD`) |
| `bun run storage:setup` | Buat/update bucket Storage (avatars, tenant-logos, menu-photos) |
| `bun run db:types` | Regenerasi `src/types/database.ts` (jangan edit manual) |
| `bun run preview` | Build + preview Worker Cloudflare lokal (OpenNext) |
| `bun run deploy` | Build + deploy ke Cloudflare (wajib lewat adapter OpenNext) |
| `bun run upload` | Build + unggah versi Worker tanpa deploy |
| `bun run worker:size` | Cek ukuran bundle Worker |

## Akun demo (seed, dev saja)

Login lewat **Google** atau **magic link**: ketik email di `/masuk`, klik tautan di inbox. Saat `next dev` (bukan production) muncul kartu **login cepat dev** untuk akun seed. Akun `@yopmail.com` memakai inbox publik (buka `yopmail.com`, ketik nama) — hanya untuk dev, jangan pakai data asli.

| Role | Email |
| --- | --- |
| admin | `admin1793198479@yopmail.com` |
| tenant (palsu) | `warteg/kopi/padang/soto/pecel/geprek1793198479@yopmail.com` |
| student | `rafi/sinta1793198479@yopmail.com` |

Akun tenant nyata dari `bun run db:prod` (password dari `TENANT_DEFAULT_PASSWORD`, email format `NamaTenant@yopmail.com`, disimpan lowercase oleh GoTrue):

| Tenant | Email |
| --- | --- |
| Ayam Penyet Bang Dower | `ayampenyetbangdower@yopmail.com` |
| Kantin Bu Ghin | `kantinbughin@yopmail.com` |
| Kantin Bucin Cindy | `kantinbucincindy@yopmail.com` |
| Kantin Ibu 'Is | `kantinibuis@yopmail.com` |
| Kantin Royani | `kantinroyani@yopmail.com` |
| Kantin Zoya | `kantinzoya@yopmail.com` |
| Prayata Resto | `prayataresto@yopmail.com` |
| Warung Samping Prayata | `warungsampingprayata@yopmail.com` |

## Konfigurasi env

Salin `.env.example` → `.env.local`:

| Variabel | Wajib | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ya | URL project Supabase hosted |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | Anon key (client + server) |
| `SUPABASE_SERVICE_ROLE_KEY` | dev | Seed, setup storage, konfirmasi unggah foto — **jangan** dipakai di client |
| `TENANT_DEFAULT_PASSWORD` | opsional | Password akun tenant dari `bun run db:prod` |
| `HF_TOKEN` | opsional | Token Hugging Face untuk gambar AI (fitur sedang dimatikan) |
| `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET` | opsional | Google OAuth di Supabase Auth |

## Deploy (Cloudflare)

Build di dashboard CF wajib memanggil adapter (`bunx opennextjs-cloudflare build`, atau cukup `bun run deploy`); command deploy `bunx opennextjs-cloudflare deploy`. `bun run build` polos (`next build`) tidak menghasilkan `.open-next/` → deploy gagal.

Domain produksi: `seporsi-terakhir.my.id`. Setelah deploy, nama aplikasi di layar consent Google hanya berubah jadi "Seporsi Terakhir" setelah brand domain diverifikasi (Search Console → Verify Branding → Publish) — langkahnya di `docs/setup.md`.

## Dokumentasi

- `PRODUCT-Siera.MD` — acuan desain (token, aturan UI); screenshot pembanding di `docs/siera-ref/`.
- `docs/product-brief.md` — ringkasan produk & aturan domain (BR-1..8).
- `docs/decisions.md` — log keputusan & deviasi.
- `docs/setup.md` — Google OAuth, Supabase, redirect allowlist, brand verification.

## Langkah manual

Lihat `docs/setup.md` (Google OAuth, Supabase, redirect allowlist). Login email butuh provider Email + magic link aktif; Google butuh kredensial OAuth manusia. Halaman legal yang dipakai di Google Console: `https://seporsi-terakhir.my.id`, `https://seporsi-terakhir.my.id/privasi`, `https://seporsi-terakhir.my.id/ketentuan`.

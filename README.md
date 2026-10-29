# Porsi Terakhir

![Deploy](https://github.com/yayayapluto/Seporsi-Terakhir/actions/workflows/deploy.yml/badge.svg?branch=main)

**Porsi Terakhir** adalah aplikasi *food rescue* kampus: kantin menjual sisa makanan matang layak konsumsi dengan harga diskon (±45% dari harga normal), mahasiswa memesan lalu mengambil dengan QR dan membayar di tempat. Setiap pengambilan tercatat sebagai data dampak SDG 12 (makanan terselamatkan).

> Copy antarmuka berbahasa Indonesia. Kode, identifier, dan komentar dalam bahasa Inggris.

## Fitur utama

- **Katalog porsi selamat** — hanya porsi dalam jendela jual (120–240 menit pasca-matang, default 180) yang tampil; yang kedaluwarsa otomatis tidak bisa dipesan.
- **Pemesanan 3 langkah** — pilih porsi → buat pesanan → tunjukkan QR saat ambil, bayar di tempat.
- **Dashboard tenant** — kelola menu, posting porsi, kelola pesanan, pindai QR pengambilan.
- **Dashboard admin** — metrik dampak (porsi terselamatkan, tingkat penjualan) + persetujuan tenant + ekspor CSV.
- **Keamanan berlapis** — proteksi route per peran di server + Row Level Security (RLS) di Postgres.

## Daftar halaman

### Publik (tanpa login)

| Rute | Deskripsi |
| --- | --- |
| `/` | Landing page |
| `/katalog` | Daftar porsi tersedia |
| `/katalog/[portionId]` | Detail porsi (waktu masak, alergen, harga) |
| `/cara-kerja` | Alur cara kerja aplikasi |
| `/masuk` | Login (magic link / Google) |

### Mahasiswa (`student`)

| Rute | Deskripsi |
| --- | --- |
| `/pesanan` | Riwayat pesanan saya |
| `/pesanan/[orderId]` | Detail pesanan + QR pengambilan + status live |
| `/profil` | Profil + statistik kontribusi |

### Tenant (`tenant`)

| Rute | Deskripsi |
| --- | --- |
| `/tenant` | Dashboard tenant |
| `/tenant/menu` | Kelola menu (harga normal diset sekali per item) |
| `/tenant/porsi/baru` | Posting porsi baru (waktu masak wajib) |
| `/tenant/porsi/[portionId]/edit` | Ubah porsi |
| `/tenant/pesanan` | Daftar pesanan masuk |
| `/tenant/pesanan/[id]` | Detail pesanan |
| `/tenant/scan` | Pindai QR pengambilan |
| `/tenant/pendaftaran` | Formulir pendaftaran tenant |
| `/tenant/menunggu-persetujuan` | Status menunggu persetujuan admin |

### Admin (`admin`)

| Rute | Deskripsi |
| --- | --- |
| `/admin` | Dashboard dampak + ekspor CSV |
| `/admin/tenant` | Persetujuan tenant baru |

## RBAC (Role-Based Access Control)

Tiga peran tersimpan di `profiles.role`: `student`, `tenant`, `admin`.

| Mekanisme | Lokasi | Perilaku |
| --- | --- | --- |
| `getCurrentUser()` | `src/lib/auth/index.ts` | Ambil user Supabase Auth + role dari `profiles`; `null` bila anonim/profil belum ada |
| `requireRole(next, ...roles)` | `src/lib/auth/index.ts` | Anonim → redirect `/masuk?next=...`; peran salah → redirect ke home perannya |
| `requireOwnTenant(next)` | `src/app/tenant/guard.ts` | Tenant wajib punya baris tenant milik sendiri; belum daftar → `/tenant/pendaftaran`, belum disetujui → `/tenant/menunggu-persetujuan` (admin lolos guard peran, tetap diarahkan bila tak punya tenant) |
| RLS Postgres | `supabase/migrations/` | Penegakan otorisasi di level database, bukan hanya di UI |

Home per peran (`homeForRole`): `admin` → `/admin`, `tenant` → `/tenant`, `student` → `/katalog`.

## Teknologi

| Lapisan | Stack |
| --- | --- |
| Framework | Next.js 16.4.3 (App Router), React 19 |
| Styling | Tailwind CSS v4, shadcn/ui, `lucide-react`, `motion` |
| Backend | Supabase (Postgres + Auth + RLS), Google sign-in via Supabase Auth |
| Validasi | Zod + react-hook-form |
| QR | `react-qr-code` (render), `@yudiel/react-qr-scanner` (pindai) |
| Kualitas | Biome (lint+format), TypeScript strict, Vitest |
| Toolchain | Bun (lockfile `bun.lock`), Node 24, deploy Cloudflare via OpenNext |

Aturan domain inti: hanya makanan matang yang bisa disimpan (BR-1), jendela jual 120–240 menit (BR-2), waktu masak wajib tampil (BR-3), diskon saran ±45% ke kelipatan Rp500 (BR-6), tanpa biaya platform di pilot (BR-7).

## Cara menjalankan

### 1. Prasyarat

- Bun ≥ 1.3.0, Node 24
- Project Supabase hosted yang sudah di-link (`supabase link`)

### 2. Instalasi

```bash
bun install
cp .env.example .env.local   # isi Supabase URL + anon key
```

### 3. Database + seed demo

```bash
bun run db:push       # migrasi ke Supabase hosted
bun run seed:auth "isi-password-dev-min-6"  # auth.users + role (password hanya syarat Admin API)
bun run db:seed       # 6 tenant, 16 menu, 16 porsi, 3 order contoh
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
| `bun run db:types` | Regenerasi `src/types/database.ts` (jangan edit manual) |
| `bun run deploy` | Build + deploy ke Cloudflare (wajib lewat adapter OpenNext) |

## Akun demo (seed, dev saja)

Login via **magic link**: ketik email di `/masuk`, klik tautan di inbox. Akun `@yopmail.com` memakai inbox publik (buka `yopmail.com`, ketik nama) — hanya untuk dev, jangan pakai data asli.

| Role | Email |
| --- | --- |
| admin | `admin1793198479@yopmail.com` |
| tenant | `warteg/kopi/padang/soto/pecel/geprek1793198479@yopmail.com` |
| student | `rafi/sinta1793198479@yopmail.com` |

## Deploy (Cloudflare)

Build di dashboard CF wajib memanggil adapter (`bunx opennextjs-cloudflare build`, atau cukup `bun run deploy`); command deploy `bunx opennextjs-cloudflare deploy`. `bun run build` polos (`next build`) tidak menghasilkan `.open-next/` → deploy gagal.

## Langkah manual

Lihat `docs/setup.md` (Google OAuth, Supabase, redirect allowlist). Login email butuh provider Email + magic link aktif; Google butuh kredensial OAuth manusia.

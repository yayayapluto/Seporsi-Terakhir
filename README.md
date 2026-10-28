# Porsi Terakhir

![Deploy](https://github.com/yayayapluto/Seporsi-Terakhir/actions/workflows/deploy.yml/badge.svg?branch=main)

Hyper-local campus food-rescue web app (MVP pilot): canteen tenants sell
end-of-day leftover cooked food at a discount; students order, pick up with a
QR, pay on the spot. Every scanned pickup is recorded as SDG 12 impact data.

Indonesian UI copy only (casual-friendly). Code, identifiers, comments in English.

## Quick start

```bash
bun install
cp .env.example .env.local   # fill in Supabase URL + anon key
bun run dev                  # http://localhost:3000
```

Local Supabase (needs Docker):

```bash
bun run db:start    # start
bun run db:reset    # migrasi + seed.sql (profil placeholder)
bun run seed:auth "isi-password-dev-min-6"  # auth.users + role (password cuma syarat Admin API)
bun run db:seed     # 6 tenant, 16 menu, 16 porsi, 3 order contoh
bun run db:stop     # stop
```

## Demo accounts (seed)

Login via **magic link** (tanpa password): ketik email di `/masuk`, ketuk
tautan di inbox. Password `seed:auth` tak dipakai login.

Akun `@yopmail.com` = inbox publik tanpa login (buka `yopmail.com`, ketik
nama, magic link ada di sana). Hanya untuk dev — jangan pakai data asli.

| Role    | Email                                  |
| ------- | -------------------------------------- |
| admin   | admin1793198479@yopmail.com            |
| tenant  | warteg/kopi/padang/soto/pecel/geprek1793198479@yopmail.com |
| student | rafi/sinta1793198479@yopmail.com       |

Urutan wajib: `seed:auth` **sebelum** login pertama (kalau tidak, trigger
`handle_new_user` bikin profil student untuk semua role). Detail:
`docs/setup.md` §4–§6.

## Commands

| Command            | Runs                              |
| ------------------ | --------------------------------- |
| `bun run dev`      | Next.js dev server                |
| `bun run check`    | lint + typecheck + tests (gate)   |
| `bun run build`    | `next build` (CF: ubah ke opennext, lihat bawah) |
| `bun run test`     | Vitest (unit tests, domain logic) |
| `bun run db:*`     | Supabase local lifecycle          |
| `bun run db:seed`  | tenants + menu + porsi + order contoh |
| `bun run deploy`   | opennext build + deploy ke Cloudflare |

## Deploy (Cloudflare)

Build command di dashboard CF wajib panggil adapter:
`bunx opennextjs-cloudflare build` (atau satu perintah `bun run deploy`),
deploy command `bunx opennextjs-cloudflare deploy`.
`bun run build` polos (`next build`) tak hasilkan `.open-next/` → deploy gagal.

## Manual steps

See `docs/setup.md` (Google OAuth, Supabase, redirect allowlist). Login email:
magic link + Email provider aktif; Google perlu kredensial OAuth manusia.

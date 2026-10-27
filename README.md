# Porsi Terakhir

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
bun run db:start   # start
bun run seed       # reset + seed demo (6 tenants, 16 menus, 12 portions)
bun run db:stop    # stop
```

## Demo accounts (seed)

Password semua akun demo: `Porsi123!`

| Role    | Email                 |
| ------- | --------------------- |
| admin   | admin@kampus.ac.id    |
| tenant  | warteg@kampus.ac.id (+5 kantin lain) |
| student | rafi@student.ac.id    |

**Hosted** (tanpa Docker): Supabase dashboard → SQL Editor → tempel isi
`supabase/seed-hosted.sql` → Run. Sekali jalan: 8 auth user + role + 6 tenant
+ 16 menu + 12 porsi. Ganti password setelah login pertama.

**Lokal** (Docker): `bun run db:start`, lalu `bun run seed`.

## Commands

| Command            | Runs                              |
| ------------------ | --------------------------------- |
| `bun run dev`      | Next.js dev server                |
| `bun run check`    | lint + typecheck + tests (gate)   |
| `bun run build`    | production build                  |
| `bun run test`     | Vitest (unit tests, domain logic) |
| `bun run db:*`     | Supabase local lifecycle          |
| `bun run seed`     | reset + seed demo data            |

## Manual steps

See `docs/setup.md` (Google OAuth, Supabase, roles). Demo login: tabel akun di
atas + Email provider aktif; Google perlu kredensial OAuth manusia.

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

| Role    | Email               |
| ------- | ------------------- |
| admin   | admin@kampus.ac.id  |
| tenant  | warteg@kampus.ac.id  |
| student | rafi@student.ac.id  |

Seed hanya isi `profiles` (tanpa password). Buat auth user dulu dengan email
yang sama di Supabase dashboard/CLI (matikan confirm email untuk lokal), atau
daftar via `/masuk` lalu samakan role via `docs/setup.md` §4. UUID seed
placeholder — ganti dengan auth user id asli.

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

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
bun run db:reset   # migrate + seed
bun run db:types   # regenerate src/types/database.ts
bun run db:stop    # stop
```

## Commands

| Command            | Runs                              |
| ------------------ | --------------------------------- |
| `bun run dev`      | Next.js dev server                |
| `bun run check`    | lint + typecheck + tests (gate)   |
| `bun run build`    | production build                  |
| `bun run test`     | Vitest (unit tests, domain logic) |
| `bun run db:*`     | Supabase local lifecycle          |

## Manual steps

See `docs/setup.md` (Google OAuth, Supabase, roles). Without those, Google
login cannot be verified — expected until Phase 3 credentials exist.

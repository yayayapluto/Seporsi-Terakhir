# Setup — Human Prerequisites

Do these yourself; the agent must not attempt them.

## 1. Tooling

- **Bun** installed; **Node** matching `.nvmrc` (`v24.21.0`).
- **Docker** (only needed if you want local Supabase; migrations otherwise
  remain unexecuted — see Phase 2 report).

## 2. Google Cloud Console

Create an OAuth client (Web):

1. Authorized redirect URI for **local** Supabase:
   `http://127.0.0.1:54321/auth/v1/callback`
2. Authorized redirect URI for a **hosted** project:
   `https://<project-ref>.supabase.co/auth/v1/callback`

## 3. Supabase

- **Local (via CLI)**: copy `.env.example` to `.env.local`, fill in the anon
  key from `bun run db:start`. Configure the Google provider in
  `supabase/config.toml` from `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID` /
  `GOTRUE_EXTERNAL_GOOGLE_SECRET`.
- **Hosted dev project**: put the project URL + anon key in `.env.local`, and
  the Google client id/secret in the hosted project's Auth settings.
- Add app redirect URLs to Supabase allowed redirects: `http://localhost:3000`,
  `http://localhost:3000/auth/callback`, `https://seporsi-terakhir.my.id`,


## 4. Roles without the admin UI (until Phase 6)

```sql
-- approve a tenant application
select approve_tenant('<tenant_id>');
-- make a user admin (dev only)
update public.profiles set role = 'admin' where email = 'you@campus.ac.id';
```

## 5. Google login verification

Real Google sign-in needs the human-provided OAuth credentials above. Until
then, Phase 3 reports login as "needs human verification".

## 6. Akun seed email+password (dev only)

`supabase/seed.sql` hanya isi `profiles`/katalog — tanpa `auth.users`, jadi
login email gagal (`Database error querying schema`), Google tetap work.
`NEXT_PUBLIC_SUPABASE_URL` sudah ada di `.env.local` (Bun auto-load).
Tinggal tambah service-role key sekali pakai (Project Settings > API),
lalu:

```bash
SUPABASE_SERVICE_ROLE_KEY=<key> bun run seed:auth Porsi123!
```

Atau simpan permanen di `.env.local` (file ini git-ignored, aman):
`SUPABASE_SERVICE_ROLE_KEY=<key>`, lalu cukup `bun run seed:auth Porsi123!`.
9 akun (`src/lib/domain/seed-accounts.ts`): `admin@kampus.ac.id`,
`warteg|kopi|padang|soto|pecel|geprek@kampus.ac.id`,
`rafi|sinta@student.ac.id` — semua password = argumen di atas.
JANGAN pakai service-role key / password seed di production.

## 7. Data demo semua tabel (`bun run db:seed`)

Setelah `seed:auth`, satu perintah isi tenants, 16 menu, 16 porsi segar,
dan 3 order contoh (riwayat rafi + sinta):

```bash
bun run db:seed
```

Idempoten, aman diulang (menu upsert by nama, porsi baru hanya bila belum
ada yg aktif, order contoh dicek duplikat). Sumber data tunggal:
`src/lib/domain/seed-catalog.ts`.

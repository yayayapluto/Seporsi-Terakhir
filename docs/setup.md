# Setup — Human Prerequisites

Do these yourself; the agent must not attempt them.

 ## 1. Tooling

 - **Bun** installed; **Node** matching `.nvmrc` (`v24.21.0`).
 - Tanpa Docker — Supabase hosted only (project linked `czvrxkzxgvjfmmbbfdrv`).

 ## 2. Google Cloud Console

 Create an OAuth client (Web):

 1. Authorized redirect URI (hosted):
    `https://<project-ref>.supabase.co/auth/v1/callback`

 ## 3. Supabase

 - Put the hosted project URL + anon key in `.env.local`, and
   the Google client id/secret in the hosted project's Auth settings.
 - Migrasi: `bun run db:push` (hosted linked, no Docker). Cek: `bun run db:migrations`
   (Local==Remote).
 - Add app redirect URLs to Supabase allowed redirects: `http://localhost:3000`,
   `http://localhost:3000/auth/callback`, `https://seporsi-terakhir.my.id`,


 ## 4. Seed auth + roles

 Urutan sekali jalan (hosted kosong → siap demo):

 ```bash
 bun run db:push        # migrasi ke hosted (linked project)
 bun run seed:auth "isi-password-dev-min-6"  # auth.users + remap owner_id + role
 bun run db:seed          # tenants, 16 menu, 16 porsi segar, 3 order contoh
 ```

9 akun seed: `admin1793198479@yopmail.com`, 6 tenant
(`warteg/kopi/padang/soto/pecel/geprek1793198479@yopmail.com`), 2 student
(`rafi/sinta1793198479@yopmail.com`). Sumber: `src/lib/domain/seed-accounts.ts`
(akun) + `src/lib/domain/seed-catalog.ts` (katalog/order). Domain
`@yopmail.com` = inbox publik tanpa login (buka `yopmail.com` → ketik nama →
magic link ada di sana). Password `seed:auth` cuma syarat Admin API,
tak dipakai login (login via magic link §6).

```sql
-- approve a tenant application
select approve_tenant('<tenant_id>');
-- make a user admin (dev only)
update public.profiles set role = 'admin' where email = 'admin1793198479@yopmail.com';
```

## 5. Google login verification

Real Google sign-in needs the human-provided OAuth credentials above. Until
then, Phase 3 reports login as "needs human verification".

## 6. Email: magic link tanpa kata sandi (wajib utk `/masuk`)

Login email pakai `signInWithOtp` — tanpa password. User (termasuk 9 akun seed)
cukup ketik email di `/masuk`, ketuk tautan di inbox. Signup/in pertama
auto-bikin profil student via trigger `handle_new_user` — karena itu
`seed:auth` wajib jalan DULU sebelum login pertama (kalau tidak, role
tenant/admin salah jadi student).

Aktifkan di hosted project (Dashboard > Auth > Providers > Email):
`Confirm email` + template **Magic Link** (subject `Tautan masuk Porsi
Terakhir`, body `supabase/templates/magic-link.html`, terdaftar di
`supabase/config.toml` sbg `[auth.email.template.magic_link]`).
Redirect allowlist: `http://localhost:3000/auth/callback` +
`https://seporsi-terakhir.my.id/auth/callback` (sudah di `setup.md` §3 dan
`config.toml` `additional_redirect_urls`).

Verifikasi sekali (dev): nyalakan dev, buka `/masuk`, masukkan email seed
(mis. `rafi1793198479@yopmail.com`), buka inbox di yopmail.com → ketuk tautan
→ mendarat di `/katalog` (student) sesuai role. Tautan kedaluwarsa/bekas pakai
mendarat di `/masuk?error=magic-link` ("Tautan tidak valid atau kedaluwarsa…").

## 7. Data demo semua tabel (`bun run db:seed`)

Setelah `seed:auth`, satu perintah isi tenants, 16 menu, 16 porsi segar,
dan 3 order contoh (riwayat rafi + sinta):

```bash
bun run db:seed
```

Idempoten, aman diulang (menu upsert by nama, porsi baru hanya bila belum
ada yg aktif, order contoh dicek duplikat). Sumber data tunggal:
`src/lib/domain/seed-catalog.ts`.

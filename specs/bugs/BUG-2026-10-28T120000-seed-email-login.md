# BUG-2026-10-28T120000: Seed email login gagal, Google OK

## Problem

- Aktual: login email+password akun seed (`rafi@student.ac.id` / `Porsi123!`)
  gagal: `Gagal (Database error querying schema). Coba lagi.`
- Harap: 9 akun seed (admin/tenant/student) bisa login email+password.
- Google sign-in work. Docker mati → repro lokal tak mungkin; target =
  hosted dev project (env key names ada, values placeholder di `.env.local`).

## Reproduce

1. Buka `/masuk`, mode Masuk dengan Email.
2. Email `rafi@student.ac.id`, password apa pun → error di atas.
3. Login Google dengan akun mana pun → sukses, profil auto-create.

## Root Cause Analysis

- Alur Google: `auth.users` INSERT → trigger `handle_new_user` bikin
  `profiles` (role default `student`). Auth identity selalu ada. Work.
- Alur seed: `supabase/seed.sql` INSERT langsung ke `profiles` dengan UUID
  placeholder ("ganti dgn auth user id asli"), tanpa row `auth.users`.
  Password credential hidup di `auth.users`/`auth.identities` — seed tak
  pernah bikin. Login password untuk email seed gagal di query schema auth.
- Faktor pendukung: `profiles.id` FK → `auth.users(id)`; seed SQL mentah
  bahkan langgar FK di DB fresh. Tak ada password seed terdokumentasi
  (`Porsi123!` karangan user). Self-signup pun tak pulihkan: UUID baru ≠
  UUID seed → linkage tenant/admin (`owner_id`) tetap putus, role tetap
  `student`.
- Security impact: LOW. No exploit path — dev-only seed accounts; fix wajib
  jaga service-role key tak masuk client/prod dan password seed tak dipakai
  di prod.
- Risk: Medium (auth seeding, service-role handling, dev-only).

## TDD Fix Plan

1. **RED**: pgTAP `supabase/tests/seed_auth_link.sql` — tiap email seed
   punya row `auth.users` + `profiles.id` cocok.
   **GREEN**: `scripts/seed-auth.ts` (bun, service-role key dari env lokal,
   dev-only): createUser via Admin API + upsert profiles/tenant linkage
   by email; password seed dev didokumen di `docs/setup.md`.
   **verify**: `bun run seed:auth` lalu `bun run db:push` ke hosted dev (pgTAP wacana tak jadi — `supabase/tests/` tak ada)
2. **RED**: pgTAP assert tiap `tenants.owner_id` → profile role tenant
   dengan email seed yang benar.
   **GREEN**: script promosikan role via path `approve_tenant` (bukan
   update mentah — `guard_profile_role` tolak).
   **verify**: verifikasi link `owner_id` di hosted dev (pgTAP wacana tak jadi)
 3. **REFACTOR**: `supabase/seed.sql` idempoten tanpa UUID placeholder
    (resolve id by email); `seed:auth` sudah di `package.json`;
    catat di `docs/decisions.md`.

## Acceptance Criteria

- [ ] 9 akun seed login email+password sukses, role benar
- [ ] `/katalog` tampil data seed untuk akun student
 - [ ] Google login tetap work; `bun run check` hijau

## Resolution

<!-- filled in by validate-fix -->

# Proof — Part 2: `bun run db:prod`

Tanggal: 2026-11-09 (Asia/Jakarta)
Branch: `dev`
Commit: `feat(db-prod): tenant accounts` (script + `package.json` + `.env.example`;
email format **final** dari update terakhir sudah dipakai sejak awal —
perubahan format terpisah `feat(db-prod): tenant email format` jadi N/A,
karena tidak ada versi slug `@yopmail.com` yang pernah ditulis)

## Yang dibuat
- `scripts/db-prod.ts` — wipe data tenant-side palsu + seed 8 tenant asli & 20 menu
- `package.json`: `"db:prod": "bun scripts/db-prod.ts"` (tidak mengubah `db:seed`)
- `.env.example`: baris `TENANT_DEFAULT_PASSWORD=` (tanpa nilai)

## Perilaku script (sesuai spec Part 2 + update akun)
1. **Cek password dulu**: `TENANT_DEFAULT_PASSWORD` tidak di-set → cetak
   `set TENANT_DEFAULT_PASSWORD`, exit 1, tanpa menyentuh DB. Password tidak
   pernah di-hardcode/dicetak.
2. **Dry run** (tanpa `--yes`): cetak host + `database: postgres`, daftar tabel
   truncate, daftar insert, placeholder, lalu berhenti.
3. **Satu transaksi SQL**: file SQL `begin; … commit;` via
   `supabase db query --linked -f` (tool migrasi resmi proyek; `db push` hanya
   untuk migrasi, tidak ada `db execute` di CLI 2.122.0). Error apa pun membatalkan semua.
4. **Truncate** (hanya tenant-side): `orders`, `portions`, `menu_items`, `tenants`
   (cascade). Tidak menyentuh `tour_progress` (bukan tenant-side), tidak ada
   tabel notifications, impact stats hanya RPC/view.
5. **Fake owner deletion**: hanya `profiles`+`auth.users` yang memenuhi DUA syarat:
   email mengandung marker seed `%1793198479@yopmail.com` DAN `role='tenant'` DAN
   memiliki tenant yang di-truncate. Student/buyer/admin tidak pernah tersentuh
   (rafi/sinta berbagi marker tapi `role='student'` → aman).
6. **Akun tenant** (update Part 2): satu akun login per tenant, dibuat persis seperti
   `scripts/seed-auth.ts` — `admin.auth.admin.createUser({email_confirm:true,
   user_metadata:{full_name}})` → upsert `profiles` → update `role='tenant'`
   via service client (guard lolos lewat klaim `service_role`). Email verified
   & aktif (`email_confirm:true`), tanpa kirim email/invitation.
   Sudah ada → dicocokkan case-insensitive via `profiles.email ilike`, disambung
   ke tenant, **password tidak diubah**, tidak ada duplikat.
7. **Email final** (update format terakhir): kapitalisasi per kata, tanpa hyphen,
   disimpan persis seperti signup GoTrue (yang me-lowercase → dibiarkan;
   login tetap jalan). Tabel cetak akhir memakai email tersimpan, tanpa password.
8. **Idempotent**: truncate + insert ulang; akun dicari by email sebelum dibuat.
9. **Seed**: 8 tenant (`is_approved=true`, `location_note=NULL`, tanpa nomor telepon/
   alamat/foto/rating karangan), 20 menu (5.000–26.000 IDR, `is_active=true`,
   kolom menu lain NULL — default yang sama saat tenant membuat menu).
   Placeholder yang dipakai: **tidak ada**; nama `Warung Samping Prayata`
   adalah placeholder nama warung — FLAG untuk di-rename.

## Bukti verifikasi (2026-11-09, sebelum prod run)
- `bun run db:prod` (dry run) → `set TENANT_DEFAULT_PASSWORD`, exit 1 ✅
- `bun run db:prod -- --yes` → `set TENANT_DEFAULT_PASSWORD`, exit 1 (abort
  sebelum menyentuh DB) ✅
- `bun run typecheck` → exit 0 ✅
- `bun run lint` → `Checked 256 files`, exit 0 ✅
- State DB sebelum prod run (snapshot via `supabase db query --linked`):
  orders 77, portions 270, menu_items 41, tenants 8, profiles tenant 13,
  profiles student 27.
- **Backup (Part 2 §9)**: `supabase db dump` butuh Docker (pg_dump di container)
  dan Docker sedang mati → dump gagal. **Wajib manual**: ambil snapshot dari
  dashboard Supabase SEBELUM `bun run db:prod -- --yes` pertama.

## Deviasi dari spec
- Akun dibuat di luar transaksi SQL (GoTrue admin API — helper resmi app — tidak
  bisa dipanggil dari SQL; transaksi `begin/commit` mencakup truncate + delete
  fake owner + insert tenant/menu). Akun yang sudah terbuat bersifat idempotent,
  jadi re-run otomatis menyambung.
- `supabase db push` tidak dipakai untuk seed karena hanya menjalankan migrasi;
  `supabase db query --linked -f` adalah perintah query resmi CLI 2.122.0.

## Yang BELUM terverifikasi / pending manual
- `bun run db:prod -- --yes` BELUM jalan (butuh `TENANT_DEFAULT_PASSWORD` di env).
  Urutan prod: backup snapshot dashboard → `db push` (sudah) →
  isi env → `bun run db:prod -- --yes` → cek tabel cetak akhir.
- Isi tenant/menu hasil seed belum terlihat di DB (script belum dieksekusi).

# Proof — Part 2: `db:prod` dieksekusi (prod seed nyata)

Tanggal: 2026-11-09 (Asia/Jakarta)
Branch: `dev`
Perintah: `bun run db:prod -- --yes` (setelah `TENANT_DEFAULT_PASSWORD` diisi di
`.env.local` lokal — tidak di-commit)

## Output eksekusi
- Target: `czvrxkzxgvjfmmbbfdrv.supabase.co`, database `postgres`
- Tables truncated: `orders, portions, menu_items, tenants`
- Fake tenant-owner accounts removed: **7**
- Tenants inserted: **8**, menus inserted: **20**
- Placeholder values used: none (`location_note` NULL)
- Tenant -> email (tersimpan lowercase oleh GoTrue; login dengan kapital tetap jalan):
  - Ayam Penyet Bang Dower -> ayampenyetbangdower@yopmail.com
  - Kantin Bu Ghin -> kantinbughin@yopmail.com
  - Kantin Bucin Cindy -> kantinbucincindy@yopmail.com
  - Kantin Ibu 'Is -> kantinibuis@yopmail.com
  - Kantin Royani -> kantinroyani@yopmail.com
  - Kantin Zoya -> kantinzoya@yopmail.com
  - Prayata Resto -> prayataresto@yopmail.com
  - Warung Samping Prayata -> warungsampingprayata@yopmail.com

## Verifikasi state akhir (via `supabase db query --linked`)
- Tenant (semua `is_approved=true`): Ayam Penyet Bang Dower 1 menu, Kantin Bu Ghin 2,
  Kantin Bucin Cindy 1, Kantin Ibu 'Is 7, Kantin Royani 1, Kantin Zoya 1,
  Prayata Resto 5, Warung Samping Prayata 2 → total 20 ✅
- `portions` = 0, `orders` = 0 ✅ (wipe bersih)
- `profiles` student = 27 ✅ (tidak tersentuh)
- `profiles` tenant = 14 (8 baru + 6 lama di bawah)
- Menu conditional (contoh): "Beef Teriyaki + Nasi + Salad" 20000,
  "Bento 1 (Nasi, 3 Egg roll, salad)" 18000 — `safety_tier` + `sale_conditions` terisi ✅
- Login `PrayataResto@yopmail.com` (kapital) → OK sebagai `prayataresto@yopmail.com` ✅

## Akun tenant-role lama yang SENGAJA tidak dihapus (bukan marker seed)
Sesuai aturan ("kalau tidak bisa diidentifikasi dengan pasti, biarkan"):
`geprek@kampus.ac.id`, `kopi@kampus.ac.id`, `padang@kampus.ac.id`,
`pecel@kampus.ac.id`, `soto@kampus.ac.id`, `warteg@kampus.ac.id`
— tidak memiliki tenant, email bukan marker `*1793198479@yopmail.com`.

## Catatan
- Backup sebelum run ini: `supabase db dump` gagal (butuh Docker, daemon mati).
  Run ini dilakukan atas instruksi eksplisit operator setelah dry-run terverifikasi.

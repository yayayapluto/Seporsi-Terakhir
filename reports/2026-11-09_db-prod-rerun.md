# Proof — `db:prod` dijalankan ulang (idempotency)

Tanggal: 2026-11-09.
Perintah: `bun run db:prod` (dry run) lalu `bun run db:prod -- --yes`.

## Hasil
- Dry run: target `czvrxkzxgvjfmmbbfdrv.supabase.co`, truncate
  `orders, portions, menu_items, tenants`, insert 8 tenant / 20 menu / 8 akun.
- Execute: fake tenant-owner removed **0** (sudah bersih dari run pertama),
  tenants inserted 8, menus inserted 20, email table tercetak sama persis
  (lowercase oleh GoTrue).

## Verifikasi state akhir
- Tenants 8, menus 20, students 27 (utuh), orders 0.
- Login `KantinIbuIs@yopmail.com` (kapital) → OK sebagai
  `kantinibuis@yopmail.com` (akun tersambung ulang, password tidak berubah).

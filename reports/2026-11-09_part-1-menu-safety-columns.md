# Proof — Part 1: menu safety columns

Tanggal: 2026-11-09 (Asia/Jakarta)
Branch: `dev` (tidak menyentuh `main`)
Commit: `a8eede946377d03c172f667fd84f5f27c98902b9` — `feat(menu-safety): add safety_tier and sale_conditions to menu_items`
Remote: `origin/dev` (push berhasil; `HEAD -> dev, origin/dev`)

## Yang dikerjakan
- Menambahkan kolom nullable ke `menu_items` via migration tool Supabase:
  `supabase/migrations/20261109071546_menu_safety_columns.sql`
- Regenerasi tipe via `bun run db:types` ke `src/types/database.ts` (bukan hand-edit)
- `db:push` berhasil diterapkan ke database linked (hosted)
- Commit + push hanya 2 file: migration + `database.ts` (tidak `git add -A`; folder `docs/artboard/` yang untracked dibiarkan)

## Bukti isi migration
```sql
-- Menu safety: tier 'safe' | 'conditional' (NULL = not vetted) + sale conditions
-- (NULL = no conditions). Nullable, no backfill. Portions join menu_items via
-- menu_item_id (they do not copy name/price), so no column needed there.
alter table menu_items
  add column if not exists safety_tier text
    check (safety_tier is null or safety_tier in ('safe', 'conditional')),
  add column if not exists sale_conditions text;
```

## Bukti tipe tergenerasi (`src/types/database.ts`)
```text
54: safety_tier: string | null
55: sale_conditions: string | null
70: safety_tier?: string | null
71: sale_conditions?: string | null
86: safety_tier?: string | null
87: sale_conditions?: string | null
734: safety_tier: string | null
735: sale_conditions: string | null
```

## Keputusan schema: portions tidak perlu kolom baru
- `portions` TIDAK menyalin `name`/harga menu; ia join ke `menu_items` via `menu_item_id`
  (hanya `orders` yang snapshot harga saat `place_order`).
- Sesuai aturan Part 1 ("otherwise read it from the menu by join"), `sale_conditions`
  dibaca dari menu lewat join — tidak ada kolom duplikat di `portions`.

## Status tabel untuk Part 2 (hasil cek schema, belum dieksekusi)
- Rantai truncate tenant-side: `orders` → `portions` → `menu_items` → `tenants`
- `tour_progress` hanya mereferensikan `auth.users` (bukan tenant-side) → tidak di-truncate
- Impact stats adalah RPC/view (`impact_summary`, `admin_report`, `impact_daily`), bukan tabel
- Tidak ada tabel notifications
- `profiles`/`auth.users`: hanya fake tenant-owner yang dihapus; student/admin tidak disentuh
- `tenants.owner_id` NOT NULL + unique → tenant asli butuh akun owner per tenant

## Yang BELUM terverifikasi
- Part 2 (`bun run db:prod`) belum dibuat/dijalankan
- Part 3 (UI `SaleConditions`) belum dikerjakan
- Verifikasi isi kolom di DB prod belum dilakukan (menunggu Part 2)

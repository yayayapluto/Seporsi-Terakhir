-- Jalur foto (object path, bukan URL penuh); nullable, tanpa backfill.
-- portions join menu_items via menu_item_id (tidak menyalin name/harga),
-- jadi foto dibaca dari menu lewat join.
alter table profiles
  add column if not exists avatar_path text;

alter table tenants
  add column if not exists logo_path text;

alter table menu_items
  add column if not exists photo_path text;

-- Seed lokal (reset penuh): profil, tenant kantin, menu, porsi relatif ke now().
-- Auth users harus ada dulu; UUID ini placeholder — ganti dgn auth user id asli.

insert into profiles (id, role, email, full_name) values
  ('11111111-1111-1111-1111-111111111111', 'admin', 'admin1793198479@yopmail.com', 'Admin BEM'),
  ('22222222-2222-2222-2222-222222222222', 'tenant', 'warteg1793198479@yopmail.com', 'Bu Warteg'),
  ('33333333-3333-3333-3333-333333333333', 'tenant', 'kopi1793198479@yopmail.com', 'Bang Kopi'),
  ('44444444-4444-4444-4444-444444444444', 'tenant', 'padang1793198479@yopmail.com', 'Uni Padang'),
  ('55555555-5555-5555-5555-555555555555', 'tenant', 'soto1793198479@yopmail.com', 'Cak Soto'),
  ('66666666-6666-6666-6666-666666666666', 'tenant', 'pecel1793198479@yopmail.com', 'Mbak Pecel'),
  ('77777777-7777-7777-7777-777777777777', 'tenant', 'geprek1793198479@yopmail.com', 'Mas Geprek'),
  ('88888888-8888-8888-8888-888888888888', 'student', 'rafi1793198479@yopmail.com', 'Rafi Anggara'),
  ('99999999-9999-9999-9999-999999999999', 'student', 'sinta1793198479@yopmail.com', 'Sinta Dewi')
on conflict (id) do update
  set role = excluded.role, email = excluded.email, full_name = excluded.full_name;

insert into tenants (id, owner_id, name, location_note, is_approved) values
  ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Warteg Barokah', 'Kantin blok A no. 3', true),
  ('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'Kopi Pojok', 'Selasar perpustakaan', true),
  ('a0000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444',
   'Masakan Padang Uni', 'Pujasera utama', true),
  ('a0000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555',
   'Soto Lamongan Cak No', 'Kantin gedung C', true),
  ('a0000000-0000-0000-0000-000000000005', '66666666-6666-6666-6666-666666666666',
   'Pecel Madiun Mbak Sri', 'Kantin vokasi', true),
  ('a0000000-0000-0000-0000-000000000006', '77777777-7777-7777-7777-777777777777',
   'Ayam Geprek Mas Boy', 'Kantin gedung B', true)
on conflict (id) do update
  set name = excluded.name, location_note = excluded.location_note, is_approved = true;

insert into menu_items (tenant_id, name, normal_price, avg_weight_grams) values
  ((select id from tenants where name = 'Warteg Barokah'), 'Nasi ayam + sayur', 15000, 350),
  ((select id from tenants where name = 'Warteg Barokah'), 'Nasi telur + tempe', 12000, 300),
  ((select id from tenants where name = 'Warteg Barokah'), 'Mie goreng', 10000, 250),
  ((select id from tenants where name = 'Kopi Pojok'), 'Roti bakar coklat', 8000, 120),
  ((select id from tenants where name = 'Kopi Pojok'), 'Pisang goreng (isi 3)', 7000, 200),
  ((select id from tenants where name = 'Kopi Pojok'), 'Indomie telur kornet', 13000, 280),
  ((select id from tenants where name = 'Masakan Padang Uni'), 'Nasi rendang + sayur', 18000, 400),
  ((select id from tenants where name = 'Masakan Padang Uni'), 'Nasi ayam pop', 16000, 380),
  ((select id from tenants where name = 'Masakan Padang Uni'), 'Nasi telur balado', 12000, 320),
  ((select id from tenants where name = 'Soto Lamongan Cak No'), 'Soto ayam + nasi', 13000, 350),
  ((select id from tenants where name = 'Soto Lamongan Cak No'), 'Soto ayam tanpa nasi', 10000, 250),
  ((select id from tenants where name = 'Pecel Madiun Mbak Sri'), 'Nasi pecel lengkap', 12000, 330),
  ((select id from tenants where name = 'Pecel Madiun Mbak Sri'), 'Nasi pecel + telur', 14000, 370),
  ((select id from tenants where name = 'Ayam Geprek Mas Boy'), 'Nasi ayam geprek sambal matah', 15000, 350),
  ((select id from tenants where name = 'Ayam Geprek Mas Boy'), 'Nasi ayam geprek original', 13000, 340),
  ((select id from tenants where name = 'Ayam Geprek Mas Boy'), 'Mie geprek + telur', 11000, 300)
on conflict (tenant_id, name) do update
  set normal_price = excluded.normal_price, avg_weight_grams = excluded.avg_weight_grams;

-- contoh bahan & alergen (4 menu; sisanya null = bukti empty state eksplisit).
-- tenant-scoped: nama menu unik per tenant, bukan global.
update menu_items set ingredients = 'Nasi, ayam geprek, sambal matah',
  allergen_note = null
where name = 'Nasi ayam geprek sambal matah'
  and tenant_id = (select id from tenants where name = 'Ayam Geprek Mas Boy');
update menu_items set ingredients = 'Nasi, rendang, sayur singkong',
  allergen_note = 'Mengandung santan'
where name = 'Nasi rendang + sayur'
  and tenant_id = (select id from tenants where name = 'Masakan Padang Uni');
update menu_items set ingredients = 'Nasi, pecel, rempeyek, telur',
  allergen_note = 'Mengandung kacang, telur'
where name = 'Nasi pecel lengkap'
  and tenant_id = (select id from tenants where name = 'Pecel Madiun Mbak Sri');
update menu_items set ingredients = 'Nasi, ayam suwir, kuah kuning, kol, telur rebus',
  allergen_note = 'Mengandung telur'
where name = 'Soto ayam + nasi'
  and tenant_id = (select id from tenants where name = 'Soto Lamongan Cak No');

-- katalog: campuran segar (sisa banyak), hampir habis, hampir kedaluwarsa,
-- 1 sudah lewat jual (tak tampil, bukti filter BR-2).
insert into portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
    cooked_at, sell_window_minutes, release_at, discount_price)
select t.id, m.id, 10, 10, now() - interval '30 minutes', 180,
    now() - interval '25 minutes', 7000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Warteg Barokah' and m.name = 'Nasi ayam + sayur'
union all
select t.id, m.id, 5, 2, now() - interval '3 hours', 180,
    now() - interval '2 hours 50 minutes', 5500
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Warteg Barokah' and m.name = 'Nasi telur + tempe'
union all
select t.id, m.id, 8, 8, now() - interval '6 hours', 180,
    now() - interval '5 hours 50 minutes', 4000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Kopi Pojok' and m.name = 'Roti bakar coklat'
union all
select t.id, m.id, 12, 9, now() - interval '45 minutes', 240,
    now() - interval '40 minutes', 9000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Masakan Padang Uni' and m.name = 'Nasi rendang + sayur'
union all
select t.id, m.id, 10, 4, now() - interval '1 hour', 180,
    now() - interval '55 minutes', 8000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Masakan Padang Uni' and m.name = 'Nasi ayam pop'
union all
select t.id, m.id, 15, 12, now() - interval '20 minutes', 120,
    now() - interval '15 minutes', 7000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Soto Lamongan Cak No' and m.name = 'Soto ayam + nasi'
union all
select t.id, m.id, 6, 1, now() - interval '2 hours 30 minutes', 180,
    now() - interval '2 hours 20 minutes', 5000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Soto Lamongan Cak No' and m.name = 'Soto ayam tanpa nasi'
union all
select t.id, m.id, 10, 7, now() - interval '50 minutes', 180,
    now() - interval '45 minutes', 6500
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Pecel Madiun Mbak Sri' and m.name = 'Nasi pecel lengkap'
union all
select t.id, m.id, 8, 8, now() - interval '15 minutes', 180,
    now() - interval '10 minutes', 7500
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Pecel Madiun Mbak Sri' and m.name = 'Nasi pecel + telur'
union all
select t.id, m.id, 12, 6, now() - interval '35 minutes', 180,
    now() - interval '30 minutes', 8000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Ayam Geprek Mas Boy' and m.name = 'Nasi ayam geprek sambal matah'
union all
select t.id, m.id, 10, 10, now() - interval '25 minutes', 180,
    now() - interval '20 minutes', 7000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Ayam Geprek Mas Boy' and m.name = 'Nasi ayam geprek original'
union all
select t.id, m.id, 7, 3, now() - interval '1 hour 30 minutes', 180,
    now() - interval '1 hour 20 minutes', 6000
from tenants t join menu_items m on m.tenant_id = t.id
where t.name = 'Warteg Barokah' and m.name = 'Mie goreng';

-- ALL-IN-ONE hosted seed: 1 admin + 6 tenant + 1 student + katalog.
-- Cara pakai: Supabase dashboard → SQL Editor → tempel → Run.
-- Password semua akun: Porsi123!
-- Ganti password setelah login pertama.
--
-- Kenapa begini: auth.users butuh bcrypt hash; crypt() tersedia bila
-- extension pgcrypto aktif (bawaan di hosted Supabase).

create extension if not exists pgcrypto;

-- 1. auth users (confirm langsung, tanpa klik email)
insert into auth.users (instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
  'authenticated', e, crypt('Porsi123!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', n), false
from (values
  ('admin@kampus.ac.id', 'Admin BEM'),
  ('warteg@kampus.ac.id', 'Bu Warteg'),
  ('kopi@kampus.ac.id', 'Bang Kopi'),
  ('padang@kampus.ac.id', 'Uni Padang'),
  ('soto@kampus.ac.id', 'Cak Soto'),
  ('pecel@kampus.ac.id', 'Mbak Pecel'),
  ('geprek@kampus.ac.id', 'Mas Geprek'),
  ('rafi@student.ac.id', 'Rafi Anggara')
) as v(e, n)
where not exists (select 1 from auth.users u where u.email = v.e);

-- 2. roles: matikan trigger guard selama seed (SQL Editor autocommit tiap
-- statement, jadi set_config transaction-local tak bertahan antar statement).
alter table profiles disable trigger profiles_role_guard;
update profiles p set role = 'admin', full_name = 'Admin BEM'
from auth.users u where u.email = 'admin@kampus.ac.id' and p.id = u.id;
update profiles p set role = 'tenant'
from auth.users u where p.id = u.id and u.email in
  ('warteg@kampus.ac.id', 'kopi@kampus.ac.id', 'padang@kampus.ac.id',
   'soto@kampus.ac.id', 'pecel@kampus.ac.id', 'geprek@kampus.ac.id');
update profiles p set full_name = 'Rafi Anggara'
from auth.users u where u.email = 'rafi@student.ac.id' and p.id = u.id;
alter table profiles enable trigger profiles_role_guard;

-- 3. tenants (owner resolve via email, bukan UUID mati)
insert into tenants (owner_id, name, location_note, is_approved)
select u.id, v.t, v.l, true
from (values
  ('warteg@kampus.ac.id', 'Warteg Barokah', 'Kantin blok A no. 3'),
  ('kopi@kampus.ac.id', 'Kopi Pojok', 'Selasar perpustakaan'),
  ('padang@kampus.ac.id', 'Masakan Padang Uni', 'Pujasera utama'),
  ('soto@kampus.ac.id', 'Soto Lamongan Cak No', 'Kantin gedung C'),
  ('pecel@kampus.ac.id', 'Pecel Madiun Mbak Sri', 'Kantin vokasi'),
  ('geprek@kampus.ac.id', 'Ayam Geprek Mas Boy', 'Kantin gedung B')
) as v(e, t, l)
join auth.users u on u.email = v.e
where not exists (select 1 from tenants t where t.owner_id = u.id);

-- 4. menus
insert into menu_items (tenant_id, name, normal_price, avg_weight_grams)
select t.id, v.m, v.p, v.g
from (values
  ('Warteg Barokah', 'Nasi ayam + sayur', 15000, 350),
  ('Warteg Barokah', 'Nasi telur + tempe', 12000, 300),
  ('Warteg Barokah', 'Mie goreng', 10000, 250),
  ('Kopi Pojok', 'Roti bakar coklat', 8000, 120),
  ('Kopi Pojok', 'Pisang goreng (isi 3)', 7000, 200),
  ('Kopi Pojok', 'Indomie telur kornet', 13000, 280),
  ('Masakan Padang Uni', 'Nasi rendang + sayur', 18000, 400),
  ('Masakan Padang Uni', 'Nasi ayam pop', 16000, 380),
  ('Masakan Padang Uni', 'Nasi telur balado', 12000, 320),
  ('Soto Lamongan Cak No', 'Soto ayam + nasi', 13000, 350),
  ('Soto Lamongan Cak No', 'Soto ayam tanpa nasi', 10000, 250),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel lengkap', 12000, 330),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel + telur', 14000, 370),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek sambal matah', 15000, 350),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek original', 13000, 340),
  ('Ayam Geprek Mas Boy', 'Mie geprek + telur', 11000, 300)
) as v(t, m, p, g)
join tenants t on t.name = v.t
on conflict (tenant_id, name) do update
  set normal_price = excluded.normal_price, avg_weight_grams = excluded.avg_weight_grams;

-- 5. portions relatif ke now() (1 expired = bukti filter BR-2)
insert into portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
    cooked_at, sell_window_minutes, release_at, discount_price)
select t.id, m.id, v.qp, v.qr, now() - v.ca::interval, v.sw, now() - v.ra::interval, v.dp
from (values
  ('Warteg Barokah', 'Nasi ayam + sayur', 10, 10, '30 minutes', 180, '25 minutes', 7000),
  ('Warteg Barokah', 'Nasi telur + tempe', 5, 2, '3 hours', 180, '2 hours 50 minutes', 5500),
  ('Kopi Pojok', 'Roti bakar coklat', 8, 8, '6 hours', 180, '5 hours 50 minutes', 4000),
  ('Masakan Padang Uni', 'Nasi rendang + sayur', 12, 9, '45 minutes', 240, '40 minutes', 9000),
  ('Masakan Padang Uni', 'Nasi ayam pop', 10, 4, '1 hour', 180, '55 minutes', 8000),
  ('Soto Lamongan Cak No', 'Soto ayam + nasi', 15, 12, '20 minutes', 120, '15 minutes', 7000),
  ('Soto Lamongan Cak No', 'Soto ayam tanpa nasi', 6, 1, '2 hours 30 minutes', 180, '2 hours 20 minutes', 5000),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel lengkap', 10, 7, '50 minutes', 180, '45 minutes', 6500),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel + telur', 8, 8, '15 minutes', 180, '10 minutes', 7500),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek sambal matah', 12, 6, '35 minutes', 180, '30 minutes', 8000),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek original', 10, 10, '25 minutes', 180, '20 minutes', 7000),
  ('Warteg Barokah', 'Mie goreng', 7, 3, '1 hour 30 minutes', 180, '1 hour 20 minutes', 6000)
) as v(t, m, qp, qr, ca, sw, ra, dp)
join tenants t on t.name = v.t
join menu_items m on m.tenant_id = t.id and m.name = v.m;

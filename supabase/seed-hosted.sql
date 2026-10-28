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
  ('admin1793198479@yopmail.com', 'Admin BEM'),
  ('warteg1793198479@yopmail.com', 'Bu Warteg'),
  ('kopi1793198479@yopmail.com', 'Bang Kopi'),
  ('padang1793198479@yopmail.com', 'Uni Padang'),
  ('soto1793198479@yopmail.com', 'Cak Soto'),
  ('pecel1793198479@yopmail.com', 'Mbak Pecel'),
  ('geprek1793198479@yopmail.com', 'Mas Geprek'),
  ('rafi1793198479@yopmail.com', 'Rafi Anggara')
) as v(e, n)
where not exists (select 1 from auth.users u where u.email = v.e);

-- 1b. identities: GoTrue login email butuh baris ini; insert mentah
-- ke auth.users tak bikin otomatis -> "Database error querying schema".
insert into auth.identities (id, user_id, provider_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email,
    'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
from auth.users u
where u.email in ('admin1793198479@yopmail.com', 'warteg1793198479@yopmail.com',
  'kopi1793198479@yopmail.com', 'padang1793198479@yopmail.com', 'soto1793198479@yopmail.com',
  'pecel1793198479@yopmail.com', 'geprek1793198479@yopmail.com', 'rafi1793198479@yopmail.com')
  and not exists (select 1 from auth.identities i where i.user_id = u.id);

-- perbaiki baris lama yg identity_data-nya tanpa flag verified (GoTrue
-- tolak parse saat login -> 500). Aman diulang.
update auth.identities i
set identity_data = i.identity_data
  || '{"email_verified": true, "phone_verified": false}'::jsonb,
  updated_at = now()
from auth.users u
where i.user_id = u.id and i.provider = 'email'
  and (i.identity_data ->> 'email_verified') is null;

-- 2. roles: matikan trigger guard selama seed (SQL Editor autocommit tiap
-- statement, jadi set_config transaction-local tak bertahan antar statement).
alter table profiles disable trigger profiles_role_guard;
update profiles p set role = 'admin', full_name = 'Admin BEM'
from auth.users u where u.email = 'admin1793198479@yopmail.com' and p.id = u.id;
update profiles p set role = 'tenant'
from auth.users u where p.id = u.id and u.email in
  ('warteg1793198479@yopmail.com', 'kopi1793198479@yopmail.com', 'padang1793198479@yopmail.com',
   'soto1793198479@yopmail.com', 'pecel1793198479@yopmail.com', 'geprek1793198479@yopmail.com');
update profiles p set full_name = 'Rafi Anggara'
from auth.users u where u.email = 'rafi1793198479@yopmail.com' and p.id = u.id;
alter table profiles enable trigger profiles_role_guard;

-- 3. tenants (owner resolve via email, bukan UUID mati)
insert into tenants (owner_id, name, location_note, is_approved)
select u.id, v.t, v.l, true
from (values
  ('warteg1793198479@yopmail.com', 'Warteg Barokah', 'Kantin blok A no. 3'),
  ('kopi1793198479@yopmail.com', 'Kopi Pojok', 'Selasar perpustakaan'),
  ('padang1793198479@yopmail.com', 'Masakan Padang Uni', 'Pujasera utama'),
  ('soto1793198479@yopmail.com', 'Soto Lamongan Cak No', 'Kantin gedung C'),
  ('pecel1793198479@yopmail.com', 'Pecel Madiun Mbak Sri', 'Kantin vokasi'),
  ('geprek1793198479@yopmail.com', 'Ayam Geprek Mas Boy', 'Kantin gedung B')
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

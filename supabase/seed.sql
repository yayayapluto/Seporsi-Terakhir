-- Phase 2 seed (local/dev): 1 admin, 2 tenants (3 fixed UUIDs), menus + portions.
-- Auth users must exist first (created via dashboard or `supabase auth`); these
-- UUIDs are placeholders — replace with real auth user ids when seeding locally.

insert into profiles (id, role, email, full_name) values
  ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@kampus.ac.id', 'Admin BEM'),
  ('22222222-2222-2222-2222-222222222222', 'tenant', 'warteg@kampus.ac.id', 'Bu Warteg'),
  ('33333333-3333-3333-3333-333333333333', 'tenant', 'kopi@kampus.ac.id', 'Bang Kopi')
on conflict (id) do update set role = excluded.role;

insert into tenants (id, owner_id, name, location_note, is_approved) values
  ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Warteg Barokah', 'Kantin blok A no. 3', true),
  ('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'Kopi Pojok', 'Selasar perpustakaan', true)
on conflict (id) do update set is_approved = true;

insert into menu_items (tenant_id, name, normal_price, avg_weight_grams) values
  ((select id from tenants where name = 'Warteg Barokah'), 'Nasi ayam + sayur', 15000, 350),
  ((select id from tenants where name = 'Warteg Barokah'), 'Nasi telur + tempe', 12000, 300),
  ((select id from tenants where name = 'Warteg Barokah'), 'Mie goreng', 10000, 250),
  ((select id from tenants where name = 'Kopi Pojok'), 'Roti bakar coklat', 8000, 120),
  ((select id from tenants where name = 'Kopi Pojok'), 'Pisang goreng (isi 3)', 7000, 200)
on conflict (tenant_id, name) do update set normal_price = excluded.normal_price;

-- portions relative to now: one fresh, one nearly expired, one already expired
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
where t.name = 'Kopi Pojok' and m.name = 'Roti bakar coklat';

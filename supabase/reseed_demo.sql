-- Demo reseed: menu + porsi segar utk 6 tenant. Idempoten (by nama),
-- tak hapus data eksisting. Jalankan di SQL editor SETELAH reseed_tenants.
-- Porsi cooked "baru saja" (10–50 mnt lalu, window 180) -> lolos filter katalog.

-- 1. menu baru per tenant (yg belum ada; abaikan yg sudah ada)
insert into menu_items (tenant_id, name, normal_price, avg_weight_grams, ingredients, allergen_note)
select t.id, v.name, v.price, v.w, v.ing, v.alg
from tenants t
join (values
  ('Warteg Barokah', 'Nasi ayam + sayur', 15000, 350, 'Nasi, ayam goreng, sayur sop', null),
  ('Warteg Barokah', 'Nasi telur + tempe', 12000, 300, 'Nasi, telur dadar, tempe orek', 'Mengandung telur, kedelai'),
  ('Warteg Barokah', 'Mie goreng', 10000, 250, 'Mie, kol, telur', 'Mengandung telur, gluten'),
  ('Kopi Pojok', 'Roti bakar coklat', 8000, 120, 'Roti, meses coklat, margarin', 'Mengandung susu, gluten'),
  ('Kopi Pojok', 'Pisang goreng (isi 3)', 7000, 200, 'Pisang, tepung, gula aren', 'Mengandung gluten'),
  ('Kopi Pojok', 'Indomie telur kornet', 13000, 280, 'Indomie, telur, kornet', 'Mengandung telur, gluten'),
  ('Masakan Padang Uni', 'Nasi rendang + sayur', 18000, 400, 'Nasi, rendang, sayur singkong', 'Mengandung santan'),
  ('Masakan Padang Uni', 'Nasi ayam pop', 16000, 380, 'Nasi, ayam pop, sambal', null),
  ('Masakan Padang Uni', 'Nasi telur balado', 12000, 320, 'Nasi, telur balado, kerupuk', 'Mengandung telur'),
  ('Soto Lamongan Cak No', 'Soto ayam + nasi', 13000, 350, 'Nasi, ayam suwir, kuah kuning, kol, telur rebus', 'Mengandung telur'),
  ('Soto Lamongan Cak No', 'Soto ayam tanpa nasi', 10000, 250, 'Ayam suwir, kuah kuning, kol, soun', null),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel lengkap', 12000, 330, 'Nasi, pecel, rempeyek, telur', 'Mengandung kacang, telur'),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel + telur', 14000, 370, 'Nasi, pecel, telur dadar', 'Mengandung kacang, telur'),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek sambal matah', 15000, 350, 'Nasi, ayam geprek, sambal matah', null),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek original', 13000, 340, 'Nasi, ayam geprek, sambal bawang', null),
  ('Ayam Geprek Mas Boy', 'Mie geprek + telur', 11000, 300, 'Mie, sambal geprek, telur', 'Mengandung telur, gluten')
) as v(tname, name, price, w, ing, alg) on v.tname = t.name
on conflict (tenant_id, name) do update
  set normal_price = excluded.normal_price,
      avg_weight_grams = excluded.avg_weight_grams,
      ingredients = excluded.ingredients,
      allergen_note = excluded.allergen_note;

-- 2. porsi segar: skip menu yg SUDAH punya porsi aktif hari ini
insert into portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
  cooked_at, sell_window_minutes, release_at, discount_price)
select t.id, m.id, v.qty, v.qty,
  now() - (v.min_ago || ' minutes')::interval, 180,
  now() - (v.min_ago || ' minutes')::interval,
  -- 45% harga normal, kelipatan Rp500 (BR-6)
  (round(m.normal_price * 0.45 / 500) * 500)::int
from menu_items m
join tenants t on t.id = m.tenant_id
join (values
  ('Warteg Barokah', 'Nasi ayam + sayur', 10, 30),
  ('Warteg Barokah', 'Nasi telur + tempe', 5, 45),
  ('Warteg Barokah', 'Mie goreng', 7, 60),
  ('Kopi Pojok', 'Roti bakar coklat', 8, 360),
  ('Kopi Pojok', 'Pisang goreng (isi 3)', 6, 20),
  ('Kopi Pojok', 'Indomie telur kornet', 9, 25),
  ('Masakan Padang Uni', 'Nasi rendang + sayur', 12, 40),
  ('Masakan Padang Uni', 'Nasi ayam pop', 10, 55),
  ('Masakan Padang Uni', 'Nasi telur balado', 8, 70),
  ('Soto Lamongan Cak No', 'Soto ayam + nasi', 15, 15),
  ('Soto Lamongan Cak No', 'Soto ayam tanpa nasi', 6, 150),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel lengkap', 10, 50),
  ('Pecel Madiun Mbak Sri', 'Nasi pecel + telur', 8, 10),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek sambal matah', 12, 35),
  ('Ayam Geprek Mas Boy', 'Nasi ayam geprek original', 10, 25),
  ('Ayam Geprek Mas Boy', 'Mie geprek + telur', 7, 90)
) as v(tname, mname, qty, min_ago) on v.tname = t.name and v.mname = m.name
where t.is_approved and m.is_active
  and not exists (
    select 1 from portions p
    where p.menu_item_id = m.id
      and p.quantity_remaining > 0
      and p.expires_at > now()
  );

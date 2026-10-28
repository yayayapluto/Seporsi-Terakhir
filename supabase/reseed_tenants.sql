-- Reseed tenants pasca seed-auth (id asli). Jalankan SETELAH
-- bun run seed:auth sukses. Idempoten via owner_id unique.
insert into tenants (owner_id, name, location_note, is_approved)
select p.id, v.name, v.loc, true
from profiles p
join (values
  ('warteg1793198479@yopmail.com', 'Warteg Barokah', 'Kantin blok A no. 3'),
  ('kopi1793198479@yopmail.com', 'Kopi Pojok', 'Selasar perpustakaan'),
  ('padang1793198479@yopmail.com', 'Masakan Padang Uni', 'Pujasera utama'),
  ('soto1793198479@yopmail.com', 'Soto Lamongan Cak No', 'Kantin gedung C'),
  ('pecel1793198479@yopmail.com', 'Pecel Madiun Mbak Sri', 'Kantin vokasi'),
  ('geprek1793198479@yopmail.com', 'Ayam Geprek Mas Boy', 'Kantin gedung B')
) as v(email, name, loc) on v.email = p.email
on conflict (owner_id) do update
  set name = excluded.name,
      location_note = excluded.location_note,
      is_approved = true;

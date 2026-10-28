-- Reseed tenants pasca seed-auth (id asli). Jalankan SETELAH
-- bun run seed:auth sukses. Idempoten via owner_id unique.
insert into tenants (owner_id, name, location_note, is_approved)
select p.id, v.name, v.loc, true
from profiles p
join (values
  ('warteg@kampus.ac.id', 'Warteg Barokah', 'Kantin blok A no. 3'),
  ('kopi@kampus.ac.id', 'Kopi Pojok', 'Selasar perpustakaan'),
  ('padang@kampus.ac.id', 'Masakan Padang Uni', 'Pujasera utama'),
  ('soto@kampus.ac.id', 'Soto Lamongan Cak No', 'Kantin gedung C'),
  ('pecel@kampus.ac.id', 'Pecel Madiun Mbak Sri', 'Kantin vokasi'),
  ('geprek@kampus.ac.id', 'Ayam Geprek Mas Boy', 'Kantin gedung B')
) as v(email, name, loc) on v.email = p.email
on conflict (owner_id) do update
  set name = excluded.name,
      location_note = excluded.location_note,
      is_approved = true;

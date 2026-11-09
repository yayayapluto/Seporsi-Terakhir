# Panduan Recording Demo — Seporsi Terakhir

Urutan per peran. Semua akun di bawah = akun seed demo / hasil `db:prod`
(lihat README "Akun demo"). Recording di 360–430px mobile kalau mau real-time;
desktop juga oke. Centang tiap panel selama perekaman.

Buka browser dengan viewport sudah login (lewat `/masuk` kalau perlu).

---

## Bagian 0 — Pembuka (1–2 menit)

1. Buka `/` (public).
2. Scroll pelan: hero → **Tiga langkah dari etalase ke meja makan** →
   FAQ → **"Lihat Porsi Hari Ini"** / **"Masuk"**.
3. Buka `/masuk` — tunjukkan tombol Google + Email + (dev) pintasan login cepat.

---

## Bagian 1 — Buyer / Mahasiswa

Login sebagai `rafi1793198479@yopmail.com` (student).

1. **Beranda** (`/beranda`): sapaan, "Katalog sore ini" (kartu grub),
   skeleton saat loading, tour panduan jika muncul (lewati dengan **Lewati**).
2. **Katalog** (`/beranda/katalog`):
   - Filter **Tenant = "Semua tenant"** → coba ganti 1 tenant.
   - Ganti **Urutkan** (Hampir habis / Termurah / Paling segar).
   - Grid ↔ list toggle.
   - Kartu porsi: foto + badge **Hemat %** + badge **Sisa N** +
     "Dimasak ..." + **badge syarat** bila conditional (kotak amber "Syarat:").
3. **Detail porsi** (`/beranda/katalog/[id]`):
   - Header: badge sisa, foto, logo tenant, jam masak, batas ambil,
     syarat penjualan.
   - Pilih jumlah (1–2) → **Pesan** → kaget? Stock berkurang 1.
4. **Pesanan saya** (`/beranda/pesanan`):
   - Filter Semua/Menunggu pickup/Selesai/Dibatalkan.
   - Kartu order: nama, jumlah, "Dipesan", total, syarat penjualan.
   - Detail → tampilkan **kode QR pickup**, deadline ambil, total bayar.
   - Coba **Batalkan** pesanan untuk satu order (opsional).
5. **Profil** (`/profil`):
   - Avatar (klik → **Ubah foto**, pratinjau, Simpan),
   - Statistik kontribusi (porsi terselamatkan, uang hemat, sampah),
   - Bantuan (lapor bug).

**Simpan bukti:** satu order aktif + QR terbaca.

---

## Bagian 2 — Mitra / Tenant

Login sebagai `warteg1793198479@yopmail.com` (tenant) atau
`PrayataResto@yopmail.com` (tenant nyata dari `db:prod`).

1. **Dasbor** (`/tenant`): kartu "HARI INI" (Pickup, Omzet, Menunggu,
   Porsi aktif), kartu perhatian (porsi hampir habis / antrean).
2. **Bottom nav**: Dasbor → Pindai → **Menu** → Pesanan → Profil.
   - Buka tab **Menu** (`/tenant/menu-saya`) — tombol **Upload foto menu** /
     **Ubah foto menu** pada dialog Edit.
3. **Menu saya** (`/tenant/menu-saya`):
   - "+ Tambah menu" (nama, harga, bahan, alergen, foto).
   - Edit menu ini: kalender? nama + harga + **Upload foto menu**.
4. **Tambah porsi** (`/tenant/porsi/tambah`):
   - Pilih menu (wajib), jumlah stepper, jam masak (+ tanggal),
     jendela jual, jadwal tampil (opsional), harga diskon (saran otomatis).
   - Checklist "CEK" harus semua ✓ → **Posting porsi**.
5. **Dasbor** → lihat porsi baru muncul di "Porsi aktif" dengan garis sisa.
6. **Scan** (`/tenant/scan`):
   - Buka scanner (izin kamera) → frame hijau + manual kode 4 digit.
   - Scan / input kode order milik Buyer (dari bagian 1, kode QR / kode manual).
   - Konfirmasi → order jadi **selesai**; angka Pickup & Omzet di dasbor naik.
7. **Pesanan** (`/tenant/pesanan`): daftar order, buka detail (pemesan +
   riwayat pemesan), **Batalkan pesanan** (opsional).
8. **Profil kantin** (`/tenant/profil`): **logo uploader** (circle),
   nama gerai + lokasi (Simpan).

**Simpan bukti:** dashboard stats + satu konfirmasi pickup.

---

## Bagian 3 — Admin

Login sebagai `admin1793198479@yopmail.com` (admin).

1. **Dampak** (`/admin`): kartu sorotan (Porsi terselamatkan, Sell-through,
   Uang hemat mahasiswa, Pendapatan tambahan tenant, Sampah terhindar),
   **Tren harian** (rentang 24 jam / 3 hari / 7 hari / Sebulan; tap garis),
   tabel/kartu per-tenant + badge **Tertinggi** / **Belum diambil**,
   ekspor CSV.
2. **Persetujuan tenant** (`/admin/tenant`):
   - Antrean tampil + badge counter.
   - **Tinjau** → Setujui/Tolak (opsional, akan mengubah data demo).
   - **Ubah email**: pilih tenant → dialog "Ubah email tenant" →
     "Simpan" → toast "Email tenant diperbarui".
3. **Katalog sebagai admin**: hanya lihat (tidak bisa pesan).
   Detail porsi admin menampilkan "Admin hanya bisa melihat katalog ini."

---

## Bagian 4 — Verifikasi hasil rekaman

- [ ] Landing + semua rute terbuka tanpa error console
- [ ] Buyer bisa pesan (maks 2/hari) dan dapat QR
- [ ] Mitra bisa posting + scan konfirmasi
- [ ] Dashboard tenant angka konsisten
- [ ] Admin ubah email tenant dan email lama tidak bisa login
- [ ] Semua screenshot/screencast disimpan di tempat aman

---

## Catatan akun (semua dev-only)

| Peran | Email |
|---|---|
| Admin | `admin1793198479@yopmail.com` |
| Tenant demo | `warteg1793198479@yopmail.com` (Bu Warteg) |
| Tenant nyata | `PrayataResto@yopmail.com`, `kantinzoya@yopmail.com` (password dari `TENANT_DEFAULT_PASSWORD`, email tampil lowercase) |
| Student | `rafi1793198479@yopmail.com`, `sinta1793198479@yopmail.com` |

Password seed dev (`SEED_PASSWORD`) hanya dipakai localhost — di tempat umum
rekam cukup "password dari variabel env", jangan sebut nilainya.

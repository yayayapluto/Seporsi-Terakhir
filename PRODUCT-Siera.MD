# PRODUCT-Siera.MD — Acuan Desain Card-Based UI Gaya Siera

> Status: acuan redesign lapisan tampilan. `PRODUCT.md` / `DESIGN.md` tidak diubah. Kalau konflik dengan screenshot Siera, **screenshot menang**.
> Bahasa: Indonesia. Nama token/komponen Inggris. Setiap aturan punya nilai konkret.
> Label wajib: `[TERLIHAT]` = dari screenshot, `[ESTIMASI, verifikasi dengan color picker]` = perkiraan, `[USULAN]` = tambahan.

## Daftar Isi

1. Product Overview
2. Design Principles
3. Design Tokens
4. Layout & Responsiveness
5. Card System
6. Component Specs (non-card)
7. Page Blueprints
8. Role Dashboards
9. Iconography & Imagery
10. Interaction & Motion
11. Content & Copywriting
12. Do & Don't
14. QA Checklist per Halaman
15. Implementation Notes untuk Agent
16. Referensi Screenshot (cek visual)

---

## 1. Product Overview

- Platform mentoring & penugasan mahasiswa baru (PATRIBERA) + web multi-role "Seporsi Terakhir" milik sendiri.
- Pengguna: **mobile-first**, satu tangan, koneksi kampus lambat. Bahasa UI Indonesia.
- Tone: ramah, singkat, rapi. Satu layar, satu keputusan.
- Setiap role punya **homepage sendiri** (Beranda Tenant / Admin / Mentor / Student). Landing page hanya untuk visitor belum login, bukan tujuan redirect sesudah login.

## 2. Design Principles

1. Clean light mode, kanvas putih `#FFFFFF` `[TERLIHAT]`.
2. Card sebagai unit utama konten — tidak ada teks lepas di background.
3. Satu aksen hijau `primary #2E7D4F` `[TERLIHAT]` untuk semua aksi/status positif.
4. Ikon outline konsisten, stroke 1.5–2px, satu library.
5. Hierarki lewat bobot font (800/700/600), bukan lewat banyak warna.
6. Tiap card punya satu aksi jelas; tidak ada card/baris mati.

## 3. Design Tokens

### 3.1 Color

| Token | Hex | Pakai untuk |
|---|---|---|
| `primary` | `#2E7D4F` `[TERLIHAT]` | tombol primary, aksi teks, ikon aktif, border penting |
| `primary-dark` | `#1E5A36` `[TERLIHAT]` | teks di atas `primary-soft`, efek 3D tombol (`border-bottom`) |
| `primary-soft` | `#DCEBE0` `[TERLIHAT]` | bg Banner Info Card, badge positif |
| `mint` | `#E6F4EA` `[ESTIMASI, verifikasi dengan color picker]` | bg Status sukses |
| `text` | `#1C2826` `[TERLIHAT]` | teks utama |
| `muted` | `#64746B` `[TERLIHAT]` | teks sekunder, label section, subtitle |
| `border` | `#E8ECE9` `[ESTIMASI, verifikasi dengan color picker]` | border card 1px, divider dashed |
| `chip` | `#F1F5F2` `[ESTIMASI, verifikasi dengan color picker]` | bg chip netral |
| `danger` | `#BA1A1A` `[TERLIHAT]` | teks/ikon destruktif, dot unread |
| `danger-soft` | `#FEE2E2` `[ESTIMASI, verifikasi dengan color picker]` | bg Status danger, tile Danger Action |
| `warning` | `#B45309` `[ESTIMASI, verifikasi dengan color picker]` | teks badge "Kedaluwarsa N mnt" |
| `warning-soft` | `#FEF3C7` `[ESTIMASI, verifikasi dengan color picker]` | bg badge warning, bg Status warning |

Catatan: oranye kapur `#F28C28` `[TERLIHAT]` hanya untuk **angka harga rescue**, bukan aksen UI.

### 3.2 Typography

- Font: `Inter, system-ui, sans-serif` `[TERLIHAT]`. Heading boleh Plus Jakarta Sans bila sudah ada di repo, fallback Inter.
- Skala: `hero 20–22px/800` | `title 16–17px/700` | `body 14px/400–500` | `label 12–13px/600 muted` | `tiny 11px/600` `[ESTIMASI]` kecuali hero/title `[TERLIHAT]`.
- `line-height`: hero/title `1.3`, body `1.5`, label `1.4` `[USULAN]`.
- `letter-spacing`: normal; label section `0.02em` `[USULAN]`.

### 3.3 Radius, Spacing, Shadow, Border, Z-index

| Token | Nilai |
|---|---|
| `radius-card` | `20–24px` `[TERLIHAT]` |
| `radius-icon-tile` | `12px` `[TERLIHAT]` |
| `radius-thumbnail` | `12px` `[TERLIHAT]` |
| `radius-pill` | `999px` `[TERLIHAT]` |
| `radius-button` | `14–16px` `[TERLIHAT]` |
| `radius-alert` | `16px` `[ESTIMASI]` |
| `page-padding` | `16px` kiri-kanan `[TERLIHAT]` |
| `section-gap` | `24px` vertikal antar section `[TERLIHAT]` |
| `card-gap` | `12–16px` antar card `[TERLIHAT]` |
| `card-padding` | `16–20px` dalam card `[TERLIHAT]` |
| `chip-gap` | `8px` wrap `[ESTIMASI]` |
| `border` | `1px solid border` `[TERLIHAT]`; divider dalam card `1px dashed border` `[TERLIHAT]` |
| `shadow-card` | `0 1px 2px rgba(16,24,40,.04)` `[ESTIMASI, verifikasi]` — nyaris tak terlihat |
| `shadow-nav` | `0 8px 24px rgba(16,24,40,.10)` `[ESTIMASI]` — hanya BottomNav floating |
| `z-header` / `z-bottomnav` / `z-fab` | `30 / 40 / 50` `[USULAN]` |

## 4. Layout & Responsiveness

- Basis `360–430px` `[TERLIHAT]`; container `max-w-[430px]` centered di desktop `[TERLIHAT]`.
- `page-padding 16px`; `section-gap 24px`; `card-gap 12–16px`.
- Kanvas + luar container tetap putih, tidak ada krem `[TERLIHAT]`.
- Safe area: `env(safe-area-inset-*)` di header bawah/nav `[USULAN]`.
- Ruang aman bawah: `padding-bottom ≥ 96–112px` untuk BottomNav floating + FAB `[USULAN]`.
- Larangan: tidak ada horizontal scroll di body (cek 360px); konten teks tidak full-bleed, selalu di dalam card.

## 5. Card System

### 5.1 Filosofi card

- Halaman = kanvas putih `#FFFFFF`. Konten dikelompokkan dalam card, tidak ada baris teks lepas di atas background.
- Label section (`muted 12–13px/600`) + aksi hijau kanan (`14px/700`, "Lihat Semua" / "Edit Minat") berada DI LUAR card, di atasnya.
- Satu card = satu entitas/grup/ide. Maksimal 1 level: DILARANG card di dalam card (pakai divider dashed, chip, atau tile).
- Hijau hanya untuk aksi, status positif, aksen.
- Pengecualian `[TERLIHAT]`: bodi instruksi panjang (Detail Tugas) dan grup chip minat tampil sebagai teks/chip langsung di kanvas — bukan di dalam card.

### 5.2 Anatomi dasar

| Properti | Nilai |
|---|---|
| Surface | `#FFFFFF` `[TERLIHAT]` |
| Border | `1px solid #E8ECE9` `[ESTIMASI]` |
| Radius | `20–24px` `[TERLIHAT]` |
| Shadow | `0 1px 2px rgba(16,24,40,.04)` `[ESTIMASI]` |
| Padding | `16–20px` `[TERLIHAT]` |
| Lebar | lebar konten (page `16px` kiri-kanan), tidak full-bleed `[TERLIHAT]` |

### 5.3 Katalog varian

Format tiap varian: kapan dipakai | anatomi atas→bawah | ukuran/warna/radius | state | contoh copy | referensi.

#### Hero Card

- Dipakai: sapaan + ringkasan utama di Beranda tiap role.
- Anatomi: label muted 12px → judul 20–22px/800 → sub 14px muted → visual/progress atau stat pill row.
- Warna: gradient halus hijau-muda `#EAF5ED → #FFFFFF` `[ESTIMASI]`; radius 20–24px; padding 20px.
- State: default tampil; pressed tidak ada (bukan tombol); versi loading = skeleton card.
- Copy: "Kantinmu hari ini" / "3 porsi aktif · 5 menunggu pickup".
- Ref: Beranda Siera `[TERLIHAT]`.

#### Banner Info Card

- Dipakai: info perlu aksi cepat (verifikasi, jadwal, pengumuman penting).
- Anatomi: ikon lonceng dalam lingkaran putih 40px kiri → judul 14px/700 + deskripsi 13px → 2 tombol (primary + secondary) → ikon dismiss kanan-atas 24px.
- Warna: bg `primary-soft #DCEBE0`; radius 20px; padding 16px.
- State: default; dismissed hilang (persist per user `[USULAN]`).
- Copy: "Verifikasi kantinmu — unggah surat keterangan sebelum Jumat."
- Ref: Beranda Siera `[TERLIHAT]`.

#### Grouped List Card

- Dipakai: banyak baris homogen (reservasi, tugas, pesanan) dalam 1 card.
- Anatomi: N × ListRow, dipisah divider DASHED 1px. ListRow = icon-tile 40px/radius 12px + title 14–15px/600 + subtitle 12–13px muted + chevron 20px muted kanan.
- Warna: surface putih, border 1px, radius 20–24px. Tap row penuh, min tinggi 44px.
- State: default; pressed `opacity .7`; disabled tidak ada (pakai Disabled Card).
- Copy: "Nasi ayam geprek original ×6 — Dipesan 16.40 WIB".
- Ref: Beranda/Tugas Siera `[TERLIHAT]`.

#### Chip Container Card

- Dipakai: minat, filter, tag (banyak pilihan ringkas).
- Anatomi: section label + aksi ("Edit Minat") di atas → chip wrap LANGSUNG di kanvas (`gap 8px`, TANPA outer card `[TERLIHAT]`): emoji 14px + label 13px/500, pill bg `chip #F1F5F2` + border 1px `[ESTIMASI]`.
- Chip aktif: bg `primary-soft`, teks `primary-dark` `[USULAN]`.
- Copy: "🍗 Ayam geprek · 🍲 Soto · 🥘 Padang".
- Ref: Beranda Siera "Minat" `[TERLIHAT]`.

#### Entity Card

- Dipakai: satu entitas kaya (porsi, tugas, menu): Tugas Siera + "Porsi aktif" Tenant.
- Anatomi: header (ikon/thumbnail + judul 15–16px/700 + subtitle 13px muted + status pill kanan) → divider dashed → body (thumbnail 56–64px/radius 12px + detail berikon 13px) → footer (total/harga kiri 16px/800 hijau + tombol primary kanan).
- Radius 20–24px; padding 16px. Dipakai horizontal scroll-snap, card terpotong kanan sebagai hint.
- State: default; pressed tombol saja; stok habis → Disabled/Closed Card.
- Copy: "Nasi ayam geprek — Rp7.000 — sisa 4/20 — Kedaluwarsa 42 mnt — [Edit]".
- Ref: Tugas Siera + Dasbor Tenant `[TERLIHAT]`.

#### Announcement Card

- Anatomi: ikon lingkaran 40px (promo/merch = oranye-merah `[TERLIHAT]`, info resmi = hijau `[USULAN]`) → judul 14px/700 + tanggal 12px muted kanan → preview 2 baris (`line-clamp-2`) 13px.
- Unread = dot merah 8px kanan-atas `[USULAN]`; penting = border 1.5px `primary` `[USULAN]`.
- Copy: "Jadwal pickup berubah — 12 Agt — Slot sore maju ke 16.30…".
- Ref: Beranda Siera `[TERLIHAT]`.

#### Detail Header Card

- Dipakai: kepala halaman detail (Detail Tugas, detail porsi/pesanan).
- Anatomi: badge row ("Individu" + ikon orang kiri, "Ditutup" kanan `[TERLIHAT]`) → badge "Wajib" baris sendiri → judul 18–20px/800 (abu bila ditutup) → meta berikon 13px muted ("Buka 11 Agustus 2026, 09:00 WIB", "Tenggat 16 Agustus 2026, 23:55 WIB") → divider → countdown 13px rata kanan: hijau/700 bila aktif `[USULAN]`, muted bila sudah lewat ("Lewat 73 hari 22 jam" `[TERLIHAT]`).
- Radius 20–24px; padding 20px.
- Copy: "Tugas 3: Observasi kantin — Tenggat Min, 16 Agt, 23.55 — Lewat 73 hari 22 jam".
- Ref: Detail Tugas Siera `[TERLIHAT]`.

#### Collapsible Card

- Dipakai: deskripsi/instruksi panjang yang terpotong.
- Anatomi: header row (ikon + judul 16px/700 + chevron kanan, min 44px) → bodi TEKS LEPAS di kanvas (numbered list 14px/1.6, BUKAN dalam card `[TERLIHAT]`) → fade gradient putih bawah saat terpotong.
- Tap header toggle buka/tutup, min 44px. State: collapsed/expanded, chevron putar 180° `[USULAN]`.
- Copy: "Instruksi — [Lihat selengkapnya]".
- Ref: Detail Tugas Siera `[TERLIHAT]`.

#### Field Card

- Dipakai: fakta satuan (jam masak, sisa stok, omzet, NIM/kelas).
- Anatomi: icon-tile 40px + nilai 15–16px/800 + label 12px muted. Satu baris per fakta; deret horizontal bila 2–3 fakta.
- Copy: "16.30 WIB — Jam masak".
- Ref: Detail Tugas/Profil Siera `[TERLIHAT]`.

#### Status/Alert Card

- Dipakai: sukses/warning/danger satu pesan.
- Anatomi: ikon 20px + teks 14px/600. Sukses bg `mint`; warning bg `warning-soft`; danger bg `danger-soft`. Radius 16px; padding 12–16px.
- Copy: "Pickup dikonfirmasi — 5 porsi terselamatkan." / "Kedaluwarsa 4 mnt — segera tutup."
- Ref: Detail Tugas Siera `[TERLIHAT]`; warna `[ESTIMASI]`.

#### Settings Card

- Dipakai: pengaturan/profil yang bisa diubah.
- Anatomi: ikon 20px + judul 14px/700 + status kanan + deskripsi 13px muted + toggle `44×26px` + tombol bila perlu.
- Copy: "Notifikasi pesanan — Aktif — Ingatkan saat ada reservasi baru."
- Ref: Profil Siera `[TERLIHAT]`; ukuran toggle `[USULAN]`.

#### Stat Pill/Card

- Dipakai: angka ringkas (porsi aktif, pickup, omzet).
- Anatomi: ikon 18–20px + angka 16–18px/800 + label 11–12px muted. Baris horizontal scroll bila >3.
- Ukuran card ~110–130px lebar `[ESTIMASI]`; radius 16–20px.
- Copy: "5 — Menunggu pickup" / "Rp84rb — Omzet".
- Ref: Beranda Siera + Dasbor Tenant `[TERLIHAT]`.

#### Empty Card

- Dipakai: belum ada isi; DILARANG garis pemisah tanpa isi.
- Anatomi: border DASHED 1.5px, radius 20px, teks muted 14px tengah + tombol aksi.
- Copy: "Belum ada porsi aktif. — [Posting sisa masakan]".
- Ref: — `[USULAN]` pola (kondisi kosong ada di Tenant sekarang sebagai teks lepas = SALAH).

#### Disabled/Closed Card

- Dipakai: tugas/porsi ditutup atau habis.
- Anatomi: isi sama Entity Card tapi opacity ~60% + badge "Ditutup" abu; tidak bisa tap.
- Copy: "Tugas 1 — Ditutup".
- Ref: Tugas Siera `[TERLIHAT]`; opacity `[ESTIMASI]`.

#### Danger Action Card

- Dipakai: aksi destruktif; HANYA di Profil.
- Anatomi: tile `danger-soft` 40px/radius 12px + ikon merah + teks merah 14px/700 ("Keluar", "Hapus akun").
- Copy: "Keluar".
- Ref: Profil Siera `[TERLIHAT]`.

### 5.4 Aturan komposisi

- Baris berulang mirip WAJIB 1 Grouped List Card atau gabung counter ("Nasi ayam geprek original ×6"). DILARANG 6 baris identik tanpa card.
- List panjang: maks 3–5 item + "Lihat Semua".
- Status sama untuk semua item → pindah ke label section, tidak diulang per baris.
- Tiap card satu aksi utama jelas; tidak ada card/baris mati.
- Tap area penuh, min tinggi 44px, ada chevron atau tombol.
- Tombol primary dalam card maks 1, efek 3D (`border-bottom 3–4px primary-dark`, `active:translate-y-[2px]`) `[USULAN]`.
- Horizontal scroll: `scroll-snap-type:x mandatory`, tanpa scrollbar (`scrollbar-width:none`), padding kanan 16px.
- Urutan halaman: Header → Greeting/Hero → Banner → Section berlabel berisi card → BottomNav floating.

### 5.5 Pohon keputusan

| Jenis konten | Varian |
|---|---|
| Daftar homogen (reservasi, tugas, pesanan) | Grouped List Card |
| Satu entitas kaya (menu, tugas, porsi) | Entity Card |
| Angka ringkas (stok, pickup, omzet) | Stat Pill/Card |
| Info perlu aksi cepat | Banner Info Card |
| Pengumuman | Announcement Card |
| Rincian/detail | Detail Header + Field + Collapsible |
| Input/pengaturan | Settings / Field Card |
| Belum ada isi | Empty Card (dilarang garis tanpa isi) |
| Aksi destruktif (hanya Profil) | Danger Action Card |

## 6. Component Specs (non-card)

- **AppHeader Siera**: kiri cluster logo 28px + tengah "Siera" italic hijau 18px + nama halaman bold hijau 18px + kanan ikon outline mail & bell 24px (tap min 44px); `h-60px`; putih; `border-b 1px` `[TERLIHAT]`. Varian Tenant: kiri logo + "Seporsi Terakhir" 16px/800 + kanan link "Profil" + ikon orang `[TERLIHAT]`. Varian detail: tombol back 44px kiri + judul terpotong ("Detail T…") `[TERLIHAT]`.
- **SearchBar**: input pill `h-48px` radius full bg `chip`, ikon kaca 20px muted + placeholder "Cari tugas" 14px + tombol filter outline 48px terpisah kanan `[TERLIHAT bentuk, ESTIMASI warna]`; di bawahnya label hitungan "13 tugas · Jalur SNBT" 12px muted `[TERLIHAT]`.
- **BottomNav**: 5 tab; ikon outline 24px + label 11px/600; aktif `primary`, nonaktif `muted`. Screenshot Siera = bar full-width `border-t 1px` `[TERLIHAT]`; target redesign = floating (container putih radius 24px, margin 12–16px, shadow-nav) `[USULAN]`.
- **WhatsApp FAB**: lingkaran hijau 56px, glyph WA putih 28px, kanan-bawah di atas nav, z 50; tampil di Beranda/Tugas/Profil `[TERLIHAT]`.
- **Chip/Pill**: `h-32px`, padding `8–12px`, radius full, bg `chip`, teks 13px/500; aktif bg `primary-soft` + teks `primary-dark`.
- **Status Badge**: `Wajib` = bg `primary-soft` + teks `primary-dark`; `Individu` = bg chip + teks muted; `Ditutup` = bg abu solid `#E5E7EB` + teks `#6B7280` `[ESTIMASI]`; `Opsional` = outline border; `Mentee` = bg ungu-muda `#EDE9FE` + teks `#5B21B6` `[ESTIMASI]`; `Warning` = bg `warning-soft` + teks `warning`. Font 11–12px/700, radius full, padding `4–10px`.
- **SectionHeader**: label kiri muted 12–13px/600 + aksi kanan hijau 14px/700 ("Lihat Semua", "+ Tambah"); tidak wrap.
- **Button Primary 3D**: `h-48px`, radius 14–16px, bg `primary`, teks putih 15px/700, `border-bottom 3–4px primary-dark`; maks 1 per card `[USULAN efek 3D]`.
- **Button Secondary**: `h-44–48px`, putih, border 1px, teks 14px/700.
- **Toggle**: `44×26px`, on = `primary`, off = abu `#D1D5DB` `[ESTIMASI]` `[USULAN]`.
- **Avatar Profil**: lingkaran 64–72px + nama 18px/800 + NIM/kelas 13px muted. Ref: Profil Siera `[TERLIHAT]`; ukuran `[ESTIMASI]`.
- **ProgressPath**: jalur/timeline vertikal + aset 3D di simpul selesai; hanya pemanis progres, bukan navigasi. Ref: Beranda Siera `[TERLIHAT]`.

## 7. Page Blueprints

### Beranda (Siera)

Urutan atas→bawah `[TERLIHAT]`: AppHeader (logo + "Siera Beranda" + mail & bell) → sapaan "Halo, [Nama]" 20px/800 + chip info ("Kelompok 73", "Jalur SNBT") → Banner Info Card ("Aktifkan Notifikasi Pengumuman", tombol "Nanti Saja" + "Lihat Pandu…") → Progress Card ("Jalur PATRIBERA" + visual 3 simpul + stat pill "12/13 tugas terkirim", "34 teman") → Section "Agenda 7 hari" + "Kalender" + teks kosong ("Tidak ada kegiatan atau mentoring dalam 7 hari ke depan") → Section "Pengumuman" + "Lihat Semua" → Announcement Card (1 per berita, ikon promo oranye) → Section "Pesanan Saya" + "Lihat Semua" → Entity Card horizontal scroll-snap (thumbnail + judul + varian + total kiri + "Beli Lagi" kanan, card terpotong kanan) → BottomNav + FAB.

### Tugas

Urutan `[TERLIHAT]`: AppHeader ("Siera Tugas" + mail & bell) → SearchBar ("Cari tugas" + filter) → label hitungan "13 tugas · Jalur SNBT" → Section "Selesai 12" → Grouped List rows (tile checklist hijau-mint 40px/radius 12 + judul 14px/600 + sub "Tenggat Min, 16 Agt, 23.55" berikon jam + chevron) → Section "Ditutup 1" → Disabled row (tile abu + sub 2 baris + "Opsional") → BottomNav + FAB.

### Detail Tugas

Urutan `[TERLIHAT]`: back header + judul terpotong ("Detail T…") + bell → Detail Header Card (badge row "Individu / Ditutup" + "Wajib" + judul abu + "Buka…" + "Tenggat…" + countdown muted kanan "Lewat 73 hari 22 jam") → header "Instruksi Tugas" + bodi TEKS LEPAS (numbered list, fade bawah) → header "Pengumpulan Tugas" → Field Card link ("https://docs.google.com/…", "Link pengumpulan") → Field Card catatan ("Belum ada catatan.") → Status/Alert Card sukses ("Kerja bagus! Tugas kamu telah diterima oleh mentor.").

### Profil

Urutan `[TERLIHAT]`: AppHeader ("Siera Profil" + mail & bell) → avatar foto lingkaran + nama 18px/800 + chip row ("Mentee", "Kelompok 73", "Fakultas Ilmu Komputer") — SEMUA lepas di kanvas, bukan card → Section "Ketertarikan" + "Edit Minat" → chip wrap lepas (tanpa outer card) → Section "Akun" → Grouped List Card 2 row ("Edit Profil", "Pengaturan Akun") → Section "Bantuan" → Grouped List Card 1 row ("Panduan SIERA") → Section "Notifikasi" → Info Card (ikon lonceng-off + "Notifikasi Belum Aktif" + tombol primary full-width "Lihat Panduan Perangkat") → Danger Action Card ("Keluar", tile merah-muda) → BottomNav + FAB.

## 8. Role Dashboards

Aturan baku (dasbor lama SALAH bila: header polos, list panjang tanpa card, nav teks di bawah konten, background krem):

- Struktur: Greeting + chip konteks → Stat Cards (2–3, scroll horizontal jika >3) → aksi utama → section berlabel berisi card → BottomNav.
- Navigasi antar fitur role WAJIB BottomNav floating maks 5 tab, bukan teks di bawah konten.
- Aksi utama (mis. "Scan pickup") = tombol primary full-width, bukan di samping judul section.
- Judul section tidak boleh wrap; aksi sekunder pindah ke SectionHeader kanan.
- Item peringatan ("Kedaluwarsa 4 mnt") = badge warning amber dalam card.
- "Edit" = tombol secondary atau ikon 44px. "Keluar" dipindah ke Profil sebagai Danger Action Card.
- Item kosong/bug render (garis pemisah tanpa isi) dilarang; wajib Empty Card.
- Background putih, tidak ada krem.

### Dasbor Tenant (blueprint lengkap, dari screenshot Tenant)

Header (logo + "Seporsi Terakhir" + ikon profil) → Greeting "Kantinmu hari ini" + chip tenant → 3 Stat Cards (Porsi aktif | Pickup | Omzet) → Button primary full-width "Scan Pickup" → Section "Menunggu pickup (5)" + "Lihat Semua" + Grouped List Card → Section "Porsi aktif" + "+ Tambah" + Entity Card (nama, harga hijau bold, sisa stok, badge warning, tombol Edit) → BottomNav (Beranda, Pesanan, Menu, Scan, Profil).
- Catatan data contoh `[TERLIHAT]`: subheader "0 porsi aktif · 3 pickup · Rp 15.000" vs 5 reservasi terdaftar — angka tidak konsisten, wajar untuk data dummy.
- "Reservasi menunggu pickup (5)" wrap 2 baris + tombol di kanan = SALAH (pelanggaran §8: judul wrap); badge "Menunggu pickup" diulang per baris = SALAH (1 status cukup di label section).
- "Edit" tampil sebagai teks polos = SALAH (harusnya Button Secondary min 44px); "Kelola menu / Pesanan masuk" sebagai teks + "Keluar dari akun" outline merah di bawah konten = SALAH (harusnya BottomNav + Danger Action di Profil).


### Dasbor Admin `[USULAN]`

Chip "Pilot Kampus" → 3 Stat Cards (Porsi terselamatkan | Tenant aktif | Omzet tenant) → Button primary "Unduh laporan" → Section "Persetujuan tenant" + "Lihat Semua" + Grouped List Card → Section "Dampak minggu ini" + Entity Card → BottomNav (Beranda, Tenant, Laporan, Kegiatan, Profil).

### Dasbor Mentor `[USULAN]`

Chip "Kelompok N" → 3 Stat Cards (Mentee | Tugas selesai | Perlu review) → Button primary "Review tugas" → Section "Pengumpulan baru" + "Lihat Semua" + Grouped List Card → Section "Pengumuman" + Announcement Card → BottomNav (Beranda, Mentee, Tugas, Pengumuman, Profil).

### Dasbor Student/Mahasiswa `[USULAN]`

Chip kampus → Hero Card (sisa kuota + pickup berikutnya) → Button primary "Lihat katalog" → Section "Pesanan aktif" + Grouped List Card → Section "Katalog sore ini" + Entity Card scroll-snap → BottomNav (Beranda, Katalog, Pesanan, QR, Profil).

## 9. Iconography & Imagery

- Outline stroke 1.5–2px, satu library: `lucide-react` (aturan repo) `[TERLIHAT gaya, USULAN library]`.
- Emoji hanya di chip (🍗🍲), tidak di tombol/ikon navigasi.
- Aset 3D hanya di ProgressPath; foto makanan hanya thumbnail 56–64px/radius 12px.
- Logo header 28px kiri; ikon profil 40px kanan.

## 10. Interaction & Motion

- Pressed: `scale .98 / opacity .7`, durasi 120–180ms `[USULAN]`.
- Transisi warna saja untuk hover/focus; tidak ada bounce/parallax.
- Skeleton loading BERBENTUK CARD (bukan baris teks) `[USULAN]`.
- Scroll-snap horizontal untuk Entity/Stat row; tanpa scrollbar.
- Hormati `prefers-reduced-motion`: animasi mati.

## 11. Content & Copywriting

- Label section: "Menunggu pickup (5)", "Porsi aktif", "Tugas Wajib" — hitungan dalam kurung.
- Status: Wajib / Individu / Ditutup / Opsional / Mentee / Warning — via Status Badge, tidak diulang per baris bila sama.
- Countdown: "Lewat 73 hari 22 jam" / "Kedaluwarsa 4 mnt" (warning bila <60 mnt).
- Tanggal: "Tenggat Min, 16 Agt, 23.55".
- Sukses: "Pickup dikonfirmasi — 5 porsi terselamatkan." Kosong: "Belum ada porsi aktif. Posting sisa masakan hari ini." Error: "Gagal memuat. Coba lagi."

## 12. Do & Don't

| Do | Don't |
|---|---|
| Satu card = satu ide, maks 1 level | Card di dalam card |
| Semua konten dalam card | Baris teks lepas di background |
| Shadow `0 1px 2px` nyaris tak terlihat | Shadow tebal / glow |
| Gradient hanya hero halus hijau-muda→putih | Gradient berat / dekoratif |
| Satu aksen hijau | Lebih dari satu aksen warna |
| Ikon outline 1.5–2px satu library | Ikon filled + outline campur |
| Status sama → label section | Status sama diulang per baris |
| Baris mirip → 1 Grouped Card / counter "×6" | 6 baris identik tanpa card |
| Nav di BottomNav floating 5 tab | Nav sebagai teks di bawah konten |
| Background putih | Background krem |
| Maks 1 tombol primary per card | Dua tombol primary dalam 1 card |
| Tiap card ada aksi (chevron/tombol) | Card/baris mati tanpa aksi |
| Judul section 1 baris, aksi di kanan | Judul section wrap 2 baris |
| Aksi utama full-width di bawah stat | Aksi utama di samping judul |
| Kosong → Empty Card dashed + tombol | Garis pemisah tanpa isi |
| "Keluar" hanya di Profil | "Keluar"/logout di tengah dasbor |

## 13. Accessibility

- Kontras teks ≥4.5:1 (muted `#64746B` di putih = lolos AA untuk 12px+ bold; body 14px aman).
- Touch target ≥44px umum, ≥48px aksi primer.
- Focus: ring hijau 2px `outline 2px solid #2E7D4F` `[USULAN]`.
- Teks min 14px body; 11–12px hanya label/badge muted.
- Jangan mengandalkan warna saja — selalu ada ikon + teks status.

## 14. QA Checklist per Halaman (wajib dicek agent)

- [ ] Tidak ada baris teks lepas di background — semua dalam card.
- [ ] Tidak ada card di dalam card (divider dashed/chip/tile sebagai gantinya).
- [ ] Radius, border, padding sesuai token (§3).
- [ ] Tiap card punya aksi jelas, touch target ≥44px.
- [ ] Tidak ada horizontal scroll di body (cek 360px).
- [ ] Loading (skeleton card), empty, error ada.
- [ ] Fungsi lama tetap jalan (logika/routing/API tidak berubah).
- [ ] Dibandingkan ke screenshot, selisih dicatat.

## 15. Implementation Notes untuk Agent

- Ini REDESIGN lapisan tampilan: logika, routing, API, state, tipe data tidak boleh berubah.
- Selalu pakai token §3; selalu lewat 1 komponen Card (prop `variant` per §5.3); jangan copy-paste markup antar halaman.
- Jangan install library UI baru; `lucide-react` + Tailwind + shadcn cukup.
- Cek file ini sebelum bikin UI apa pun. Bug di luar scope dicatat, bukan diperbaiki.
- Konflik screenshot-vs-teks → screenshot menang.
- Urutan kerja: Audit → Tokens + komponen Card → migrasi halaman satu per satu (pilot Dasbor Tenant) → QA §14.
- Eksekusi di branch baru `dev-redesign` (dibuat saat eksekusi, bukan saat nulis dokumen ini).

---

## Hal yang perlu gua verifikasi

- Font asli Siera (Inter vs lain) — cek file font/DevTools.
- Hex asli (color picker): `border`, `chip`, `mint`, `warning`, `danger-soft`, gradient hero, badge Mentee/Ditutup.
- Aset logo header + aset 3D ProgressPath (minta file asli).
- Copy final tiap role (nama section, tab BottomNav, label chip).
- Butuh WhatsApp FAB di halaman mana saja.
- Daftar fitur admin/mentor `[USULAN]` — coret/tambah sebelum eksekusi.

---

## 16. Referensi Screenshot (cek visual)

> File lokal, bukan URL. Bandingkan tiap halaman redesign lawan file ini. Beda → screenshot menang.

| Halaman | File | Isi kunci |
|---|---|---|
| Beranda | `docs/siera-ref/homepage.jpeg` | header Siera, sapaan, banner notif, progress, agenda, pengumuman, pesanan, FAB |
| Tugas | `docs/siera-ref/list-tugas.jpeg` | search, Selesai 12, Ditutup 1, chevron rows |
| Detail Tugas | `docs/siera-ref/detail-tugas.jpeg` | badge Individu/Wajib/Ditutup, countdown, instruksi lepas, link + catatan, alert sukses |
| Profil | `docs/siera-ref/profil.jpeg` | avatar + chip Mentee lepas, chip minat lepas, Akun, Bantuan, notifikasi, Keluar |

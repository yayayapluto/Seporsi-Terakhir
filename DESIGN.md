---
name: Porsi Terakhir
description: Papan tulis kantin — porsi sisa transparan, harga rescue jujur, tanpa dekorasi.
colors:
  daun-kantin: "#2E7D4F"
  daun-tua: "#1E5A36"
  daun-muda: "#DCEBE0"
  harga-kapur: "#F28C28"
  kanvas: "#FFFBF5"
  kertas: "#FFFFFF"
  tinta: "#1C2826"
  abu-tinta: "#64746B"
  abu-kertas: "#F4EFE6"
  garis: "#E5E1D8"
  bahaya: "#BA1A1A"
  putih: "#FFFFFF"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.daun-kantin}"
    textColor: "{colors.putih}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.daun-tua}"
  button-secondary:
    backgroundColor: "{colors.kertas}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Design System: Porsi Terakhir

## Overview

**Creative North Star: "Papan Tulis Kantin"**

Sistem ini terlihat seperti papan menu kapur di depan kantin: daftar bergaris tegas, harga ditulis tebal, stok jujur apa adanya. Tidak ada kartu mengambang, tidak ada foto, tidak ada gradien — setiap piksel menjelaskan satu keputusan: menu apa, sisa berapa, jam masak kapan, harga berapa.

Nada visual jujur dan hemat, bukan amal. Anti-referensi yang dikonfirmasi: kaca/glassmorphism, gradien dekoratif, ikon-tile, kartu-dalam-kartu, pil berlebihan, ilustrasi amal. Mode terang saja; bahasa Indonesia.

**Key Characteristics:**

- Tabel/daftar bergaris dulu, kartu hanya sebagai kertas datar bila perlu.
- Garis 2px sebagai pemisah bab; garis 1px sebagai pemisah baris.
- Harga rescue selalu oranye kapur, tidak dipakai untuk hal lain.
- Satu layar, satu keputusan: landing persuasi, masuk nol friksi, katalog kecepatan.

## Colors

Kanvas hangat kertas kantin, tinta pekat, satu hijau daun untuk aksi, satu oranye kapur hanya untuk harga rescue.

### Primary

- **Hijau Daun Kantin** (#2E7D4F): satu-satunya warna aksi — tombol primer, kicker label, ikon logo, ring fokus. Hover menggelap ke #1E5A36.
- **Hijau Daun Tua** (#1E5A36): teks di atas latar hijau muda + status hover tombol primer.
- **Hijau Daun Muda** (#DCEBE0): latar badge/pil status (mis. "Pilot Kampus"), teks selalu Daun Tua di atasnya.

### Secondary

- **Oranye Kapur Harga** (#F28C28): hanya angka harga rescue/diskon. Tidak untuk tombol, ikon, atau dekorasi.

### Tertiary

- Omit — proyek hanya punya satu aksen harga di luar hijau primer.

### Neutral

- **Kanvas Kertas** (#FFFBF5): latar halaman.
- **Kertas Putih** (#FFFFFF): latar kartu/popover/header.
- **Tinta** (#1C2826): teks utama + garis tebal 2px.
- **Abu Tinta** (#64746B): teks sekunder/muted.
- **Abu Kertas** (#F4EFE6): latar muted/hover netral.
- **Garis Kapur** (#E5E1D8): border 1px, divider, input.
- **Merah Bahaya** (#BA1A1A): hanya error/destruktif dengan latar merah 10%.

### Named Rules

**The One Orange Rule.** Oranye Kapur Harga muncul hanya pada angka harga rescue. Tombol, ikon, badge tidak boleh oranye.
**The Flat Paper Rule.** Latar hanya Kanvas atau Kertas. Tidak ada gradien, tidak ada kaca/blur dekoratif (blur header sticky untuk keterbacaan dikecualikan).

## Typography

**Display Font:** Plus Jakarta Sans (with Inter fallback)
**Body Font:** Inter (with system-ui fallback)

**Character:** Heading ekstra-tebal dan rapat untuk nada papan tulis; body Inter netral 1.6 untuk keterbacaan satu tangan di HP.

### Hierarchy

- **Display** (800, 1.875rem/30px mobile → 3xl desktop, 1.1, -0.02em): H1 halaman — "Porsi hari ini", hero landing.
- **Headline** (800, 1.5rem, 1.2): H2 seksi landing/CTA.
- **Title** (700, 1.125rem, 1.3): nama menu, judul baris masalah/langkah.
- **Body** (400, 0.875rem, 1.6): deskripsi, tenant, jam masak. Panjang baris santai, kartu sempit.
- **Label** (700, 0.75rem, 0.08em, uppercase): kicker seksi ("KATALOG PORSI TERAKHIR"), header kolom papan menu.

### Named Rules

**The Chalk-Price Rule.** Harga selalu Title/Display tebal, harga normal dicoret kecil abu-abu di sebelahnya. Jam masak tidak pernah lebih kecil dari label sekunder.

## Layout

Kontainer sempit tengah: `max-w-6xl` umum, `max-w-md` untuk alur masuk; padding `px-4 sm:px-6`, vertikal `py-8–py-12`. Landing satu kolom daftar penuh; seksi dipisah garis 2px, bukan kartu. Katalog: header + daftar baris (nama+tenant+jam+sisa | harga+Kunci), filter tenant di atas daftar. Responsif: satu kolom HP, 2–3 kolom hanya untuk baris Masalah/Langkah/Keamanan di desktop. Ritme spasi Tailwind 4/6/8/12.

## Elevation & Depth

Flat total, garis batas saja. Tidak ada shadow di sistem. Kedalaman disampaikan lewat garis (2px bab, 1px baris) dan lapisan tonal (Kanvas → Kertas → Abu Kertas). Header sticky memakai `bg-card/90 backdrop-blur` hanya agar teks terbaca saat scroll, bukan sebagai efek kaca dekoratif.

## Shapes

Radius kecil dan tegas: sm 0.3rem, md 0.4rem (tombol, input, badge), lg 0.5rem (kartu), xl 0.7rem (skala token, jarang dipakai). Logo memakai kotak radius md berisi ikon Recycle. Bahasa bentuk: blok persegi ramah + garis tegas; sudut tajam penuh hanya untuk papan menu bila dibutuhkan, bukan default.

## Components

Karakter: tegas dan murah hati — tombol blok penuh, garis 2px, tanpa bayangan.

### Buttons

- **Shape:** radius md (0.4rem).
- **Primary:** latar Hijau Daun Kantin, teks putih, padding 12px 24px, semibold. Hover: #256640/#1E5A36. Target sentuh ≥44px di alur utama.
- **Hover / Focus:** transisi warna saja; fokus memakai ring hijau 50%.
- **Secondary:** latar Kertas, border Garis Kapur 1px, teks Tinta; hover Abu Kertas.

### Chips

- **Style:** pil kecil latar Daun Muda, teks Daun Tua semibold 11px (mis. "Pilot Kampus").
- **State:** status stok ("Sisa 3") berupa teks semibold biasa, bukan pil menutupi angka.

### Cards / Containers

- **Corner Style:** lg (0.5rem).
- **Background:** Kertas Putih di atas Kanvas.
- **Shadow Strategy:** tidak ada; lihat Elevation.
- **Border:** Garis Kapur 1px; pemisah bab memakai Tinta 2px.
- **Internal Padding:** 16–24px.

### Inputs / Fields

- **Style:** latar Kertas, border Garis Kapur 1px, radius md.
- **Focus:** border/ring Hijau Daun Kantin.
- **Error / Disabled:** border Merah Bahaya + latar merah 10% + `role="alert"`; teks error merah 14px.

### Navigation

- **Style:** header sticky h-14, border-b Garis Kapur. Link nav 14px abu → hover latar Abu Kertas + teks Tinta, radius lg. Mobile: nav utama disembunyikan (lg:flex), hanya aksi akun + CTA Masuk. Footer tiga kolom → satu kolom di HP.

### Papan Menu (signature component)

Daftar bergaris: header kolom label uppercase kecil; tiap baris nama menu tebal + tenant + jam masak + sisa di kiri, harga coret + harga rescue oranye + tombol Kunci di kanan. Baris habis tetap tampil sebagai habis, tidak dihilangkan.

## Do's and Don'ts

### Do:

- **Do** pakai Oranye Kapur Harga hanya untuk angka harga rescue.
- **Do** tampilkan jam masak dan sisa kuota di setiap baris katalog/landing.
- **Do** pisahkan seksi landing dengan garis Tinta 2px.
- **Do** pertahankan kontras teks ≥4.5:1 dan target sentuh ≥44px di alur utama.
- **Do** pakai blok skeleton netral untuk slot foto sampai foto asli disediakan (tanpa hotlink eksternal).

### Don't:

- **Don't** menambah gradien, kaca, glow, kartu-dalam-kartu, atau ikon-tile dekoratif.
- **Don't** memakai oranye untuk tombol, ikon, atau badge.
- **Don't** menghilangkan baris habis secara diam-diam.
- **Don't** memalsukan foto, testimoni, atau angka dampak — angka sintetis wajib diganti data serah terima QR nyata.
- **Don't** menambah dependensi/desain gelap tanpa justifikasi di `docs/decisions.md`.

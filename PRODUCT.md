# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Mahasiswa**: lapar, di kampus, jalan kaki. Pekerjaan: menemukan porsi sisa layak makan yang murah, mengunci kuota, ambil dengan QR, bayar di tempat (tunai/QRIS). Satu akun, login Google saja.
- **Tenant kantin (opt-in, disetujui admin)**: memposting porsi sisa maksimal 3 ketukan (menu, jumlah, jam masak; harga diskon tersugesti otomatis), memindai QR pembeli saat serah terima.
- **Admin (BEM/unit kampus)**: memantau dampak + unduh laporan.

## Product Purpose

Porsi Terakhir mempertemukan tenant kantin yang menjual sisa makanan layak makan dengan harga diskon dan mahasiswa yang butuh makan murah — setiap sore, tanpa ongkir, tanpa pembayaran di aplikasi. Sukses = porsi terselamatkan tercatat sebagai data dampak terverifikasi (SDG 12), bukan tampilan amal atau dashboard ESG.

## Positioning

Satu-satunya mekanisme yang tidak bisa ditiru tetangga: jendela jual 120–240 menit pasca-masak (default 180) yang ditegakkan server-side, jam masak wajib terlihat pembeli, dan serah terima QR fisik yang menjadi data dampak. Sistem tidak memproses pembayaran — pembayaran selalu di gerai.

## Operating Context

Kantin kampus sore hari (jendela ambil ~16.30–18.30 WIB), satu tangan memegang HP, koneksi kampus yang kadang lambat. Bahasa antarmuka Indonesia. Mode terang saja. Waktu dalam WIB, mata uang IDR integer.

**Mobile-first (keputusan 2026-10-29):** layout dirancang dari 360px ke atas, bukan desktop yang dikecilkan. Semua alur inti (mahasiswa: katalog → pesan → QR; tenant: posting → pindai; admin: pantau) wajib selesai satu tangan — CTA primer dalam jangkauan jempol (sticky bottom bar bila perlu), target sentuh ≥48px di aksi primer, tanpa hover sebagai satu-satunya affordance. Perangkat campur (Android murah–iPhone, data lambat–WiFi): gambar lazy + skeleton netral, tanpa dependensi berat baru. Sinyal hilang di tengah aksi: cegah pesan ganda (disable saat `ordering`, idempoten server-side) dan tampilkan status jelas (loading/error/empty eksplisit, bukan layar diam).

## Brand Commitments

Nama "Porsi Terakhir", palet hijau `#2E7D4F` + aksen kuliner `#F28C28` + kanvas `#FFFBF5`, Plus Jakarta Sans (heading) + Inter (body). Nada: hemat cerdas dan tepercaya, bukan amal. Keputusan terkunci 2026-10-28: arah visual "Papan Tulis Kantin" untuk ketiga layar (landing, masuk, katalog).

## Evidence on Hand

Tidak ada foto, testimoni, atau data nyata. Semua angka porsi/pengguna dalam desain adalah sintetis dan wajib diganti data nyata. Copy Indonesia yang sudah ada di `src/app` dipertahankan kecuali disederhanakan oleh arah baru.

## Product Principles

1. Satu layar, satu keputusan: persuasi di landing, nol friksi di masuk, kecepatan di katalog.
2. Transparansi pangan dulu, estetika kemudian: jam masak dan alergen tidak pernah dikorbankan untuk tampilan.
3. Kejujuran stok: habis ditampilkan sebagai habis, tidak dihilangkan diam-diam.
4. Setiap piksel earned: tanpa dekorasi (gradien, kaca, ikon-tile, kartu-dalam-kartu, pil berlebihan).
5. Bukti di atas klaim: angka dampak hanya dari data serah terima QR nyata.

## Accessibility & Inclusion

WCAG AA: kontras teks ≥4.5:1, navigasi keyboard penuh, hierarki heading benar, hormati `prefers-reduced-motion`, target sentuh ≥44px umum dan ≥48px di aksi primer mobile (keputusan 2026-10-29).

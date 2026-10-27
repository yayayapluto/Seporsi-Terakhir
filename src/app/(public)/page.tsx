import {
  Banknote,
  BookOpenCheck,
  CalendarClock,
  Footprints,
  Leaf,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { SectionReveal } from "@/components/reveal";
import { HeroMotion } from "./hero-motion";

const HERO_ITEMS = [
  {
    name: "Nasi Ayam Geprek Sambal Bawang",
    tenant: "Kantin Bu Sri (Kantin Barat)",
    left: "Sisa 3 porsi",
    cooked: "Dimasak 15.30",
    quota: "Kuota 75%",
    bar: "w-3/4",
    normal: "Rp 16.000",
    price: "Rp 8.500",
    hot: true,
  },
  {
    name: "Soto Ayam Lamongan Komplit",
    tenant: "Warung Barokah (Pujasera Utama)",
    left: "Sisa 2 porsi",
    cooked: "Dimasak 15.45",
    quota: "Kuota 80%",
    bar: "w-4/5",
    normal: "Rp 14.000",
    price: "Rp 7.000",
    hot: true,
  },
  {
    name: "Paket Nasi Sayur + Telur Balado",
    tenant: "Kantin Melati",
    left: "Sisa 4 porsi",
    cooked: "Dimasak 16.00",
    quota: "",
    bar: "",
    normal: "Rp 12.000",
    price: "Rp 6.000",
    hot: false,
  },
];

const WHY = [
  {
    icon: Store,
    title: "Tenant Kantin",
    body: "Makanan matang yang masih layak sering terbuang di akhir hari dan jadi kerugian finansial harian karena pembeli sore sepi.",
  },
  {
    icon: Wallet,
    title: "Mahasiswa",
    body: "Uang saku terbatas, apalagi menjelang akhir bulan dan sore hari setelah praktikum. Opsi makan murah berkualitas itu sangat penting.",
  },
  {
    icon: Leaf,
    title: "Kampus Berkelanjutan",
    body: "Belum ada data riil berapa banyak makanan kantin yang terbuang setiap harinya untuk laporan audit inisiatif green campus.",
  },
];

const STUDENT_STEPS = [
  {
    icon: BookOpenCheck,
    title: "Buka katalog",
    body: "Lihat menu siap selamatkan, harga diskon langsung, sisa kuota porsi, dan jam masak yang transparan.",
  },
  {
    icon: QrCode,
    title: "Pesan & Kunci Kuota",
    body: "Pilih porsi favoritmu, langsung dapat kode reservasi QR dan slot waktu pickup sore sebelum kantin tutup.",
  },
  {
    icon: Banknote,
    title: "Ambil & Bayar",
    body: "Datang langsung ke tenant kantin tujuan, bayar santai dengan uang pas tunai atau scan QRIS tenant.",
  },
  {
    icon: ScanLine,
    title: "Scan QR Selesai",
    body: "Pickup tercatat otomatis dan kontribusi penyelamatan porsi masuk ke lencana badge pribadi profilmu.",
  },
];

const FOOD_SAFETY = [
  {
    title: "Hanya makanan matang yang layak simpan",
    body: "Tidak menerima makanan berkuah santan yang rawan basi atau makanan mentah. Prioritas pada olahan nasi, lauk goreng/bakar, dan tumisan segar.",
  },
  {
    title: "Batas jual 2–4 jam setelah masak",
    body: "Batas waktu spesifik disepakati bersama tenant sesuai jenis makanan untuk menjamin kualitas rasa dan higienitas tetap terjaga.",
  },
  {
    title: "Jam masak selalu terlihat pembeli",
    body: "Transparansi penuh: waktu pemasakan dan estimasi jam matang ditampilkan langsung di kartu menu katalog sebelum mahasiswa memesan.",
  },
  {
    title: "Bahan utama & alergen ditampilkan",
    body: "Informasi bahan pemicu alergi umum (kacang, telur, seafood, gluten) wajib dicantumkan oleh tenant demi keselamatan konsumen.",
  },
];

const IMPACT = [
  {
    value: "Data pilot akan tampil di sini",
    label: "Porsi terselamatkan",
    hint: "Jumlah total pickup makanan yang berhasil di-scan oleh tenant",
  },
  {
    value: "-- kg",
    label: "Food waste dicegah",
    hint: "Porsi terjual × berat rata-rata per menu hasil timbang sampel (kg)",
  },
  {
    value: "Rp --",
    label: "Uang mahasiswa dihemat",
    hint: "Total selisih harga normal dikurangi harga diskon dikalikan porsi",
  },
  {
    value: "Rp --",
    label: "Pendapatan tenant",
    hint: "Total omzet pendapatan yang berhasil diselamatkan dari porsi sisa",
  },
];

const PHASES = [
  {
    when: "Minggu 1 - 2",
    title: "Persiapan & Baseline",
    body: "Sosialisasi tenant, pendataan menu aman, dan setup QR counter.",
  },
  {
    when: "Minggu 3 - 6",
    title: "Pilot Aktif Terbuka",
    body: "Pemesanan sore aktif untuk mahasiswa & pencatatan transaksi harian.",
  },
  {
    when: "Minggu 7 - 8",
    title: "Evaluasi Bersama",
    body: "Survei kepuasan rasa mahasiswa & analisis omzet tambahan tenant.",
  },
  {
    when: "Bulan 3+",
    title: "Perluasan Kantin",
    body: "Ekspansi ke seluruh kantin fakultas dan asrama mahasiswa.",
  },
];

const FAQS = [
  {
    q: "Apakah makanan yang dijual adalah sisa dari piring orang lain?",
    a: "Sama sekali bukan. Makanan di Porsi Terakhir adalah surplus porsi utuh yang belum pernah disajikan atau disentuh pembeli. Ini adalah makanan bersih di etalase atau panci masak tenant yang belum laku hingga menjelang jam tutup kantin.",
  },
  {
    q: "Bagaimana cara pembayaran porsi makanan?",
    a: "Aplikasi Porsi Terakhir hanya digunakan untuk melihat katalog, mengunci kuota porsi, dan mencatat dampak. Seluruh pembayaran dilakukan langsung di tempat kepada tenant kantin, baik melalui tunai uang pas maupun QRIS milik tenant.",
  },
  {
    q: "Kapan waktu pemesanan dan pengambilan biasanya dibuka?",
    a: "Katalog biasanya diperbarui tenant antara pukul 15.30 hingga 16.30 WIB setiap hari kerja. Jendela waktu pengambilan (pickup) dibuka mulai 16.30 hingga maksimal 18.00 WIB tergantung jam operasional masing-masing tenant.",
  },
  {
    q: "Apakah ada batasan jumlah porsi yang bisa dipesan per mahasiswa?",
    a: "Selama fase pilot, setiap akun mahasiswa dibatasi maksimal 2 porsi per hari. Hal ini bertujuan agar porsi surplus terdistribusi merata ke lebih banyak mahasiswa yang membutuhkan makanan hemat.",
  },
  {
    q: "Bagaimana jika pesanan tidak diambil tepat waktu?",
    a: "Jika porsi tidak diambil melewati batas waktu pickup (18.00 WIB), tenant berhak memberikan atau menjual porsi tersebut kepada pembeli lain di lokasi. Akun yang melakukan 'no-show' berulang kali akan dibatasi reservasinya selama pilot.",
  },
  {
    q: "Apakah tenant dikenakan biaya pendaftaran atau bagi hasil?",
    a: "Gratis 100%. Porsi Terakhir adalah proyek inisiatif keberlanjutan kampus. Tidak ada biaya langganan, tanpa komisi, dan tanpa potongan transaksi apa pun kepada tenant kantin selama masa pilot berlangsung.",
  },
  {
    q: "Bagaimana standar higienitas dipastikan?",
    a: "Semua tenant pilot telah menandatangani komitmen protokol standar keamanan pangan kampus. Makanan dibatasi usia konsumsinya antara 2-4 jam pasca matang, disimpan pada wadah tertutup panas/hangat, dan diberi label jam masak transparan.",
  },
  {
    q: "Siapa yang memfasilitasi dan mengelola platform ini?",
    a: "Platform dikembangkan bersama tim Project Infinity bekerja sama dengan Kementerian Lingkungan Hidup BEM Kampus dan Unit Pengelola Sarana Kantin Universitas sebagai percontohan program SDG 12 (Responsible Consumption and Production).",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
      {/* HERO */}
      <HeroMotion className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <p className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            <span
              className="mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle"
              aria-hidden
            />
            Pilot di kampus kamu • SDG 12 Konsumsi Bertanggung Jawab
          </p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Makan enak, harga hemat, tanpa ada yang terbuang
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Setiap sore, makanan layak makan di kantin kampus sering berakhir di tempat sampah.
            Porsi Terakhir mempertemukan tenant yang bersedia menjual sisa dengan harga diskon, dan
            mahasiswa yang butuh makan murah.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/katalog"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
            >
              <ShoppingBasket className="size-4" aria-hidden />
              Lihat Porsi Hari Ini
            </Link>
            <Link
              href="/cara-kerja"
              className="inline-flex items-center justify-center rounded-lg border bg-card px-6 py-3 font-semibold transition-colors hover:bg-muted"
            >
              Lihat Cara Kerja
            </Link>
          </div>
          <ul className="grid gap-2 text-xs font-medium sm:grid-cols-3">
            <li className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
              <Banknote className="size-4 shrink-0 text-accent" aria-hidden />
              Bayar di tempat (bisa QRIS)
            </li>
            <li className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
              <Footprints className="size-4 shrink-0 text-primary" aria-hidden />
              Jalan kaki, tanpa ongkir
            </li>
            <li className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
              <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden />
              Gratis untuk tenant
            </li>
          </ul>
        </div>

        {/* phone mock */}
        <div className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <MapPin className="size-4" aria-hidden />
              </span>
              <span>
                Pujasera Kampus
                <span className="block text-xs font-normal text-muted-foreground">
                  Buka pickup 16:30 - 18:00
                </span>
              </span>
            </p>
            <span className="text-xs font-bold text-accent">Live</span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {HERO_ITEMS.map((item) => (
              <article key={item.name} className="rounded-xl border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold leading-snug">{item.name}</h2>
                    <p className="text-xs text-muted-foreground">{item.tenant}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {item.left}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5">
                    <CalendarClock className="size-3" aria-hidden />
                    {item.cooked}
                  </span>
                  {item.quota && (
                    <span className="rounded-md border px-1.5 py-0.5">{item.quota}</span>
                  )}
                </p>
                {item.bar && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className={`h-full rounded-full bg-accent ${item.bar}`} />
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm">
                    <s className="mr-1.5 text-xs text-muted-foreground">{item.normal}</s>
                    <strong className="text-[#8a5a00]">{item.price}</strong>
                  </p>
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-bold text-white ${item.hot ? "bg-accent" : "bg-primary"}`}
                  >
                    Klaim
                  </span>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Contoh tampilan aplikasi mahasiswa saat jam porsi terakhir
          </p>
        </div>
      </HeroMotion>

      {/* KENAPA */}
      <SectionReveal className="flex flex-col gap-6 py-10">
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-primary">KENAPA PORSI TERAKHIR</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Satu masalah, dua pihak yang sama-sama butuh
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {WHY.map((w) => (
            <article key={w.title} className="rounded-xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <w.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-bold">{w.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{w.body}</p>
            </article>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Porsi Terakhir menghubungkan ketiganya secara sukarela tanpa membebani rutinitas harian.
        </p>
      </SectionReveal>

      {/* MAHASISWA */}
      <SectionReveal className="flex flex-col gap-6 rounded-2xl bg-secondary/60 px-4 py-10 sm:px-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary">UNTUK MAHASISWA</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Dari katalog sampai makan, 4 langkah
          </h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STUDENT_STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-3 flex items-center gap-2 font-bold">
                <s.icon className="size-4 text-primary" aria-hidden />
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="rounded-xl border bg-card p-4 text-sm">
          <strong>Tanpa perantara dana:</strong> Pembayaran tidak diproses di aplikasi. Kamu
          membayar langsung ke tenant saat pickup sesuai harga diskon yang tertera.
        </p>
      </SectionReveal>

      {/* TENANT */}
      <SectionReveal id="tenant" className="grid gap-6 py-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold tracking-widest text-primary">UNTUK TENANT KANTIN</p>
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Ubah sisa jadi pendapatan tambahan, tanpa ribet
          </h2>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold">Simulasi: Tambah Porsi Terakhir</h3>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm">
              <li>Nama Menu Sisa</li>
              <li>
                Jumlah Porsi — <strong>5 Porsi</strong>
              </li>
              <li>
                Jam Selesai Masak — <strong>15.15 WIB</strong>
              </li>
            </ol>
            <p className="mt-3 text-sm">
              Diskon otomatis disarankan: <strong>45%</strong> — <strong>Rp 9.000 / porsi</strong>
            </p>
          </div>
          <Link
            href="/masuk"
            className="inline-flex w-fit items-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
          >
            Daftar sebagai Tenant Kantin
          </Link>
        </div>
        <ul className="flex flex-col gap-3">
          {[
            [
              "Input cukup 3 langkah",
              "Cukup ketik menu, tentukan porsi, pilih jam masak. Selesai dalam 30 detik dari HP.",
            ],
            [
              "Harga diskon disarankan otomatis",
              "Rekomendasi 40-50% agar langsung terserap mahasiswa tanpa mengorbankan modal dasar.",
            ],
            [
              "Scan QR untuk konfirmasi pickup cepat",
              "Cukup arahkan kamera ke HP mahasiswa saat mereka bayar, tak perlu rekap nota manual.",
            ],
            [
              "Insight data sisa & tanpa biaya platform",
              "100% pendapatan masuk ke tenant kantin selama pilot aktif tanpa potongan komisi apa pun.",
            ],
            ["Sukarela (opt-in)", "Kamu yang menentukan menu, jumlah, dan jam."],
          ].map(([t, b]) => (
            <li key={t} className="rounded-xl border bg-card p-4 text-sm">
              <strong>{t}</strong>
              <p className="mt-1 text-muted-foreground">{b}</p>
            </li>
          ))}
        </ul>
      </SectionReveal>

      {/* KEAMANAN */}
      <SectionReveal id="keamanan" className="flex flex-col gap-6 py-10">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary">KEAMANAN PANGAN</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Aturan yang jelas supaya tetap aman
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FOOD_SAFETY.map((f) => (
            <article key={f.title} className="rounded-xl border bg-card p-5">
              <ShieldCheck className="size-5 text-primary" aria-hidden />
              <h3 className="mt-2 font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Tenant bertanggung jawab atas kualitas dan higienitas makanan. Porsi Terakhir bertindak
          sebagai perantara informasi, reservasi kuota, dan pendataan dampak lingkungan.
        </p>
      </SectionReveal>

      {/* DAMPAK */}
      <SectionReveal
        id="dampak"
        className="flex flex-col gap-6 rounded-2xl bg-primary px-4 py-10 text-primary-foreground sm:px-8"
      >
        <div>
          <p className="text-xs font-bold tracking-widest opacity-80">DAMPAK</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Setiap porsi terselamatkan tercatat
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT.map((m) => (
            <article key={m.label} className="rounded-xl bg-white/10 p-5">
              <p className="text-xl font-extrabold">{m.value}</p>
              <h3 className="mt-1 font-bold">{m.label}</h3>
              <p className="mt-1 text-xs opacity-80">{m.hint}</p>
            </article>
          ))}
        </div>
        <p className="text-sm opacity-90">
          Dampak absolut mungkin terasa bertahap karena volume sisa satu kantin terbatas. Tapi
          setiap porsi yang terselamatkan tetap bernilai nyata, dan seluruh data diukur secara
          jujur.{" "}
          <Link href="/cara-kerja" className="font-semibold underline">
            Lihat rumus lengkap di panduan pilot
          </Link>
        </p>
      </SectionReveal>

      {/* PRINSIP + TIMELINE */}
      <SectionReveal className="grid gap-6 py-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold tracking-widest text-primary">PRINSIP KAMI</p>
          <h2 className="text-2xl font-extrabold sm:text-3xl">Sukarela, ringan, dan jujur</h2>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="rounded-xl border bg-card p-4">
              <strong>Opt-in, tanpa paksaan</strong>
              <p className="mt-1 text-muted-foreground">
                Tenant berpartisipasi kapan pun mereka punya porsi berlebih. Jika habis terjual
                normal di siang hari, tidak ada kewajiban menyediakan porsi diskon.
              </p>
            </li>
            <li className="rounded-xl border bg-card p-4">
              <strong>Tidak mengubah cara masak</strong>
              <p className="mt-1 text-muted-foreground">
                Platform bukan untuk membuat tenant memproduksi porsi lebih banyak, melainkan
                menyerap sisa wajar dari operasional harian yang sudah berjalan.
              </p>
            </li>
            <li className="rounded-xl border bg-card p-4">
              <strong>Diukur dari baseline</strong>
              <p className="mt-1 text-muted-foreground">
                Setiap data surplus dibandingkan dengan estimasi timbulan sampah kantin sebelum
                pilot, agar akurasi laporan keberlanjutan kampus bisa diuji ilmiah.
              </p>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-bold">Fase Implementasi Pilot Kampus</h3>
          {PHASES.map((p) => (
            <article key={p.when} className="flex gap-3 rounded-xl border bg-card p-4 text-sm">
              <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-bold text-primary">
                {p.when}
              </span>
              <div>
                <strong>{p.title}</strong>
                <p className="mt-0.5 text-muted-foreground">{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionReveal>

      {/* FAQ */}
      <SectionReveal id="faq" className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-10">
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-primary">TANYA JAWAB</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-xl border bg-card px-5 py-4">
            <summary className="cursor-pointer font-semibold marker:text-primary">{f.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </SectionReveal>

      {/* CTA */}
      <SectionReveal className="mb-12 flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
        <p className="text-xs font-bold tracking-widest text-primary">
          Hemat Pengeluaran • Lindungi Bumi
        </p>
        <h2 className="max-w-xl text-2xl font-extrabold sm:text-3xl">
          Jangan biarkan porsi terakhir terbuang
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Satu porsi terjual berarti satu porsi tidak jadi sampah dan satu mahasiswa makan lebih
          hemat. Mari bergabung dalam inisiatif nyata di kampus kita.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/masuk"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
          >
            Masuk Sekarang
          </Link>
          <Link
            href="/masuk"
            className="inline-flex items-center justify-center rounded-lg border px-6 py-3 font-semibold transition-colors hover:bg-muted"
          >
            Daftar sebagai Tenant
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">• Pilot SDG 12 di lingkungan kampus</p>
      </SectionReveal>
    </div>
  );
}

import {
  BadgeCheck,
  Banknote,
  Calculator,
  Camera,
  CircleAlert,
  Clock3,
  HandCoins,
  Hourglass,
  Info,
  Leaf,
  QrCode,
  ReceiptText,
  Scale,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Timer,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  {
    no: "01",
    chip: "Tahap dapur & etalase",
    icon: Store,
    title: "Tenant mengunggah porsi yang memenuhi syarat",
    body: "Menjelang tutup operasional, tenant menghitung surplus yang masih layak simpan, lalu mencatat jam masak, jumlah, harga diskon, dan batas waktu ambil.",
    detail: [
      { icon: Clock3, text: "Jam masak selalu ditampilkan ke pembeli" },
      { icon: Hourglass, text: "Batas jual 120–240 menit setelah masak" },
    ],
    foot: { icon: ShieldCheck, text: "Tenant bertanggung jawab atas kualitas" },
  },
  {
    no: "02",
    chip: "Tanpa biaya di muka",
    icon: ShoppingBasket,
    title: "Mahasiswa memesan dan memperoleh QR",
    body: "Reservasi lewat katalog bersifat gratis. Sistem mengurangi kuota secara atomik dan menerbitkan QR pickup berisi token acak — tanpa data pribadi.",
    detail: [
      { icon: QrCode, text: "QR = token acak, bukan data pribadi" },
      { icon: Timer, text: "Slot pickup tidak boleh lewat expiry" },
    ],
    foot: { icon: Hourglass, text: "Kuota kembali bila reservasi dibatalkan" },
  },
  {
    no: "03",
    chip: "Di kantin fisik",
    icon: HandCoins,
    title: "Datang, tunjukkan QR, bayar di tempat",
    body: "Mahasiswa datang sebelum batas waktu. Tenant memindai QR lalu menekan konfirmasi secara eksplisit — pembayaran tunai/QRIS langsung ke kasir kantin.",
    detail: [
      { icon: Banknote, text: "Tunai atau QRIS milik kantin" },
      { icon: ReceiptText, text: "Tanpa potongan platform selama pilot" },
    ],
    foot: { icon: BadgeCheck, text: "Tercatat setelah konfirmasi tenant" },
  },
] as const;

const FORMULAS = [
  {
    name: "Porsi terselamatkan",
    tag: "Data kasir",
    formula: "Σ transaksi dengan pemindaian QR berhasil",
    note: "Satu transaksi = satu pemindaian, terlepas dari jumlah item.",
  },
  {
    name: "Berat dicegah (kg)",
    tag: "Estimasi sampling",
    formula: "Σ (jumlah diambil × rata-rata berat menu) / 1000",
    note: "Hanya menu berdata berat sampel; sisanya dikecualikan.",
  },
  {
    name: "Uang hemat",
    tag: "Nominal terverifikasi",
    formula: "Σ ((harga normal − harga diskon) × jumlah diambil)",
    note: "Memakai snapshot harga saat order, bukan harga live.",
  },
  {
    name: "Omzet tenant",
    tag: "Masuk ke tenant",
    formula: "Σ (harga diskon × jumlah diambil)",
    note: "100% nilai transaksi masuk ke kasir tenant.",
  },
  {
    name: "Sell-through",
    tag: "Efisiensi harian",
    formula: "Porsi diambil / porsi diunggah",
    note: "Nol bila belum ada porsi diunggah.",
  },
] as const;

const SAFETY = [
  {
    icon: UtensilsCrossed,
    title: "Hanya makanan matang yang bisa disimpan",
    body: "Porsi berasal dari etalase atau panci utama — bukan sisa piring. Tenant menilai kelayakan setiap batch.",
  },
  {
    icon: Clock3,
    title: "Batas jual 120–240 menit",
    body: "Default 180 menit setelah jam masak (BR-2). Porsi kedaluwarsa tidak tampil dan tidak bisa dipesan.",
  },
  {
    icon: Camera,
    title: "Jam masak transparan",
    body: "Setiap kartu katalog dan halaman detail menampilkan jam masak + tanggal/waktu WIB sebelum mahasiswa memesan.",
  },
  {
    icon: ShieldCheck,
    title: "Tanggung jawab tenant",
    body: "Kualitas dan keamanan pangan tetap milik tenant. Konfirmasi pickup setelah expiry ditolak sistem.",
  },
] as const;

const FAQS = [
  {
    q: "Bagaimana jika saya terlambat mengambil porsi?",
    a: "Batalkan reservasi dari halaman pesanan agar kuota kembali ke katalog. Pickup setelah expiry ditolak sistem demi keamanan pangan.",
  },
  {
    q: "Bolehkah membawa wadah sendiri?",
    a: "Sangat dianjurkan. Tanyakan ke tenant saat pengambilan — sebagian besar gerai menyambut pengurangan sampah kemasan.",
  },
  {
    q: "Mengapa menu berbeda setiap hari?",
    a: "Ini penyelamatan surplus, bukan katering. Jenis dan jumlah porsi mengikuti sisa higienis etalase hari itu.",
  },
  {
    q: "Apakah tenant dipungut biaya?",
    a: "Tidak. Partisipasi sukarela (opt-in) dan nol platform fee selama pilot. Tenant bisa berhenti kapan saja.",
  },
] as const;

export default function CaraKerjaPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 md:gap-14 md:py-12">
      {/* Hero editorial */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <Badge variant="secondary">Pilot kampus · Tanpa biaya layanan</Badge>
          <h1 className="text-3xl font-bold md:text-4xl">Cara kerja penyelamatan porsi kampus</h1>
          <p className="text-muted-foreground">
            Makanan matang bermutu dari kantin yang diselamatkan menjelang tutup. Hemat untuk
            mahasiswa, bernilai bagi tenant, terukur tanpa klaim berlebihan.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/katalog" className={buttonVariants()}>
              Lihat porsi hari ini
            </Link>
            <Link href="#metodologi" className={buttonVariants({ variant: "outline" })}>
              Lihat metodologi dampak
            </Link>
          </div>
          <dl className="grid w-full max-w-md grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col">
              <dt className="order-2 text-sm text-muted-foreground">Bayar di tempat</dt>
              <dd className="order-1 text-xl font-bold text-primary">100%</dd>
            </div>
            <div className="flex flex-col">
              <dt className="order-2 text-sm text-muted-foreground">Jendela jual</dt>
              <dd className="order-1 text-xl font-bold text-primary">2–4 jam</dd>
            </div>
            <div className="flex flex-col">
              <dt className="order-2 text-sm text-muted-foreground">Fee platform</dt>
              <dd className="order-1 text-xl font-bold text-primary">Rp0</dd>
            </div>
          </dl>
        </div>
        <figure className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Image
            src="/images/foto_kantin.webp"
            alt="Etalase kantin kampus"
            width={800}
            height={600}
            className="aspect-[4/3] w-full object-cover"
            priority
          />
          <figcaption className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="font-semibold">Surplus etalase sore hari</span>
            <span className="text-muted-foreground">Contoh porsi yang diselamatkan</span>
          </figcaption>
        </figure>
      </section>

      {/* Zero payment anchor */}
      <section aria-labelledby="bayar-heading">
        <Card>
          <CardHeader>
            <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
              <Wallet className="size-4" aria-hidden />
              Prinsip keuangan
            </p>
            <CardTitle id="bayar-heading" className="text-xl md:text-2xl">
              Aplikasi tidak memproses pembayaran
            </CardTitle>
            <CardDescription>
              Porsi Terakhir hanya mencatat kuota. Uang berpindah tangan di kasir fisik kantin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border px-3 py-2">
                <dt className="text-muted-foreground">Biaya reservasi aplikasi</dt>
                <dd className="font-bold text-primary">Rp0 (gratis)</dd>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <dt className="text-muted-foreground">Alur uang</dt>
                <dd className="font-bold">Langsung ke tenant</dd>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <dt className="text-muted-foreground">Potongan komisi</dt>
                <dd className="font-bold text-primary">0% selama pilot</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      {/* 3 langkah */}
      <section aria-labelledby="langkah-heading" className="flex flex-col gap-5">
        <div className="flex max-w-2xl flex-col gap-2">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            Siklus penyelamatan
          </p>
          <h2 id="langkah-heading" className="text-2xl font-bold md:text-3xl">
            Tiga langkah dari etalase ke meja makan
          </h2>
          <p className="text-muted-foreground">
            Tanpa isi ulang dompet digital, tanpa kurir — mahasiswa datang langsung ke gerai.
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.no}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-primary/30" aria-hidden>
                      {s.no}
                    </span>
                    <Badge variant="secondary">{s.chip}</Badge>
                  </div>
                  <CardTitle className="flex items-start gap-2">
                    <s.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                  <ul className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3 text-sm">
                    {s.detail.map((d) => (
                      <li key={d.text} className="flex items-center gap-2 text-muted-foreground">
                        <d.icon className="size-4 shrink-0 text-primary" aria-hidden />
                        {d.text}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto flex items-center gap-2 border-t pt-3 text-sm font-medium text-primary">
                    <s.foot.icon className="size-4" aria-hidden />
                    {s.foot.text}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* SOP keamanan */}
      <section aria-labelledby="aman-heading" className="flex flex-col gap-5">
        <div className="flex max-w-2xl flex-col gap-2">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            Integritas pangan
          </p>
          <h2 id="aman-heading" className="text-2xl font-bold md:text-3xl">
            Standar penanganan & batasan mutu
          </h2>
          <p className="text-muted-foreground">
            Batas tegas antara sisa layak simpan dan makanan yang tidak boleh dijual.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SAFETY.map((s) => (
            <li key={s.title}>
              <Card className="h-full" size="sm">
                <CardContent className="flex flex-col gap-2 pt-1">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
                    <s.icon className="size-4" aria-hidden />
                  </span>
                  <h3 className="font-heading text-base font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Metodologi */}
      <section
        aria-labelledby="metodologi-heading"
        id="metodologi"
        className="flex scroll-mt-20 flex-col gap-5"
      >
        <div className="flex max-w-2xl flex-col gap-2">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
            <Calculator className="size-4" aria-hidden />
            Metodologi terbuka
          </p>
          <h2 id="metodologi-heading" className="text-2xl font-bold md:text-3xl">
            Rumus dampak: nyata, bukan klaim kosong
          </h2>
          <p className="text-muted-foreground">
            Semua angka publik diturunkan dari transaksi tercatat. Tanpa klaim karbon atau pohon
            yang tak terverifikasi di kantin.
          </p>
        </div>
        <Card>
          <CardContent className="px-0 py-0">
            <ul className="divide-y">
              {FORMULAS.map((f) => (
                <li
                  key={f.name}
                  className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_1.4fr_auto] md:items-center md:gap-4"
                >
                  <div>
                    <h3 className="font-semibold">{f.name}</h3>
                    <p className="text-sm text-muted-foreground">{f.note}</p>
                  </div>
                  <code className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs font-semibold text-primary">
                    {f.formula}
                  </code>
                  <Badge variant={f.tag === "Estimasi sampling" ? "default" : "secondary"}>
                    {f.tag === "Estimasi sampling" ? (
                      <Scale className="size-3" aria-hidden />
                    ) : (
                      <Leaf className="size-3" aria-hidden />
                    )}
                    {f.tag}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <p className="flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="text-foreground">Batasan estimasi:</strong> berat (kg) memakai
            rata-rata berat per menu dari penimbangan sampel berkala — bukan timbangan per piring di
            kasir. Menu tanpa data berat dikecualikan dari angka kg, dan diskon 45% adalah saran
            (tenant boleh menetapkan harga sendiri di bawah harga normal).
          </span>
        </p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="flex flex-col gap-5">
        <h2 id="faq-heading" className="text-2xl font-bold md:text-3xl">
          Sering ditanyakan
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {FAQS.map((f) => (
            <li key={f.q}>
              <Card className="h-full" size="sm">
                <CardContent className="flex flex-col gap-2 pt-1">
                  <h3 className="font-heading text-base font-semibold">{f.q}</h3>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      {/* CTA */}
      <section
        aria-labelledby="cta-heading"
        className="flex flex-col gap-3 rounded-2xl bg-primary px-6 py-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-10"
      >
        <div className="flex max-w-xl flex-col gap-2">
          <h2 id="cta-heading" className="text-2xl font-bold">
            Siap menyelamatkan porsi hari ini?
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Jendela rilis sore biasanya 15.30–18.00 WIB. Kuota terbatas, siapa cepat dia dapat.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/katalog" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Katalog porsi
          </Link>
          <Link
            href="/masuk"
            className={buttonVariants({
              size: "lg",
              className:
                "border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
            })}
          >
            Masuk / daftar
          </Link>
        </div>
      </section>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        Keikutsertaan tenant sukarela dan bisa berhenti kapan saja. Angka dampak di halaman lain
        dihitung dari transaksi tercatat — bukan proyeksi.
      </p>
    </div>
  );
}

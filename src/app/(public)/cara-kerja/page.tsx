import {
  BadgeCheck,
  Banknote,
  Calculator,
  Camera,
  ChevronDown,
  CircleAlert,
  Clock3,
  HandCoins,
  Hourglass,
  Info,
  Leaf,
  QrCode,
  ReceiptText,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Timer,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "../reveal";

const STEPS = [
  {
    no: "Langkah 1",
    chip: "Di dapur & etalase",
    icon: ShoppingBasket,
    title: "Tenant mengunggah porsi yang memenuhi syarat",
    body: "Menjelang tutup operasional, tenant menghitung surplus yang masih layak simpan, lalu mencatat jam masak, jumlah, harga diskon, dan batas waktu ambil.",
    detail: [
      { icon: Clock3, text: "Jam masak selalu ditampilkan ke pembeli" },
      { icon: Hourglass, text: "Batas jual 120–240 menit setelah masak" },
    ],
    foot: { icon: ShieldCheck, text: "Tenant bertanggung jawab atas kualitas" },
  },
  {
    no: "Langkah 2",
    chip: "Tanpa biaya di muka",
    icon: Store,
    title: "Mahasiswa memesan dan memperoleh QR",
    body: "Reservasi lewat katalog bersifat gratis. Sistem mengurangi kuota dan menerbitkan QR pickup berisi token acak — tanpa data pribadi.",
    detail: [
      { icon: QrCode, text: "QR = token acak, bukan data pribadi" },
      { icon: Timer, text: "QR kedaluwarsa setelah batas waktu ambil" },
    ],
    foot: { icon: Hourglass, text: "Kuota kembali bila reservasi dibatalkan" },
  },
  {
    no: "Langkah 3",
    chip: "Di kantin fisik",
    icon: HandCoins,
    title: "Datang, tunjukkan QR, bayar di tempat",
    body: "Mahasiswa datang sebelum batas waktu. Tenant memindai QR lalu menekan konfirmasi secara eksplisit — pembayaran tunai/QRIS langsung ke kasir kantin.",
    detail: [
      { icon: Banknote, text: "Tunai atau QRIS milik kantin" },
      { icon: ReceiptText, text: "Tanpa potongan biaya selama pilot" },
    ],
    foot: { icon: BadgeCheck, text: "Tercatat setelah konfirmasi tenant" },
  },
] as const;

const FORMULAS = [
  {
    name: "Porsi terselamatkan",
    tag: "Data kasir",
    plain: "Setiap QR yang dipindai tenant dihitung sebagai satu porsi.",
    formula: "Σ transaksi dengan pemindaian QR berhasil",
    note: "Satu transaksi = satu pemindaian, terlepas dari jumlah item.",
  },
  {
    name: "Berat dicegah (kg)",
    tag: "Estimasi sampling",
    plain: "Jumlah porsi dikali rata-rata berat menu, dibagi 1000.",
    formula: "Σ (jumlah diambil × rata-rata berat menu) / 1000",
    note: "Hanya menu berdata berat sampel; sisanya dikecualikan.",
  },
  {
    name: "Uang hemat",
    tag: "Nominal terverifikasi",
    plain: "Selisih harga normal dan harga diskon dikali jumlah porsi.",
    formula: "Σ ((harga normal − harga diskon) × jumlah diambil)",
    note: "Memakai harga yang tercatat saat order, bukan harga live.",
  },
  {
    name: "Omzet tenant",
    tag: "Masuk ke tenant",
    plain: "Harga diskon dikali jumlah porsi — seluruhnya masuk kasir tenant.",
    formula: "Σ (harga diskon × jumlah diambil)",
    note: "100% nilai transaksi masuk ke kasir tenant.",
  },
  {
    name: "Porsi laku",
    tag: "Efisiensi harian",
    plain: "Porsi yang diambil dibagi porsi yang diunggah hari itu.",
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
    body: "Default 180 menit setelah jam masak. Porsi kedaluwarsa tidak tampil dan tidak bisa dipesan.",
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
    a: "Tidak. Ikut serta sukarela dan tanpa potongan biaya selama pilot. Tenant bisa berhenti kapan saja.",
  },
] as const;

export default function CaraKerjaPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-8 sm:px-6 md:gap-16 md:py-12">
      {/* Hero */}
      <section className="flex flex-col gap-5">
        <Badge variant="secondary" className="w-fit">
          Panduan transparansi · Tanpa biaya layanan
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
          Cara kerja penyelamatan porsi kampus
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Makanan matang bermutu dari kantin yang diselamatkan menjelang tutup. Hemat untuk
          mahasiswa, bernilai bagi tenant, terukur tanpa klaim berlebihan.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/katalog" className={buttonVariants()}>
            Lihat porsi hari ini
          </Link>
          <Link
            href="#metodologi"
            className={buttonVariants({ variant: "link", className: "px-0" })}
          >
            Lihat metodologi dampak
            <ChevronDown className="size-4" aria-hidden />
          </Link>
        </div>
        <dl className="grid grid-cols-3 gap-2 border-y py-4 sm:gap-4">
          <div className="flex min-w-0 flex-col">
            <dt className="order-2 text-xs text-muted-foreground sm:text-sm">Bayar di tempat</dt>
            <dd className="order-1 text-lg font-bold text-primary tabular-nums sm:text-xl">100%</dd>
          </div>
          <div className="flex min-w-0 flex-col">
            <dt className="order-2 text-xs text-muted-foreground sm:text-sm">Jendela jual</dt>
            <dd className="order-1 text-lg font-bold text-primary tabular-nums sm:text-xl">
              2–4 jam
            </dd>
          </div>
          <div className="flex min-w-0 flex-col">
            <dt className="order-2 text-xs text-muted-foreground sm:text-sm">Fee platform</dt>
            <dd className="order-1 text-lg font-bold text-primary tabular-nums sm:text-xl">Rp0</dd>
          </div>
        </dl>
        <figure className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Image
            src="/images/foto_kantin.webp"
            alt="Etalase kantin kampus pada sore hari menjelang tutup"
            width={800}
            height={600}
            className="aspect-[16/9] w-full object-cover"
            priority
          />
          <figcaption className="px-4 py-3 text-sm text-muted-foreground">
            Kantin kampus sore hari — sisa layak simpan didata sebelum tutup.
          </figcaption>
        </figure>
      </section>

      {/* Prinsip keuangan */}
      <section aria-labelledby="bayar-heading">
        <Reveal className="flex flex-col gap-4">
          <h2 id="bayar-heading" className="text-xl font-bold tracking-tight">
            Aplikasi tidak memproses pembayaran
          </h2>
          <p className="text-muted-foreground">
            Porsi Terakhir hanya mencatat kuota. Uang berpindah tangan di kasir fisik kantin.
          </p>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Biaya reservasi aplikasi</dt>
              <dd className="font-bold text-primary">Rp0 (gratis)</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Alur uang</dt>
              <dd className="font-bold">Langsung ke tenant</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Potongan komisi</dt>
              <dd className="font-bold text-primary">0% selama pilot</dd>
            </div>
          </dl>
        </Reveal>
      </section>

      {/* 3 langkah */}
      <section aria-labelledby="langkah-heading">
        <Reveal className="flex flex-col gap-2">
          <h2 id="langkah-heading" className="text-2xl font-bold tracking-tight">
            Tiga langkah dari etalase ke meja makan
          </h2>
          <p className="text-muted-foreground">
            Tanpa isi ulang dompet digital, tanpa kurir — mahasiswa datang langsung ke gerai.
          </p>
          <ol className="mt-4 flex flex-col gap-8 border-t pt-8">
            {STEPS.map((s) => (
              <li key={s.no} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="rounded-md border border-dashed border-primary/50 bg-primary/5 px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-primary uppercase tabular-nums">
                    {s.no}
                  </p>
                  <Badge variant="secondary">{s.chip}</Badge>
                </div>
                <h3 className="flex items-start gap-2 font-heading text-lg font-semibold">
                  <s.icon className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
                  {s.title}
                </h3>
                <p className="max-w-prose text-sm text-muted-foreground">{s.body}</p>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {s.detail.map((d) => (
                    <li key={d.text} className="flex items-center gap-2">
                      <d.icon className="size-4 shrink-0 text-primary" aria-hidden />
                      {d.text}
                    </li>
                  ))}
                </ul>
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <s.foot.icon className="size-4" aria-hidden />
                  {s.foot.text}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* SOP keamanan */}
      <section aria-labelledby="aman-heading">
        <Reveal className="flex flex-col gap-2">
          <h2 id="aman-heading" className="text-xl font-bold tracking-tight">
            Standar penanganan & batasan mutu
          </h2>
          <p className="text-muted-foreground">
            Batas tegas antara sisa layak simpan dan makanan yang tidak boleh dijual.
          </p>
          <ul className="mt-3 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {SAFETY.map((s) => (
              <li key={s.title} className="flex flex-col gap-1.5">
                <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
                  <s.icon className="size-4 shrink-0 text-primary" aria-hidden />
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Metodologi */}
      <section aria-labelledby="metodologi-heading" id="metodologi" className="scroll-mt-20">
        <Reveal className="flex flex-col gap-2">
          <h2
            id="metodologi-heading"
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <Calculator className="size-5 text-primary" aria-hidden />
            Rumus dampak: nyata, bukan klaim kosong
          </h2>
          <p className="text-muted-foreground">
            Semua angka publik diturunkan dari transaksi tercatat. Tanpa klaim karbon atau pohon
            yang tak terverifikasi di kantin.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {FORMULAS.map((f) => (
              <div key={f.name} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                <dt className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                  {f.name}
                  <Badge
                    variant={f.tag === "Estimasi sampling" ? "outline" : "default"}
                    className="shrink-0"
                  >
                    {f.tag === "Estimasi sampling" ? (
                      <TriangleAlert className="size-3" aria-hidden />
                    ) : (
                      <Leaf className="size-3" aria-hidden />
                    )}
                    {f.tag}
                  </Badge>
                </dt>
                <dd className="text-sm">{f.plain}</dd>
                <dd className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs font-semibold text-primary">
                  {f.formula}
                </dd>
                <dd className="text-sm text-muted-foreground">{f.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 flex items-start gap-2 rounded-xl border border-transparent bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <strong className="text-foreground">Batasan estimasi:</strong> berat (kg) memakai
              rata-rata berat per menu dari penimbangan sampel berkala — bukan timbangan per piring
              di kasir. Menu tanpa data berat dikecualikan, dan diskon 45% adalah saran (tenant
              boleh menetapkan harga sendiri di bawah harga normal).
            </span>
          </p>
        </Reveal>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading">
        <Reveal className="flex flex-col gap-2">
          <h2 id="faq-heading" className="text-xl font-bold tracking-tight">
            Sering ditanyakan
          </h2>
          <Accordion defaultValue={[FAQS[0].q]} className="mt-1 border-b">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="border-t first:border-t-0">
                <AccordionTrigger className="py-5 text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{f.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-heading">
        <Reveal className="flex flex-col gap-4 rounded-2xl bg-primary px-6 py-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 id="cta-heading" className="text-2xl font-bold tracking-tight">
              Siap menyelamatkan porsi hari ini?
            </h2>
            <p className="text-sm text-primary-foreground/80">
              Jendela rilis sore biasanya 15.30–18.00 WIB. Selama kuota masih ada, porsi menunggumu.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href="/katalog" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Katalog porsi
            </Link>
            <Link
              href="/masuk"
              className={buttonVariants({
                size: "lg",
                className:
                  "border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
              })}
            >
              Masuk / daftar
            </Link>
          </div>
        </Reveal>
      </section>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        Keikutsertaan tenant sukarela dan bisa berhenti kapan saja. Angka dampak di halaman lain
        dihitung dari transaksi tercatat — bukan proyeksi.
      </p>
    </div>
  );
}

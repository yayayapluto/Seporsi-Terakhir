import { cn } from "cn";
import { ChartColumn, CircleHelp, PackageCheck, Scale, Store, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SieraTile, sieraCardClass } from "@/components/siera";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Pressable, Reveal } from "../reveal";

const STEPS = [
  {
    no: "01",
    title: "Tenant unggah surplus layak makan",
    body: "Menjelang tutup, tenant catat jam masak, jumlah, harga diskon. Batas jual 120–240 menit.",
  },
  {
    no: "02",
    title: "Mahasiswa pesan, dapat QR",
    body: "Reservasi gratis. Kuota berkurang, QR pickup terbit. Tanpa data pribadi di QR.",
  },
  {
    no: "03",
    title: "Ambil di gerai, bayar di tempat",
    body: "Tunjukkan QR sebelum batas waktu. Tenant pindai + konfirmasi. Bayar tunai/QRIS ke kasir.",
  },
] as const;

const DAMPAK = [
  { name: "Porsi terselamatkan", plain: "Satu QR terpindai = satu porsi." },
  { name: "Berat dicegah (kg)", plain: "Porsi × rata-rata berat menu sampel." },
  { name: "Uang hemat", plain: "Selisih normal–diskon × porsi." },
  { name: "Omzet tenant", plain: "Harga diskon × porsi, 100% ke kasir." },
  { name: "Porsi laku", plain: "Diambil dibagi diunggah hari itu." },
] as const;

const DAMPAK_ICONS = [PackageCheck, Scale, Wallet, Store, ChartColumn] as const;

const FAQS = [
  {
    q: "Terlambat ambil?",
    a: "Batalkan dari halaman pesanan agar kuota kembali. Lewat batas waktu, sistem tolak pickup.",
  },
  {
    q: "Bawa wadah sendiri?",
    a: "Boleh. Tanya tenant saat ambil — sebagian besar gerai menyambut.",
  },
  {
    q: "Menu beda tiap hari?",
    a: "Ikut sisa higienis etalase hari itu, bukan katering.",
  },
  {
    q: "Tenant dipungut biaya?",
    a: "Tidak. Sukarela, tanpa potongan selama pilot, bisa berhenti kapan saja.",
  },
];

export default function CaraKerjaPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
      {/* HERO — struktur sama dengan landing */}
      <section className="grid gap-8 pt-28 pb-10 sm:pt-36 sm:pb-14 md:grid-cols-2 md:items-start lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-5">
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Cara kerja penyelamatan porsi kampus.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Tenant menjual surplus layak makan dengan harga diskon. Mahasiswa pesan, ambil dengan
            QR, bayar di tempat.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Pressable className="w-full sm:w-auto">
              <Link
                href="/katalog"
                className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
              >
                Lihat Porsi Hari Ini
              </Link>
            </Pressable>
            <Pressable className="w-full sm:w-auto">
              <Link
                href="#dampak"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full bg-white sm:w-auto",
                })}
              >
                Lihat Cara Hitung
              </Link>
            </Pressable>
          </div>
          <p className="text-xs text-muted-foreground">
            Bayar di tempat • Jam masak tertera • Maks 2 porsi/hari
          </p>
        </div>
        <figure>
          <Image
            src="/images/foto_kantin.webp"
            alt="Suasana kantin kampus sore hari"
            width={520}
            height={346}
            className="h-auto w-full rounded-[20px] border border-[#E8ECE9] object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <figcaption className="mt-1 text-xs text-muted-foreground">
            Kantin sore hari — sisa layak simpan didata sebelum tutup.
          </figcaption>
        </figure>
      </section>

      {/* LANGKAH */}
      <Reveal className="flex flex-col gap-3 py-10">
        <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Tiga langkah dari etalase ke meja makan.
        </h2>
        <ol
          className={cn(
            sieraCardClass,
            "flex flex-col divide-y divide-dashed divide-[#E8ECE9] px-4 sm:px-5",
          )}
        >
          {STEPS.map((s) => (
            <li key={s.no} className="flex min-h-11 items-center gap-3 py-4">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#DCEBE0] text-[15px] font-extrabold text-[#1E5A36] tabular-nums"
              >
                {s.no}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] leading-snug font-bold text-[#1C2826]">{s.title}</h3>
                <p className="mt-0.5 text-[13px] text-[#64746B]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="py-2 text-xs text-muted-foreground">
          Hanya makanan matang layak simpan • Jam masak selalu tampil • Tenant tanggung jawab mutu.
        </p>
      </Reveal>

      {/* DAMPAK */}
      <Reveal id="dampak" className="flex flex-col gap-3 py-10">
        <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Angka nyata dari transaksi tercatat.
        </h2>
        <ul
          className={cn(
            sieraCardClass,
            "flex flex-col divide-y divide-dashed divide-[#E8ECE9] px-4 sm:px-5",
          )}
        >
          {DAMPAK.map((f, i) => {
            const Icon = DAMPAK_ICONS[i] ?? PackageCheck;
            return (
              <li key={f.name} className="flex min-h-11 items-center gap-3 py-4">
                <SieraTile>
                  <Icon className="size-5" strokeWidth={1.75} />
                </SieraTile>
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <h3 className="text-[15px] leading-snug font-bold text-[#1C2826]">{f.name}</h3>
                  <p className="text-[13px] text-[#64746B]">{f.plain}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="py-2 text-xs text-muted-foreground">
          Berat pakai rata-rata sampel berkala. Tanpa klaim karbon.
        </p>
      </Reveal>

      {/* FAQ */}
      <Reveal className="mx-auto flex w-full max-w-3xl flex-col gap-3 py-10">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Sering ditanyakan.</h2>
        <ul
          className={cn(
            sieraCardClass,
            "flex flex-col divide-y divide-dashed divide-[#E8ECE9] px-4 sm:px-5",
          )}
        >
          {FAQS.map((f) => (
            <li key={f.q} className="flex gap-3 py-4">
              <SieraTile>
                <CircleHelp className="size-5" strokeWidth={1.75} />
              </SieraTile>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] leading-snug font-bold text-[#1C2826]">{f.q}</h3>
                <p className="mt-0.5 text-[13px] text-[#64746B]">{f.a}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mb-12 overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:py-14">
        <h2 className="mx-auto max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Jangan biarkan seporsi terakhir terbuang.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-primary-foreground/80">
          Satu porsi terjual berarti satu porsi tidak jadi sampah dan satu mahasiswa makan lebih
          hemat.
        </p>
        <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          <Pressable className="w-full sm:w-auto">
            <Link
              href="/katalog"
              className="inline-flex h-9 min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary-foreground px-2.5 text-sm font-medium whitespace-nowrap text-primary transition-colors outline-none select-none hover:bg-primary-foreground/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto"
            >
              Lihat Porsi Hari Ini
            </Link>
          </Pressable>
          <Pressable className="w-full sm:w-auto">
            <Link
              href="/masuk"
              className="inline-flex h-9 min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-primary-foreground/40 px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors outline-none select-none hover:bg-primary-foreground/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto"
            >
              Masuk Sekarang
            </Link>
          </Pressable>
        </div>
      </Reveal>
      <SiteFooter />
    </div>
  );
}

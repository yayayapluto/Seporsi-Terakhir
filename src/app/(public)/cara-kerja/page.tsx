import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ChalkRow, Pressable, Reveal } from "../reveal";

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
] as const;

export default function CaraKerjaPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
      {/* HERO — struktur sama dengan landing */}
      <section className="grid gap-8 py-10 sm:py-14 md:grid-cols-2 md:items-center lg:grid-cols-[1.05fr_1fr]">
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
                  className: "w-full sm:w-auto",
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
            className="h-auto w-full rounded-md border object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <figcaption className="mt-1 text-[11px] text-muted-foreground">
            Kantin sore hari — sisa layak simpan didata sebelum tutup.
          </figcaption>
        </figure>
      </section>

      {/* LANGKAH */}
      <Reveal className="flex flex-col gap-2 py-10">
        <p className="text-xs font-bold tracking-[0.2em] text-primary">LANGKAH</p>
        <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Tiga langkah dari etalase ke meja makan.
        </h2>
        <ol className="divide-y divide-border border-b">
          {STEPS.map((s, i) => (
            <ChalkRow key={s.no} className="flex gap-4 py-4" delay={i * 0.09}>
              <span className="font-heading text-2xl font-extrabold text-primary tabular-nums">
                {s.no}
              </span>
              <div>
                <h3 className="font-bold leading-snug">{s.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </ChalkRow>
          ))}
        </ol>
        <p className="py-2 text-[11px] text-muted-foreground">
          Hanya makanan matang layak simpan • Jam masak selalu tampil • Tenant tanggung jawab mutu.
        </p>
      </Reveal>

      {/* DAMPAK */}
      <Reveal id="dampak" className="flex flex-col gap-2 py-10">
        <p className="text-xs font-bold tracking-[0.2em] text-primary">DAMPAK</p>
        <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Angka nyata dari transaksi tercatat.
        </h2>
        <ul className="divide-y divide-border border-b">
          {DAMPAK.map((f) => (
            <li key={f.name} className="flex items-baseline justify-between gap-4 py-3">
              <h3 className="font-bold leading-snug">{f.name}</h3>
              <p className="shrink-0 text-right text-sm text-muted-foreground">{f.plain}</p>
            </li>
          ))}
        </ul>
        <p className="py-2 text-[11px] text-muted-foreground">
          Berat pakai rata-rata sampel berkala. Tanpa klaim karbon.
        </p>
      </Reveal>

      {/* FAQ + CTA */}
      <Reveal className="mx-auto flex w-full max-w-3xl flex-col gap-2 py-10">
        <p className="text-xs font-bold tracking-[0.2em] text-primary">TANYA JAWAB</p>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Sering ditanyakan.</h2>
        <ul className="divide-y divide-border border-b">
          {FAQS.map((f) => (
            <li key={f.q} className="py-4">
              <h3 className="font-bold">{f.q}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{f.a}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mb-12 flex flex-col items-center gap-4 border-t-2 border-foreground px-6 py-12 text-center">
        <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Jangan biarkan porsi terakhir terbuang.
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Satu porsi terjual berarti satu porsi tidak jadi sampah dan satu mahasiswa makan lebih
          hemat.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
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
              href="/masuk"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              Masuk Sekarang
            </Link>
          </Pressable>
        </div>
      </Reveal>
    </div>
  );
}

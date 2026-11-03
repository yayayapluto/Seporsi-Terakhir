import { cn } from "cn";
import {
  BarChart3,
  ChartColumn,
  Check,
  Clock,
  PackageCheck,
  QrCode,
  Scale,
  Store,
  Timer,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SieraSectionTitle, SieraTile, sieraCardClass } from "@/components/siera";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { ChalkRow, PickupCountdown, Pressable, Reveal } from "./reveal";

const BOARD = [
  {
    name: "Nasi Ayam Geprek Sambal Bawang",
    tenant: "Kantin Bu Sri",
    cooked: "15.30",
    left: "Sisa 3",
    normal: "Rp16.000",
    price: "Rp8.500",
  },
  {
    name: "Soto Ayam Lamongan Komplit",
    tenant: "Warung Barokah",
    cooked: "15.45",
    left: "Sisa 2",
    normal: "Rp14.000",
    price: "Rp7.000",
  },
  {
    name: "Paket Nasi Sayur + Telur Balado",
    tenant: "Kantin Melati",
    cooked: "16.00",
    left: "Sisa 4",
    normal: "Rp12.000",
    price: "Rp6.000",
  },
];

const MASALAH = [
  {
    icon: Store,
    title: "Tenant Kantin",
    body: "Makanan matang yang masih layak sering terbuang di akhir hari karena pembeli sore sepi.",
  },
  {
    icon: Wallet,
    title: "Mahasiswa",
    body: "Uang saku terbatas, apalagi sore hari setelah praktikum. Opsi makan murah berkualitas itu penting.",
  },
  {
    icon: BarChart3,
    title: "Kampus",
    body: "Belum ada data riil berapa banyak makanan kantin yang terbuang setiap hari.",
  },
];

const LANGKAH = [
  {
    title: "Buka katalog",
    body: "Lihat menu, harga diskon, sisa kuota, dan jam masak yang transparan.",
  },
  {
    title: "Pesan dan kunci kuota",
    body: "Pilih porsi, langsung dapat kode reservasi QR dan slot waktu pickup sore.",
  },
  {
    title: "Ambil dan bayar",
    body: "Datang ke tenant, bayar tunai uang pas atau QRIS tenant.",
  },
  {
    title: "Scan QR selesai",
    body: "Pickup tercatat otomatis sebagai kontribusi penyelamatan porsimu.",
  },
];

const AMAN = [
  {
    title: "Hanya makanan matang yang layak simpan",
    body: "Prioritas olahan nasi, lauk goreng/bakar, dan tumisan. Tanpa makanan mentah.",
  },
  {
    title: "Batas jual 120–240 menit setelah masak",
    body: "Batas spesifik disepakati per jenis makanan demi rasa dan higienitas.",
  },
  {
    title: "Jam masak selalu terlihat",
    body: "Waktu masak tampil di setiap baris katalog sebelum kamu memesan.",
  },
];
const AMAN_ICONS = [Check, Timer, Clock] as const;

const CARA_KERJA_STEPS = [
  {
    icon: Store,
    title: "Tenant unggah surplus layak makan",
    body: "Menjelang tutup, tenant catat jam masak, jumlah, harga diskon. Batas jual 120–240 menit.",
  },
  {
    icon: QrCode,
    title: "Mahasiswa pesan, dapat QR",
    body: "Reservasi gratis. Kuota berkurang, QR pickup terbit. Tanpa data pribadi di QR.",
  },
  {
    icon: Wallet,
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
    q: "Apakah ini sisa dari piring orang lain?",
    a: "Bukan. Ini porsi utuh yang belum pernah disajikan — makanan bersih di etalase atau panci tenant yang belum laku menjelang tutup.",
  },
  {
    q: "Bagaimana cara bayar?",
    a: "Selalu di tempat ke tenant, tunai atau QRIS tenant. Aplikasi hanya untuk katalog, kuota, dan data dampak.",
  },
  {
    q: "Kapan katalog dibuka?",
    a: "Tenant memperbarui pukul 15.30–16.30 WIB. Pickup dibuka 16.30 hingga maksimal 18.00 WIB.",
  },
  {
    q: "Bagaimana higienitas dipastikan?",
    a: "Usia konsumsi dibatasi 2–4 jam pasca matang, wadah tertutup panas/hangat, dan jam masak transparan.",
  },
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

export default async function Home() {
  const current = await getCurrentUser();
  const primaryHref =
    current?.role === "tenant" || current?.role === "admin"
      ? homeForRole(current.role)
      : ROUTES.katalog;
  const primaryLabel =
    current?.role === "tenant" || current?.role === "admin"
      ? "Buka Dasbor"
      : "Lihat Porsi Hari Ini";
  return (
    <div className="ml-[calc(50%-50vw)] w-screen max-w-none flex-1 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <section className="grid gap-8 py-10 sm:py-14 md:grid-cols-2 md:items-start lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Sisa layak makan, harga mahasiswa.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Etalase sore kantin kampus: porsi utuh yang belum laku menjelang tutup — bukan sisa
              piring. Jam masak tertera, pickup 16.30–18.00, bayar di tempat ke tenant.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Pressable className="w-full sm:w-auto">
                <Link
                  href={primaryHref}
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "w-full border-b-[3px] border-b-[#1E5A36] focus-visible:ring-2 focus-visible:ring-[#2E7D4F] active:translate-y-[2px] active:border-b-0 sm:w-auto",
                  })}
                >
                  {primaryLabel}
                </Link>
              </Pressable>
              <Pressable className="w-full sm:w-auto">
                <Link
                  href={ROUTES.caraKerja}
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  })}
                >
                  Cara Kerja
                </Link>
              </Pressable>
            </div>
            <p className="text-xs text-muted-foreground">
              Bayar di tempat • Jam masak tertera • Maks 2 porsi/hari
            </p>
          </div>

          {/* Etalase: foto kantin + papan porsi sore ini */}
          <div className="flex flex-col gap-4">
            <figure className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]">
              <Image
                src="/images/foto_kantin.webp"
                alt="Suasana kantin kampus sore hari"
                width={1040}
                height={650}
                className="aspect-[16/10] w-full object-cover"
                priority
              />
              <figcaption className="px-4 py-2 text-[12px] text-muted-foreground">
                Kantin sore — contoh, bukan stok live.
              </figcaption>
            </figure>
            <section
              aria-label="Contoh papan porsi sore ini"
              className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-dashed border-line bg-[#EAF5ED] px-4 py-3 sm:px-5">
                <p className="text-xs font-bold text-[#1E5A36] sm:text-sm">
                  Sore ini · Kantin Gedung A
                </p>
                <p className="text-xs font-bold text-[#1E5A36] sm:text-sm">
                  <span className="sr-only">Pickup tutup dalam </span>
                  <PickupCountdown />
                </p>
              </div>
              <ul className="divide-y divide-dashed divide-line">
                {BOARD.map((item, i) => (
                  <ChalkRow
                    key={item.name}
                    className="grid grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[72px_1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
                    delay={i * 0.07}
                  >
                    <span
                      aria-hidden
                      className="block h-14 w-14 rounded-xl border border-line bg-[#F1F5F2] sm:h-[72px] sm:w-[72px]"
                    />
                    <span>
                      <span className="block font-bold leading-snug">
                        <span
                          aria-hidden
                          className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary align-middle text-[11px] font-extrabold text-primary-foreground"
                        >
                          {i + 1}
                        </span>
                        {item.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.tenant} • Dimasak {item.cooked} • {item.left}
                      </span>
                    </span>
                    <span className="text-right text-sm">
                      <del className="mr-1.5 text-xs text-muted-foreground">
                        <span className="sr-only">Harga awal: </span>
                        {item.normal}
                      </del>
                      <strong data-pop className="text-base text-accent-strong">
                        {item.price}
                      </strong>
                    </span>
                  </ChalkRow>
                ))}
              </ul>
              <p className="border-t border-dashed border-line px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
                Stok live ada di katalog. Contoh sintetis.
              </p>
            </section>
          </div>
        </section>

        {/* MASALAH — banner info */}
        <Reveal className="flex flex-col gap-4 py-10">
          <SieraSectionTitle>Kenapa ini ada</SieraSectionTitle>
          <div className="grid gap-5 rounded-[20px] bg-[#DCEBE0] p-5 sm:p-6 md:grid-cols-[1fr_1.4fr] md:items-center">
            <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
              Satu masalah, dua pihak butuh.
            </h2>
            <ul className="flex flex-col gap-4">
              {MASALAH.map((m) => (
                <li key={m.title} className="flex items-center gap-3">
                  <SieraTile className="bg-white">
                    <m.icon className="size-5" strokeWidth={1.75} />
                  </SieraTile>
                  <div className="min-w-0">
                    <h3 className="text-[15px] leading-snug font-extrabold text-[#1C2826]">
                      {m.title}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-[#3E4F49]">{m.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* CARA KERJA */}
        <Reveal className="flex flex-col gap-2 py-10">
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dari katalog sampai makan, 4 langkah.
          </h2>
          <ol className="divide-y divide-border border-b lg:grid lg:grid-cols-4 lg:gap-x-8 lg:divide-y-0 lg:border-b-0">
            {LANGKAH.map((s) => (
              <li key={s.title} className="flex gap-3 py-4">
                <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">
            Tanpa perantara dana: kamu membayar langsung ke tenant saat pickup.
          </p>
        </Reveal>

        {/* CARA KERJA DETAIL */}
        <Reveal id="cara-kerja" className="flex scroll-mt-24 flex-col gap-3 py-10">
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Cara kerja penyelamatan porsi
          </h2>
          <ol
            className={cn(
              sieraCardClass,
              "flex flex-col divide-y divide-dashed divide-line px-4 sm:px-5",
            )}
          >
            {CARA_KERJA_STEPS.map((s) => (
              <li key={s.title} className="flex min-h-11 items-center gap-3 py-4">
                <SieraTile>
                  <s.icon className="size-5" strokeWidth={1.75} />
                </SieraTile>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] leading-snug font-bold text-[#1C2826]">{s.title}</h3>
                  <p className="mt-0.5 text-[13px] text-[#64746B]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="py-2 text-xs text-muted-foreground">
            Hanya makanan matang layak simpan • Jam masak selalu tampil • Tenant tanggung jawab
            mutu.
          </p>
        </Reveal>

        {/* DAMPAK */}
        <Reveal id="dampak" className="flex scroll-mt-24 flex-col gap-3 py-10">
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Angka nyata dari transaksi tercatat.
          </h2>
          <ul
            className={cn(
              sieraCardClass,
              "flex flex-col divide-y divide-dashed divide-line px-4 sm:px-5",
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

        {/* KEAMANAN */}
        <Reveal id="keamanan" className="flex scroll-mt-24 flex-col gap-2 py-10">
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Aturan jelas supaya tetap aman.
          </h2>
          <div
            className={cn(
              sieraCardClass,
              "grid divide-y divide-dashed divide-line md:grid-cols-3 md:divide-x md:divide-y-0",
            )}
          >
            {AMAN.map((f, i) => {
              const Icon = AMAN_ICONS[i] ?? Check;
              return (
                <div key={f.title} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                  <SieraTile>
                    <Icon className="size-5" strokeWidth={1.75} />
                  </SieraTile>
                  <div className="min-w-0">
                    <p className="text-[15px] leading-snug font-extrabold text-[#1C2826]">
                      {f.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Tenant bertanggung jawab atas kualitas dan higienitas. Detail lengkap di{" "}
            <Link href={ROUTES.caraKerja} className="font-semibold text-foreground underline">
              Cara Kerja
            </Link>
            .
          </p>
        </Reveal>

        {/* FAQ */}
        <Reveal
          id="faq"
          className="mx-auto flex w-full max-w-3xl scroll-mt-24 flex-col gap-2 py-10"
        >
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Pertanyaan yang sering ditanyakan.
          </h2>
          <Accordion defaultValue={FAQS[0] ? [FAQS[0].q] : []} className="mt-1 border-b">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="border-t first:border-t-0">
                <AccordionTrigger className="py-4 text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{f.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        {/* PITA TUTUP — hijau pekat */}
        <Reveal className="mb-12 overflow-hidden rounded-[24px] bg-primary px-6 py-12 text-center text-primary-foreground sm:py-14">
          <h2 className="mx-auto max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Jangan biarkan porsi terakhir terbuang.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-primary-foreground/80">
            Satu porsi terjual berarti satu porsi tidak jadi sampah dan satu mahasiswa makan lebih
            hemat.
          </p>
          <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            <Pressable className="w-full sm:w-auto">
              <Link
                href="/masuk"
                className="inline-flex h-9 min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary-foreground px-2.5 text-sm font-medium whitespace-nowrap text-primary transition-colors outline-none select-none hover:bg-primary-foreground/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto"
              >
                Masuk Sekarang
              </Link>
            </Pressable>
            <Pressable className="w-full sm:w-auto">
              <Link
                href="/tenant/pendaftaran"
                className="inline-flex h-9 min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-primary-foreground/40 px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors outline-none select-none hover:bg-primary-foreground/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto"
              >
                Daftar sebagai Tenant
              </Link>
            </Pressable>
          </div>
          <p className="mt-4 text-xs text-primary-foreground/70">
            Tahap awal SDG 12 di lingkungan kampus
          </p>
        </Reveal>
      </div>
    </div>
  );
}

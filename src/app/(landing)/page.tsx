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
  Utensils,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { SieraTile, sieraCardClass } from "@/components/siera";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import {
  MAX_QUANTITY_PER_ORDER,
  PRICE_ROUNDING_IDR,
  SELL_WINDOW_MAX_MINUTES,
  SELL_WINDOW_MIN_MINUTES,
} from "@/lib/domain/constants";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { LiveThread } from "./live-thread";
import { Pressable, Reveal, ThreadRail, ThreadRoot } from "./thread";

/** Contoh papan (sintetis, ditandai) — jam masak + sisa + harga diskon. */
const BOARD = [
  {
    name: "Nasi Ayam Geprek Sambal Bawang",
    tenant: "Kantin Bu Sri",
    cooked: "15.30",
    left: "Sisa 3",
    normal: 16000,
    price: 8500,
  },
  {
    name: "Soto Ayam Lamongan Komplit",
    tenant: "Warung Barokah",
    cooked: "15.45",
    left: "Sisa 2",
    normal: 14000,
    price: 7000,
  },
  {
    name: "Paket Nasi Sayur + Telur Balado",
    tenant: "Kantin Melati",
    cooked: "16.00",
    left: "Sisa 4",
    normal: 12000,
    price: 6000,
  },
];

const LANGKAH = [
  {
    icon: Store,
    title: "Tenant catat sisa layak",
    body: "Jam masak, jumlah, harga diskon. Batas jual 120–240 menit pasca-masak.",
  },
  {
    icon: QrCode,
    title: "Kamu pesan, dapat QR",
    body: "Reservasi gratis, kuota berkurang, kode pickup terbit. Tanpa data pribadi di QR.",
  },
  {
    icon: Utensils,
    title: "Ambil, bayar di tempat",
    body: "Tunjukkan QR sebelum batas waktu, bayar tunai atau QRIS ke kasir tenant.",
  },
] as const;

/** Metrik dampak: tiap angka punya 1 baris metodologi (Stripe-trust). */
const DAMPAK = [
  {
    icon: PackageCheck,
    label: "Porsi terselamatkan",
    value: "1 QR terpindai",
    method: "Satu QR terpindai = satu porsi.",
  },
  {
    icon: Scale,
    label: "Berat dicegah",
    value: "× rata-rata berat menu",
    method: "Porsi × rata-rata berat dari penimbangan sampel berkala.",
  },
  {
    icon: Wallet,
    label: "Uang hemat mahasiswa",
    value: "selisih normal − diskon",
    method: "(Harga normal − harga diskon) × porsi terambil.",
  },
  {
    icon: Store,
    label: "Omzet tenant",
    value: "100% ke kasir",
    method: "Harga diskon × porsi terambil; nol potongan platform saat pilot.",
  },
  {
    icon: ChartColumn,
    label: "Porsi laku",
    value: "terambil ÷ diunggah",
    method: "Porsi diambil dibagi porsi diunggah pada hari yang sama.",
  },
] as const;

const PERAN = [
  {
    icon: Wallet,
    title: "Mahasiswa: makan layak, harga miring",
    body: "Porsi utuh yang belum laku menjelang tutup, didiskon 40–50%. Bayar hanya saat ambil.",
    points: [
      "Porsi utuh, bukan sisa piring",
      "Jam masak selalu terlihat",
      `Maks ${MAX_QUANTITY_PER_ORDER} porsi/hari`,
    ],
  },
  {
    icon: BarChart3,
    title: "Tenant: omzet yang tadinya nol",
    body: "Surplus akhir hari tetap menghasilkan, tanpa potongan platform selama pilot.",
    points: ["Posting 3 ketukan", "Harga saran 45%, bisa diedit", "Berhenti kapan saja"],
  },
] as const;

const FAQS = [
  {
    q: "Apakah ini sisa dari piring orang lain?",
    a: "Bukan. Ini porsi utuh yang belum pernah disajikan, makanan bersih di etalase atau panci tenant yang belum laku menjelang tutup.",
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
    a: `Usia konsumsi dibatasi ${SELL_WINDOW_MIN_MINUTES / 60}–${SELL_WINDOW_MAX_MINUTES / 60} jam pasca-matang, wadah tertutup, dan jam masak transparan.`,
  },
  {
    q: "Terlambat ambil?",
    a: "Batalkan dari halaman pesanan agar kuota kembali. Lewat batas waktu, sistem tolak pickup.",
  },
  {
    q: "Bawa wadah sendiri?",
    a: "Boleh. Tanya tenant saat ambil; sebagian besar gerai menyambut.",
  },
  {
    q: "Tenant dipungut biaya?",
    a: "Tidak. Sukarela, tanpa potongan selama pilot, bisa berhenti kapan saja.",
  },
];

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function Home() {
  const current = await getCurrentUser();
  const staff = current?.role === "tenant" || current?.role === "admin";
  const primaryHref = staff ? homeForRole(current.role) : ROUTES.katalog;
  const primaryLabel = staff ? "Buka dasbor" : "Lihat porsi sore ini";

  return (
    <ThreadRoot>
      <div className="ml-[calc(50%-50vw)] w-screen max-w-none flex-1 px-4 pt-20 pb-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          {/* HERO — proposisi 1 kalimat, 1 CTA primer + 1 sekunder, benang mulai. */}
          <section className="relative py-8 sm:py-12">
            <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] lg:gap-14">
              <div className="flex flex-col gap-6">
                <h1 className="max-w-xl text-balance font-heading text-4xl font-extrabold leading-[1.03] tracking-tight md:text-5xl lg:text-[3.5rem] lg:leading-[1.02]">
                  Sisa layak makan kantin, harga mahasiswa.
                </h1>
                <p className="max-w-lg text-base text-muted-foreground text-pretty">
                  Etalase sore: porsi utuh yang belum laku menjelang tutup. Jam masak tertera,
                  jendela jual {SELL_WINDOW_MIN_MINUTES}–{SELL_WINDOW_MAX_MINUTES} menit, bayar di
                  tempat.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Pressable className="w-full sm:w-auto">
                    <Link
                      href={primaryHref}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "w-full border-b-[3px] border-b-[#1E5A36] px-6 text-base focus-visible:ring-2 focus-visible:ring-[#2E7D4F] active:translate-y-[2px] active:border-b-0 sm:w-auto",
                      )}
                    >
                      {primaryLabel}
                    </Link>
                  </Pressable>
                  <Pressable className="w-full sm:w-auto">
                    <Link
                      href={ROUTES.tenantPendaftaran}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "w-full px-6 text-base sm:w-auto",
                      )}
                    >
                      Daftar jadi tenant
                    </Link>
                  </Pressable>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bayar di tempat · Jam masak tertera · Maks {MAX_QUANTITY_PER_ORDER} porsi/hari
                </p>
              </div>

              {/* Benang dimulai: garis waktu hidup + papan contoh. */}
              <div className="flex flex-col gap-4">
                <LiveThread />
                <section
                  aria-label="Contoh papan porsi sore ini"
                  className={cn(sieraCardClass, "relative")}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-dashed border-line bg-[#EAF5ED] px-4 py-3 sm:px-5">
                    <p className="text-xs font-bold text-[#1E5A36] sm:text-sm">
                      Sore ini · Kantin Gedung A
                    </p>
                    <p className="text-xs font-bold text-[#1E5A36] sm:text-sm">contoh</p>
                  </div>
                  <ul className="divide-y divide-dashed divide-line">
                    {BOARD.map((item, i) => (
                      <li
                        key={item.name}
                        className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3 sm:px-5 sm:py-4"
                      >
                        <span
                          aria-hidden
                          className="flex size-10 items-center justify-center rounded-xl bg-[#F1F5F2] text-xs font-extrabold text-[#64746B]"
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold leading-snug">{item.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {item.tenant} · Dimasak {item.cooked} · {item.left}
                          </span>
                        </span>
                        <span className="text-right text-sm whitespace-nowrap">
                          <del className="mr-1.5 text-xs text-muted-foreground">
                            <span className="sr-only">Harga normal: </span>
                            {idr.format(item.normal)}
                          </del>
                          <strong className="text-base text-accent-strong">
                            {idr.format(item.price)}
                          </strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-dashed border-line px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
                    Papan contoh, bukan stok live. Stok sebenarnya ada di katalog.
                  </p>
                </section>
              </div>
            </div>
          </section>

          {/* BENANG BERJALAN — cara kerja 3 langkah, tersambung rail. */}
          <section id="cara-kerja" className="relative scroll-mt-24 py-12 sm:py-16">
            <Reveal className="flex flex-col gap-6">
              <h2 className="max-w-2xl font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                Satu porsi, tiga ketukan, nol perantara.
              </h2>
            </Reveal>

            <div className="relative mt-10 pl-10 sm:pl-14">
              <ThreadRail className="left-3 sm:left-5" />
              <ol className="flex flex-col gap-8">
                {LANGKAH.map((s, i) => (
                  <Reveal key={s.title} delay={i * 0.06}>
                    <li className="relative">
                      <span
                        aria-hidden
                        className="absolute top-1.5 -left-10 flex size-7 items-center justify-center rounded-full border border-line bg-white text-xs font-extrabold text-[#1E5A36] sm:-left-14"
                      >
                        {i + 1}
                      </span>
                      <h3 className="font-heading text-lg font-bold">{s.title}</h3>
                      <p className="mt-1 max-w-xl text-sm text-muted-foreground text-pretty">
                        {s.body}
                      </p>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
            <p className="mt-8 pl-10 text-xs text-muted-foreground sm:pl-14">
              Hanya makanan matang layak simpan · Tenant bertanggung jawab atas mutu dan higienitas.
            </p>
          </section>

          {/* BUKTI ANGKA — tiap angka berpasangan metodologi. */}
          <section id="dampak" className="relative scroll-mt-24 py-12 sm:py-16">
            <Reveal className="flex flex-col gap-6">
              <h2 className="max-w-2xl font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                Angka yang bisa kamu lacak, bukan gaib.
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
                Tiap angka dihitung dari pickup ber-QR yang tercatat. Rumusnya terbuka, tanpa klaim
                karbon.
              </p>
            </Reveal>
            <Reveal className="mt-8">
              <ul className={cn(sieraCardClass, "divide-y divide-dashed divide-line")}>
                {DAMPAK.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                    <SieraTile>
                      <f.icon className="size-5" strokeWidth={1.75} />
                    </SieraTile>
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <h3 className="text-[15px] leading-snug font-bold text-[#1C2826]">
                        {f.label}
                      </h3>
                      <p className="text-sm font-semibold text-accent-strong">{f.value}</p>
                      <p className="w-full text-xs text-muted-foreground">{f.method}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>

          {/* PERAN GANDA — satu section, dua sisi benang. */}
          <section id="peran" className="relative scroll-mt-24 py-12 sm:py-16">
            <Reveal className="flex flex-col gap-6">
              <h2 className="max-w-2xl font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                Satu benang, dua pihak yang menang.
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {PERAN.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.08}>
                  <div className={cn(sieraCardClass, "flex h-full flex-col gap-3 p-5 sm:p-6")}>
                    <SieraTile>
                      <p.icon className="size-5" strokeWidth={1.75} />
                    </SieraTile>
                    <h3 className="font-heading text-xl font-extrabold tracking-tight">
                      {p.title}
                    </h3>
                    <p className="text-sm text-muted-foreground text-pretty">{p.body}</p>
                    <ul className="mt-1 flex flex-col gap-2">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-center gap-2 text-sm">
                          <Check
                            className="size-4 shrink-0 text-primary"
                            strokeWidth={2}
                            aria-hidden
                          />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* KEAMANAN + FAQ — penutup benang sebelum CTA. */}
          <section id="keamanan" className="relative scroll-mt-24 py-12 sm:py-16">
            <Reveal className="flex flex-col gap-2">
              <h2 className="max-w-2xl font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                Aturan jelas supaya tetap aman.
              </h2>
            </Reveal>
            <Reveal className="mt-6">
              <div
                className={cn(
                  sieraCardClass,
                  "grid divide-y divide-dashed divide-line md:grid-cols-3 md:divide-x md:divide-y-0",
                )}
              >
                {[
                  { icon: Check, title: "Makanan matang saja", body: "Tanpa bahan mentah." },
                  {
                    icon: Timer,
                    title: `${SELL_WINDOW_MIN_MINUTES}–${SELL_WINDOW_MAX_MINUTES} mnt batas jual`,
                    body: "Dihitung dari jam masak.",
                  },
                  { icon: Clock, title: "Jam masak terlihat", body: "Tampil di tiap baris." },
                ].map((f) => (
                  <div key={f.title} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                    <SieraTile>
                      <f.icon className="size-5" strokeWidth={1.75} />
                    </SieraTile>
                    <div className="min-w-0">
                      <p className="text-[15px] leading-snug font-extrabold text-[#1C2826]">
                        {f.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal className="mt-3">
              <p className="px-1 text-xs text-muted-foreground">
                Harga diskon dibulatkan ke {idr.format(PRICE_ROUNDING_IDR).replace("Rp", "Rp")}{" "}
                terdekat, selalu di bawah harga normal.
              </p>
            </Reveal>
          </section>

          <section
            id="faq"
            className="relative mx-auto w-full max-w-3xl scroll-mt-24 py-12 sm:py-16"
          >
            <Reveal className="flex flex-col gap-2">
              <h2 className="font-heading text-3xl font-extrabold tracking-tight">
                Pertanyaan yang sering ditanyakan.
              </h2>
            </Reveal>
            <Accordion defaultValue={FAQS[0] ? [FAQS[0].q] : []} className="mt-4 border-b">
              {FAQS.map((f) => (
                <AccordionItem key={f.q} value={f.q} className="border-t first:border-t-0">
                  <AccordionTrigger className="py-4 text-left font-semibold">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{f.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* CTA PENUTUP — benang menutup. */}
          <Reveal className="relative mb-8 overflow-hidden rounded-[24px] bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="mx-auto max-w-xl font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Jangan biarkan porsi terakhir terbuang.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/85">
              Satu porsi terjual berarti satu porsi tidak jadi sampah dan satu mahasiswa makan lebih
              hemat.
            </p>
            <div className="mx-auto mt-7 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
              <Pressable className="w-full sm:w-auto">
                <Link
                  href={ROUTES.katalog}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full bg-primary-foreground px-6 text-base text-primary hover:bg-primary-foreground/90 sm:w-auto",
                  )}
                >
                  Lihat porsi sore ini
                </Link>
              </Pressable>
              <Pressable className="w-full sm:w-auto">
                <Link
                  href={ROUTES.tenantPendaftaran}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full border-primary-foreground/40 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto",
                  )}
                >
                  Daftar jadi tenant
                </Link>
              </Pressable>
            </div>
            <p className="mt-5 text-xs text-primary-foreground/70">
              Tahap awal SDG 12 di lingkungan kampus
            </p>
          </Reveal>
        </div>
      </div>
    </ThreadRoot>
  );
}

import { Check, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
  SELL_WINDOW_MAX_MINUTES,
  SELL_WINDOW_MIN_MINUTES,
} from "@/lib/domain/constants";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { LangkahStagger } from "./langkah-stagger";
import { Pressable, Reveal } from "./thread";

export const metadata: Metadata = { title: "Penyelamatan Surplus Pangan" };

const LANGKAH = [
  {
    num: "01",
    title: "Tenant unggah surplus layak makan",
    body: "Menjelang tutup, tenant catat jam masak, jumlah, harga diskon. Batas jual 2–4 jam pasca-matang.",
    panel: (
      <div className="w-[72%] rounded-[14px] bg-white p-[18px] shadow-[0_6px_18px_rgba(23,38,29,0.12)]">
        <p className="mb-1.5 font-heading text-[15px] font-bold">Unggah porsi</p>
        <div className="flex justify-between border-b border-[#EEF2EF] py-[7px] text-[13px]">
          <span className="text-[#5B6B62]">Menu</span>
          <b>Nasi Ayam Geprek</b>
        </div>
        <div className="flex justify-between border-b border-[#EEF2EF] py-[7px] text-[13px]">
          <span className="text-[#5B6B62]">Dimasak</span>
          <b>15.30 WIB</b>
        </div>
        <div className="flex justify-between border-b border-[#EEF2EF] py-[7px] text-[13px]">
          <span className="text-[#5B6B62]">Jumlah</span>
          <b>3</b>
        </div>
        <div className="flex justify-between py-[7px] text-[13px]">
          <span className="text-[#5B6B62]">Harga diskon</span>
          <b className="text-[#1E532C]">Rp 8.500</b>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    title: "Mahasiswa pesan, dapat QR",
    body: "Reservasi gratis. Kuota berkurang, QR pickup terbit. Tanpa data pribadi di QR.",
    panel: (
      <div className="w-[72%] rounded-[14px] bg-white p-[18px] text-center shadow-[0_6px_18px_rgba(23,38,29,0.12)]">
        <p className="font-heading text-[15px] font-bold">Kode pickup</p>
        <div className="mx-auto my-3.5 flex size-28 items-center justify-center rounded-xl border-2 border-[#17261D] text-[#17261D]">
          <QrCode className="size-16" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="text-xs text-[#5B6B62]">Ambil 16.30–18.00 WIB</p>
      </div>
    ),
  },
  {
    num: "03",
    title: "Ambil di gerai, bayar di tempat",
    body: "Tunjukkan QR sebelum batas waktu. Tenant pindai dan konfirmasi. Bayar tunai atau QRIS ke kasir.",
    panel: (
      <div className="w-[72%] rounded-[14px] bg-white p-[18px] shadow-[0_6px_18px_rgba(23,38,29,0.12)]">
        <p className="mb-2.5 font-heading text-[15px] font-bold">Pickup di gerai</p>
        <div className="flex items-center gap-2 rounded-[10px] border border-[#C4E0CC] bg-[#E6F3EA] px-3 py-2.5 text-[13px] font-bold text-[#1E532C]">
          <Check className="size-[18px]" strokeWidth={2.2} aria-hidden />
          QR terpindai
        </div>
        <div className="mt-2 flex justify-between border-b border-[#EEF2EF] py-[7px] text-[13px]">
          <span className="text-[#5B6B62]">Bayar</span>
          <b>Tunai / QRIS</b>
        </div>
        <div className="flex justify-between py-[7px] text-[13px]">
          <span className="text-[#5B6B62]">Total</span>
          <b className="text-[#1E532C]">Rp 8.500</b>
        </div>
      </div>
    ),
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

export default async function Home() {
  const current = await getCurrentUser();
  const staff = current?.role === "tenant" || current?.role === "admin";
  const primaryHref = staff ? homeForRole(current.role) : ROUTES.katalog;
  const primaryLabel = staff ? "Buka dasbor" : "Lihat Porsi Hari Ini";

  return (
    <div className="flex-1 bg-white text-[#17261D]">
      {/* HERO — foto etalase + proposisi + aksi primer. */}
      <section className="mx-auto w-full max-w-[1080px] px-5 pt-36 pb-[72px] md:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <figure className="m-0">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-[#D9E4DC]">
              <Image
                src="/images/foto_kantin.webp"
                alt="Etalase kantin kampus menjelang tutup"
                fill
                sizes="(min-width: 821px) 520px, 100vw"
                className="object-cover"
                priority
              />
            </div>
            <figcaption className="mt-2 text-xs text-[#5B6B62]">
              Kantin sore hari: sisa layak simpan didata sebelum tutup.
            </figcaption>
          </figure>

          <div className="flex flex-col gap-5">
            <h1 className="text-balance text-[36px] leading-[1.05] font-bold tracking-[-0.02em] min-[821px]:text-[52px]">
              Cara kerja penyelamatan porsi kampus.
            </h1>
            <p className="text-base leading-relaxed text-[#4A5B51]">
              Tenant menjual surplus layak makan dengan harga diskon. Mahasiswa pesan, ambil dengan
              QR, bayar di tempat.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Pressable>
                <Link
                  href={primaryHref}
                  className={cn(
                    buttonVariants(),
                    "min-h-12 rounded-[10px] bg-[#286F3B] px-[22px] text-[15px] font-semibold text-white hover:bg-[#1E532C]",
                  )}
                >
                  {primaryLabel}
                </Link>
              </Pressable>
              <Pressable>
                <Link
                  href="#langkah"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "min-h-12 rounded-[10px] px-[22px] text-[15px] font-semibold text-[#17261D] hover:bg-[#F4EFE6]",
                  )}
                >
                  Lihat Cara Hitung
                </Link>
              </Pressable>
            </div>
            <p className="text-[13px] text-[#5B6B62]">
              Bayar di tempat · Jam masak tertera · Maks {MAX_QUANTITY_PER_ORDER} porsi/hari
            </p>
          </div>
        </div>
      </section>

      {/* LANGKAH — tiga langkah dari etalase ke meja makan. */}
      <section
        id="langkah"
        className="mx-auto w-full max-w-[1080px] scroll-mt-24 px-5 pb-12 text-center md:px-8"
      >
        <span className="inline-flex h-7 items-center rounded-lg border border-[#C4E0CC] bg-[#E6F3EA] px-3 text-xs font-semibold tracking-[0.06em] text-[#1E532C] uppercase">
          Langkah
        </span>
        <h2 className="mt-4 text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] min-[821px]:text-[36px]">
          Tiga langkah dari etalase ke meja makan.
        </h2>
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-5 pb-12 md:px-8">
        <LangkahStagger steps={LANGKAH} />
      </section>

      {/* FAQ — garis tipis, tanpa kartu. */}
      <section
        id="faq"
        className="mx-auto w-full max-w-[1080px] scroll-mt-24 px-5 pt-10 pb-16 md:px-8"
      >
        <h2 className="mb-5 text-[28px] leading-[1.15] font-bold tracking-[-0.02em] min-[821px]:text-[34px]">
          Pertanyaan yang sering ditanyakan.
        </h2>
        <Accordion defaultValue={FAQS[0] ? [FAQS[0].q] : []} className="border-t border-[#E3E9E5]">
          {FAQS.map((item) => (
            <AccordionItem key={item.q} value={item.q} className="border-b border-[#E3E9E5]">
              <AccordionTrigger className="min-h-14 items-center gap-4 py-0 text-[15px] font-semibold text-[#17261D] hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-[#5B6B62]">
                <p>{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA penutup. */}
      <section className="mx-auto w-full max-w-[1080px] px-5 pb-[72px] md:px-8">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-[28px] bg-[#2D7A4F] max-md:px-5 max-md:py-8 max-md:rounded-[20px] px-6 py-14 text-center text-white md:px-10 md:py-16">
            <h2 className="max-w-[14ch] text-balance text-[32px] leading-[1.1] font-bold tracking-[-0.02em] md:text-[40px]">
              Jangan biarkan porsi terakhir terbuang.
            </h2>
            <p className="max-w-[52ch] text-base leading-relaxed text-white/90">
              Satu porsi terjual berarti satu porsi tidak jadi sampah dan satu mahasiswa makan lebih
              hemat.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <Pressable>
                <Link
                  href={ROUTES.katalog}
                  className={cn(
                    buttonVariants(),
                    "min-h-12 rounded-[10px] bg-white px-[22px] text-[15px] font-semibold text-[#1E532C] hover:bg-[#F4EFE6] focus-visible:ring-white/70",
                  )}
                >
                  Lihat porsi sore ini
                </Link>
              </Pressable>
              <Pressable>
                <Link
                  href={ROUTES.tenantPendaftaran}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "min-h-12 rounded-[10px] border-white/60 bg-transparent px-[22px] text-[15px] font-semibold text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/70",
                  )}
                >
                  Daftar jadi tenant
                </Link>
              </Pressable>
            </div>
            <p className="mt-2 text-xs text-white/85">Tahap awal SDG 12 di lingkungan kampus</p>
          </div>
        </Reveal>
      </section>

      <footer className="bg-[#2D7A4F] py-10 text-white">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap justify-between gap-4 px-5 text-[13px] md:px-8">
          <span className="font-heading text-base font-extrabold">Seporsi Terakhir</span>
          <span className="text-white/90">© 2026 · Tahap awal SDG 12 di lingkungan kampus</span>
        </div>
      </footer>
    </div>
  );
}

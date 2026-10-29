import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { ChalkRow, Pressable, Reveal } from "./reveal";

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
    title: "Tenant Kantin",
    body: "Makanan matang yang masih layak sering terbuang di akhir hari karena pembeli sore sepi.",
  },
  {
    title: "Mahasiswa",
    body: "Uang saku terbatas, apalagi sore hari setelah praktikum. Opsi makan murah berkualitas itu penting.",
  },
  {
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
];

export default async function Home() {
  const current = await getCurrentUser();
  const primaryHref =
    current?.role === "tenant" || current?.role === "admin"
      ? homeForRole(current.role)
      : "/katalog";
  const primaryLabel =
    current?.role === "tenant" || current?.role === "admin"
      ? "Buka Dasbor"
      : "Lihat Porsi Hari Ini";
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
        {/* HERO */}
        <section className="grid gap-8 py-10 sm:py-14 md:grid-cols-2 md:items-center lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Porsi terakhir hari ini di kantin kampus.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Setiap sore, makanan layak makan di kantin kampus sering berakhir di tempat sampah.
              Porsi Terakhir mempertemukan tenant yang menjual sisa dengan harga diskon, dan
              mahasiswa yang butuh makan murah.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-stretch lg:flex-row lg:items-center">
              <Pressable className="w-full sm:w-auto md:w-full lg:w-auto">
                <Link
                  href={primaryHref}
                  className={buttonVariants({
                    size: "lg",
                    className: "w-full sm:w-auto md:w-full lg:w-auto",
                  })}
                >
                  {primaryLabel}
                </Link>
              </Pressable>
              <Pressable className="w-full sm:w-auto md:w-full lg:w-auto">
                <Link
                  href="/cara-kerja"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "w-full sm:w-auto md:w-full lg:w-auto",
                  })}
                >
                  Lihat Cara Kerja
                </Link>
              </Pressable>
            </div>
            <p className="text-xs text-muted-foreground">
              Bayar di tempat • Jam masak tertera • Maks 2 porsi/hari
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <figure>
              <Image
                src="/images/foto_kantin.webp"
                alt="Suasana kantin kampus sore hari"
                width={520}
                height={346}
                className="h-auto w-full rounded-md border object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <figcaption className="mt-1 text-[11px] text-muted-foreground">
                Suasana kantin kampus sore hari.
              </figcaption>
            </figure>
            <section
              aria-label="Contoh papan porsi sore ini"
              className="border-t-2 border-foreground"
            >
              <div className="flex items-baseline justify-between gap-2 border-b py-2 text-[11px] text-muted-foreground">
                <span>Contoh papan sore ini</span>
                <span>Pickup 16.30–18.00</span>
              </div>
              <ul className="divide-y divide-border">
                {BOARD.map((item, i) => (
                  <ChalkRow
                    key={item.name}
                    className="flex items-baseline justify-between gap-4 py-3"
                    delay={i * 0.09}
                  >
                    <div>
                      <h2 className="font-bold leading-snug">{item.name}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.tenant} • Dimasak {item.cooked} • {item.left}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-sm">
                      <s className="mr-1.5 text-xs text-muted-foreground">{item.normal}</s>
                      <strong className="text-base">{item.price}</strong>
                    </p>
                  </ChalkRow>
                ))}
              </ul>
              <p className="border-b py-2 text-[11px] text-muted-foreground">
                Stok live ada di katalog.
              </p>
            </section>
          </div>
        </section>

        {/* MASALAH */}
        <Reveal className="flex flex-col gap-2 py-10">
          <p className="text-xs font-bold tracking-[0.2em] text-primary">MASALAH</p>
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Satu masalah, dua pihak butuh.
          </h2>
          <ul className="divide-y divide-border border-b">
            {MASALAH.map((m) => (
              <li key={m.title} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-4">
                <h3 className="font-bold">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* CARA KERJA */}
        <Reveal className="flex flex-col gap-2 py-10">
          <p className="text-xs font-bold tracking-[0.2em] text-primary">CARA KERJA</p>
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dari katalog sampai makan, 4 langkah.
          </h2>
          <ol className="divide-y divide-border border-b lg:grid lg:grid-cols-4 lg:gap-x-8 lg:divide-y-0 lg:border-b-0">
            {LANGKAH.map((s, i) => (
              <li key={s.title} className="flex gap-4 py-4 lg:flex-col lg:gap-2">
                <span
                  aria-hidden
                  className="w-8 shrink-0 font-heading text-xl font-extrabold text-primary"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
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

        {/* KEAMANAN */}
        <Reveal id="keamanan" className="flex flex-col gap-2 py-10">
          <p className="text-xs font-bold tracking-[0.2em] text-primary">KEAMANAN PANGAN</p>
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Aturan jelas supaya tetap aman.
          </h2>
          <ul className="divide-y divide-border border-b">
            {AMAN.map((f) => (
              <li key={f.title} className="py-4">
                <h3 className="font-bold">{f.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Tenant bertanggung jawab atas kualitas dan higienitas. Detail lengkap di{" "}
            <Link href="/cara-kerja" className="font-semibold text-foreground underline">
              Cara Kerja
            </Link>
            .
          </p>
        </Reveal>

        {/* FAQ */}
        <Reveal id="faq" className="mx-auto flex w-full max-w-3xl flex-col gap-2 py-10">
          <p className="text-xs font-bold tracking-[0.2em] text-primary">TANYA JAWAB</p>
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

        {/* CTA */}
        <Reveal className="mb-12 flex flex-col items-center gap-4 border-t-2 border-foreground px-6 py-12 text-center">
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Jangan biarkan porsi terakhir terbuang.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Satu porsi terjual berarti satu porsi tidak jadi sampah dan satu mahasiswa makan lebih
            hemat.
          </p>
          <div className="flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row md:flex-col md:items-stretch lg:flex-row lg:items-center">
            <Pressable className="w-full sm:w-auto md:w-full lg:w-auto">
              <Link
                href="/masuk"
                className={buttonVariants({
                  size: "lg",
                  className: "w-full sm:w-auto md:w-full lg:w-auto",
                })}
              >
                Masuk Sekarang
              </Link>
            </Pressable>
            <Pressable className="w-full sm:w-auto md:w-full lg:w-auto">
              <Link
                href="/tenant/pendaftaran"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full sm:w-auto md:w-full lg:w-auto",
                })}
              >
                Daftar sebagai Tenant
              </Link>
            </Pressable>
          </div>
          <p className="text-xs text-muted-foreground">Tahap awal SDG 12 di lingkungan kampus</p>
        </Reveal>
      </div>
      <SiteFooter />
    </>
  );
}

import { Clock, QrCode, Wallet } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    icon: Clock,
    title: "Pilih porsi hemat",
    body: "Tenant mengunggah porsi sisa hari ini dengan jam masak yang jelas.",
  },
  {
    icon: QrCode,
    title: "Pesan & ambil QR",
    body: "Pesan porsimu, tunjukkan QR saat pengambilan di lokasi.",
  },
  {
    icon: Wallet,
    title: "Bayar di tempat",
    body: "Bayar tunai atau QRIS langsung ke tenant. Tanpa biaya platform.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-8 shadow-sm sm:p-12">
        <p className="w-fit rounded-full border border-[#CDE3D2] bg-[#EAF4EC] px-2.5 py-0.5 text-xs font-semibold text-primary">
          Pilot kampus · opt-in untuk tenant
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Makanan enak, harga miring, sampah berkurang.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Porsi Terakhir menghubungkan kantin kampus dengan mahasiswa: porsi sisa hari ini dijual
          murah sebelum dibuang. Hemat uang jajan, selamatkan makanan.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/katalog" className={buttonVariants({ size: "lg" })}>
            Saya Mahasiswa
          </Link>
          <Link href="/tenant" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            Saya Tenant
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <step.icon className="size-5" aria-hidden />
              </span>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.body}</CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-xl bg-secondary p-6 text-sm text-secondary-foreground sm:p-8">
        <h2 className="font-heading text-xl font-semibold">Kenapa ikut menyelamatkan porsi?</h2>
        <p className="mt-2 max-w-2xl">
          Setiap pengambilan tercatat sebagai data dampak nyata: porsi terselamatkan, sampah makanan
          berkurang, dan uang jajan hemat. Lihat cara kami menghitungnya di{" "}
          <Link href="/cara-kerja" className="font-semibold underline">
            Cara Kerja
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

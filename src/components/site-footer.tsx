import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative left-1/2 w-screen max-w-none -translate-x-1/2 bg-card">
      <div aria-hidden="true" className="h-px bg-border" />
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 font-heading text-base font-bold">
            <Image
              src="/images/Logo_UPNVJ.png"
              alt="Logo UPN Veteran Jakarta"
              width={28}
              height={28}
              className="size-7 object-contain"
            />
            Seporsi Terakhir
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Platform penyelamat surplus makanan kantin kampus. Makanan berkualitas tinggi, harga
            terjangkau mahasiswa, nol sisa mubazir.
          </p>
          <p className="text-xs font-semibold text-primary">
            Inisiatif kampus SDG 12: Konsumsi &amp; Produksi Bertanggung Jawab
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Eksplorasi">
          <p className="font-bold">Eksplorasi</p>
          <Link
            href="/katalog"
            className="inline-flex min-h-11 w-fit items-center text-muted-foreground hover:text-foreground"
          >
            Lihat Porsi Hari Ini
          </Link>
          <Link
            href="/cara-kerja"
            className="inline-flex min-h-11 w-fit items-center text-muted-foreground hover:text-foreground"
          >
            Cara Kerja &amp; Jadi Tenant
          </Link>
          <Link
            href="/#keamanan"
            className="inline-flex min-h-11 w-fit items-center text-muted-foreground hover:text-foreground"
          >
            Standar Keamanan
          </Link>
          <Link
            href="/#faq"
            className="inline-flex min-h-11 w-fit items-center text-muted-foreground hover:text-foreground"
          >
            Tanya Jawab (FAQ)
          </Link>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-bold">Ekosistem Kampus</p>
          <p className="text-muted-foreground">Unit Pengelola Lingkungan &amp; Keberlanjutan</p>
          <p className="text-muted-foreground">Pusat Kantin Mandiri Gedung A &amp; B</p>
          <p className="text-muted-foreground">Dikelola bersama Dewan Mahasiswa</p>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © 2026 Seporsi Terakhir — Tahap awal SDG 12 di lingkungan kampus
        </p>
      </div>
    </footer>
  );
}

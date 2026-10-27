import { Recycle } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 font-heading text-base font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Recycle className="size-4" aria-hidden />
            </span>
            Porsi Terakhir
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Platform penyelamat surplus makanan kantin kampus. Makanan berkualitas tinggi, harga
            terjangkau mahasiswa, nol sisa mubazir.
          </p>
          <p className="text-xs font-semibold text-primary">
            Pilot Inisiatif SDG 12: Konsumsi & Produksi Bertanggung Jawab
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Eksplorasi">
          <p className="font-bold">Eksplorasi</p>
          <Link href="/katalog" className="w-fit text-muted-foreground hover:text-foreground">
            Lihat Porsi Hari Ini
          </Link>
          <Link href="/cara-kerja" className="w-fit text-muted-foreground hover:text-foreground">
            Cara Kerja & Jadi Tenant
          </Link>
          <Link href="/#keamanan" className="w-fit text-muted-foreground hover:text-foreground">
            Standar Keamanan
          </Link>
          <Link href="/#faq" className="w-fit text-muted-foreground hover:text-foreground">
            Tanya Jawab (FAQ)
          </Link>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-bold">Ekosistem Kampus</p>
          <p className="text-muted-foreground">Unit Pengelola Lingkungan & Keberlanjutan</p>
          <p className="text-muted-foreground">Pusat Kantin Mandiri Gedung A & B</p>
          <p className="text-muted-foreground">Dikelola bersama Dewan Mahasiswa</p>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Dikelola bersama BEM dan unit sarana kampus © 2026 Porsi Terakhir (Project Infinity)
        </p>
      </div>
    </footer>
  );
}

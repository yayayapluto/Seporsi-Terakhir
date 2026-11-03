import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { SieraAuthShell } from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Akses ditolak" };

/** 403: peran salah — primer beranda, sekunder katalog sebagai jalan alternatif. */
export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col">
      <SieraAuthShell
        title="Halaman ini bukan untuk peranmu"
        intro="Akunmu tidak punya izin membuka halaman ini. Kalau kamu mencari makan murah sore ini, katalog tetap terbuka."
      >
        <div className="flex w-full flex-col gap-2">
          <Link
            href="/"
            className={buttonVariants({ size: "lg", className: "min-h-12 w-full text-[15px]" })}
          >
            Kembali ke beranda
          </Link>
          <Link
            href={ROUTES.katalog}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "min-h-12 w-full text-[15px]",
            })}
          >
            Lihat katalog
          </Link>
        </div>
      </SieraAuthShell>
    </main>
  );
}

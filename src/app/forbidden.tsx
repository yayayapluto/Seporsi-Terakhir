import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Akses ditolak" };

/** 403: peran salah — primer beranda, sekunder katalog sebagai jalan alternatif. */
export default function Forbidden() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-semibold text-muted-foreground">Akses ditolak</p>
      <h1 className="text-balance font-display text-3xl font-bold">
        Halaman ini bukan untuk peranmu
      </h1>
      <p className="text-pretty text-muted-foreground">
        Akunmu tidak punya izin membuka halaman ini. Kalau kamu mencari makan murah sore ini,
        katalog tetap terbuka.
      </p>
      <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link href="/" className={buttonVariants({ size: "lg", className: "min-h-11" })}>
          Kembali ke beranda
        </Link>
        <Link
          href="/katalog"
          className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-11" })}
        >
          Lihat katalog
        </Link>
      </div>
    </main>
  );
}

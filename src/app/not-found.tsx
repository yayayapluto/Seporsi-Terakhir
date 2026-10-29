import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

/** 404: alamat salah/kedaluwarsa — satu jalan keluar ke beranda. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-semibold text-muted-foreground">Halaman tidak ditemukan</p>
      <h1 className="text-balance font-display text-3xl font-bold">
        Alamat ini tidak ada di kantin kami
      </h1>
      <p className="text-pretty text-muted-foreground">
        Mungkin tautannya salah ketik atau halamannya sudah dipindah. Porsi sore ini masih
        menunggumu di beranda.
      </p>
      <Link href="/" className={buttonVariants({ size: "lg", className: "mt-2 min-h-11" })}>
        Kembali ke beranda
      </Link>
    </main>
  );
}

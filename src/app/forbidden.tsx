import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Akses ditolak" };

/** 403: peran salah — primer beranda, sekunder katalog sebagai jalan alternatif. */
export default function Forbidden() {
  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center gap-4 px-4 py-10">
      <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-gradient-to-b from-[#EAF5ED] to-white p-5">
        <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826]">
          Halaman ini bukan untuk peranmu
        </h1>
        <p className="text-sm text-[#1E5A36]">
          Akunmu tidak punya izin membuka halaman ini. Kalau kamu mencari makan murah sore ini,
          katalog tetap terbuka.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/"
          className={buttonVariants({ size: "lg", className: "min-h-12 w-full text-[15px]" })}
        >
          Kembali ke beranda
        </Link>
        <Link
          href="/katalog"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "min-h-12 w-full text-[15px]",
          })}
        >
          Lihat katalog
        </Link>
      </div>
    </main>
  );
}

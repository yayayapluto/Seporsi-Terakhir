import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

/** 404: alamat salah/kedaluwarsa — satu jalan keluar ke beranda. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center gap-4 px-5 py-10">
      <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-gradient-to-b from-[#EAF5ED] to-white p-5">
        <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826]">
          Alamat ini tidak ada di kantin kami
        </h1>
        <p className="text-sm text-[#1E5A36]">
          Mungkin tautannya salah ketik atau halamannya sudah dipindah. Porsi sore ini masih
          menunggumu di beranda.
        </p>
      </div>
      <Link
        href="/"
        className={buttonVariants({ size: "lg", className: "min-h-12 w-full text-[15px]" })}
      >
        Kembali ke beranda
      </Link>
    </main>
  );
}

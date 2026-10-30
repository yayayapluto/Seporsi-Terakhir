"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const KEY = "onboard-beranda-v1";

/** Banner Info Card onboarding: tampil sekali sampai dismiss. */
export function OnboardBanner() {
  const [gone, setGone] = useState(() =>
    typeof window === "undefined" ? true : localStorage.getItem(KEY) === "1",
  );
  if (gone) return null;
  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setGone(true);
  };
  return (
    <section
      aria-label="Panduan awal"
      className="relative flex flex-col gap-1 rounded-lg border border-[#E5E1D8] bg-white p-4"
    >
      <p className="text-sm font-bold text-[#1C2826]">Baru pertama kali ke sini?</p>
      <p className="text-[13px] leading-relaxed text-[#64746B]">
        Pilih porsinya, kunci buat kamu, lalu ambil dan bayar di kantin. Tanpa ongkir.{" "}
        <Link
          href="/cara-kerja"
          className="font-bold text-[#2E7D4F] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
        >
          Lihat cara kerja
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup panduan"
        className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full text-[#64746B] outline-none hover:bg-[#F4EFE6] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
      >
        <X className="size-4" strokeWidth={1.75} aria-hidden />
      </button>
    </section>
  );
}

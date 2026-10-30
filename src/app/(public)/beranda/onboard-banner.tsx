"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getJourneyResume } from "@/components/guided-tour";

const KEY = "onboard-beranda-v1";

/** Banner Info Card onboarding: tampil sekali sampai dismiss. */
export function OnboardBanner() {
  const [gone, setGone] = useState(() =>
    typeof window === "undefined" ? true : localStorage.getItem(KEY) === "1",
  );
  if (gone) return null;
  const resume = getJourneyResume();
  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setGone(true);
  };
  return (
    <section
      aria-label="Panduan awal"
      className="relative flex flex-col gap-1 rounded-[20px] border border-line bg-[#DCEBE0] p-4 pr-12"
    >
      <p className="text-sm font-bold text-[#1C2826]">Baru pertama kali ke sini?</p>
      <p className="text-[13px] leading-relaxed text-[#1E5A36]">
        Pilih porsinya, simpan buat kamu, lalu ambil dan bayar langsung di kantin. Tanpa ongkir.{" "}
        <Link
          href={resume ?? "/beranda?panduan=rantai"}
          className="font-bold text-[#1E5A36] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
        >
          {resume ? "Lanjutkan panduan" : "Ikuti panduan"}
        </Link>{" "}
        atau{" "}
        <Link
          href="/cara-kerja"
          className="font-bold text-[#1E5A36] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
        >
          lihat cara kerja
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup panduan"
        className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full text-[#1E5A36] outline-none hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
      >
        <X className="size-6" strokeWidth={1.75} aria-hidden />
      </button>
    </section>
  );
}

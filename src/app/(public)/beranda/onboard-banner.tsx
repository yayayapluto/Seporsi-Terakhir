"use client";

import { BellRing, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      aria-live="polite"
      className="relative flex flex-col gap-3 rounded-[20px] bg-[#DCEBE0] p-4"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup panduan"
        className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full text-[#1E5A36] hover:bg-white/60"
      >
        <X className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white">
          <BellRing className="size-5 text-[#2E7D4F]" aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5 pr-6">
          <p className="text-sm font-bold text-[#1C2826]">Baru pertama kali ke sini?</p>
          <p className="text-[13px] text-[#1C2826]">
            Pilih porsinya, kunci buat kamu, lalu ambil dan bayar di kantin. Tanpa ongkir.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href="/cara-kerja"
          className={cn(buttonVariants({ size: "sm" }), "min-h-9 rounded-2xl")}
        >
          Lihat cara kerja
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-9 items-center justify-center rounded-2xl border border-[#1E5A36]/30 px-4 text-sm font-semibold text-[#1E5A36]"
        >
          Nanti
        </button>
      </div>
    </section>
  );
}

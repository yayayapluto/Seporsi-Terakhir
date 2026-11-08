"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FooterWordmark } from "./footer-wordmark";

/** Footer landing: wordmark parallax + baris kecil + tombol kembali ke atas. */
export function FooterBottom() {
  return (
    <footer className="bg-[#2D7A4F] py-10 text-white">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4 px-5 md:px-8">
        <FooterWordmark />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-heading text-base font-extrabold">Seporsi Terakhir</span>
          <span className="text-white/90">© 2026 · Tahap awal SDG 12 di lingkungan kampus</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Kembali ke atas"
            className="min-h-11 min-w-11 border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              const lenis = (window as unknown as { __lenis?: { scrollTo(n: number): void } })
                .__lenis;
              if (lenis) lenis.scrollTo(0);
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <ArrowUp className="size-5" aria-hidden />
          </Button>
        </div>
      </div>
    </footer>
  );
}

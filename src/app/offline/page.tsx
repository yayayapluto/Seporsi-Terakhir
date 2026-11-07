import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SieraCard, SieraHero, SieraTile } from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kamu sedang offline",
  description: "Sambungan putus. Halaman simpanan tetap bisa dibuka; pesanan butuh internet.",
};

/** Fallback offline SW: statis, tanpa fetch — selalu bisa render dari cache. */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-4 max-md:px-5 px-4 py-8 sm:max-w-none md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8">
      <SieraHero eyebrow="Tidak ada sambungan" title="Kamu sedang offline">
        Pesanan butuh internet. Info yang sempat terbuka tetap bisa dibaca dari simpanan.
      </SieraHero>
      <SieraCard className="flex items-center gap-3 p-4">
        <SieraTile>
          <WifiOff size={20} aria-hidden />
        </SieraTile>
        <p className="text-sm text-muted-foreground">
          Cek Wi-Fi atau data seluler, lalu muat ulang halaman ini.
        </p>
      </SieraCard>
      <Link href="/" className={cn(buttonVariants({ variant: "default" }), "h-11")}>
        Coba lagi
      </Link>
    </div>
  );
}

"use client";

import { Bell, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/beranda", title: "Beranda" },
  { prefix: "/katalog", title: "Katalog" },
  { prefix: "/pesanan", title: "Pesanan" },
  { prefix: "/notifikasi", title: "Notifikasi" },
  { prefix: "/profil", title: "Akun" },
  { prefix: "/akun", title: "Akun" },
  { prefix: "/tenant/scan", title: "Pindai" },
  { prefix: "/tenant/pesanan", title: "Pesanan" },
  { prefix: "/tenant/menu", title: "Menu" },
  { prefix: "/tenant/porsi", title: "Porsi" },
  { prefix: "/tenant/pendaftaran", title: "Pendaftaran" },
  { prefix: "/tenant", title: "Dasbor" },
  { prefix: "/admin/tenant", title: "Tenant" },
  { prefix: "/admin", title: "Dampak" },
  { prefix: "/masuk", title: "Masuk" },
  { prefix: "/cara-kerja", title: "Cara Kerja" },
];

interface SiteHeaderClientProps {
  signedIn: boolean;
  unread: number;
}

export function SiteHeaderClient({ signedIn, unread }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const title =
    PAGE_TITLES.find((t) => pathname === t.prefix || pathname.startsWith(`${t.prefix}/`))?.title ??
    null;
  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E8ECE9] bg-white">
      <div className="mx-auto flex h-[60px] w-full max-w-[430px] items-center justify-between gap-2 px-4 md:max-w-6xl md:px-6">
        <Link
          
          href="/"
          
          className="flex min-h-11 min-w-0 items-center"
          
          aria-label="Seporsi Terakhir — beranda"
        >
          <span className="truncate font-heading text-lg font-extrabold text-[#2E7D4F]">
            Seporsi Terakhir
            {title && (
              <span className="font-heading text-lg font-extrabold text-[#2E7D4F]">
                {" "}
                <span aria-hidden className="font-normal text-[#64746B]">
                  ·
                </span>{" "}
                {title}
              </span>
            )}
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1" aria-label="Navigasi akun">
          {signedIn ? (
            <>
              <Link
                href="/notifikasi"
                aria-label="Pesan"
                className="inline-flex size-11 items-center justify-center rounded-full text-[#1C2826] transition-colors outline-none hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
              >
                <Mail className="size-6" strokeWidth={1.75} aria-hidden />
              </Link>
              <Link
                href="/notifikasi"
                aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
                className="relative inline-flex size-11 items-center justify-center rounded-full text-[#1C2826] transition-colors outline-none hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
              >
                <Bell className="size-6" strokeWidth={1.75} aria-hidden />
                {unread > 0 && (
                  <output
                    aria-hidden
                    className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BA1A1A] px-1 text-[10px] font-bold text-white"
                  >
                    {badge}
                  </output>
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/masuk"
              aria-label="Masuk ke akun"
              className={cn(buttonVariants({ size: "sm" }), "min-h-11 gap-1.5 rounded-[14px]")}
            >
              Masuk
              <LogIn className="size-4" aria-hidden />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

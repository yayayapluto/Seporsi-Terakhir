"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#langkah", label: "Cara Kerja" },
  { href: "#faq", label: "Keamanan Pangan" },
  { href: "#faq", label: "FAQ" },
  { href: ROUTES.privasi, label: "Privasi" },
  { href: ROUTES.ketentuan, label: "Ketentuan" },
];

/** Header landing "/": bilah putih mengambang di atas kanvas. */
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSignedIn(!!session?.user);
        // TOKEN_REFRESHED/INITIAL_SESSION fire hourly/on load — no refetch needed.
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      setSignedIn(false);
    }
    return () => unsubscribe?.();
  }, [router]);

  if (pathname !== "/") return null;

  return (
    <>
      <div className="fixed top-5 left-5 right-5 z-50 md:left-8 md:right-8">
        <div className="mx-auto flex h-[72px] max-w-[1000px] items-center justify-between gap-3 rounded-2xl bg-white pr-4 pl-6 shadow-[0_4px_18px_rgba(23,38,29,0.1),0_0_0_1px_rgba(0,0,0,0.05)]">
          <Link
            href="/"
            className="flex min-h-11 min-w-0 items-center font-heading text-[18px] font-extrabold text-[#286F3B]"
            aria-label="Seporsi Terakhir, beranda"
          >
            <span className="truncate">Seporsi Terakhir</span>
          </Link>

          <nav
            className="hidden items-center gap-5 text-[14px] font-medium text-[#17261D] min-[821px]:flex"
            aria-label="Navigasi utama"
          >
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-lg outline-none transition-colors hover:text-[#286F3B] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href={signedIn ? ROUTES.beranda : ROUTES.masuk}
            className={cn(
              buttonVariants({ size: "sm" }),
              "min-h-11 shrink-0 rounded-lg bg-[#286F3B] px-[22px] text-sm font-semibold text-white hover:bg-[#1E532C]",
            )}
          >
            {signedIn ? "Beranda" : "Masuk"}
          </Link>
        </div>
      </div>
      <div aria-hidden className="h-[92px]" />
    </>
  );
}

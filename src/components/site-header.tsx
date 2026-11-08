"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { scrollToHash } from "@/components/landing/motion/smooth-scroll-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#langkah", label: "Cara Kerja" },
  { href: "#faq", label: "Keamanan Pangan" },
  { href: "#faq", label: "FAQ" },
];

/** Header landing "/": bilah putih mengambang di atas kanvas. */
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      setHidden(y > 400 && y > lastY + 4);
      if (y < lastY - 4) setHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["langkah", "faq"];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  if (pathname !== "/") return null;

  return (
    <>
      <div
        className={cn(
          "fixed top-5 right-5 left-5 z-50 transition-transform duration-300 md:right-8 md:left-8",
          hidden && "-translate-y-[150%]",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-[72px] max-w-[1000px] items-center justify-between gap-3 rounded-2xl bg-white pr-4 pl-6 shadow-[0_4px_18px_rgba(23,38,29,0.1),0_0_0_1px_rgba(0,0,0,0.05)] transition-transform duration-300",
            scrolled && "scale-[0.97] bg-white/90 backdrop-blur",
          )}
        >
          <Link
            href="/"
            className="flex min-h-11 min-w-0 items-center font-heading text-[18px] font-extrabold text-[#286F3B]"
            aria-label="Seporsi Terakhir, beranda"
          >
            <span className="truncate">Seporsi Terakhir</span>
          </Link>

          <nav
            className="hidden items-center gap-7 text-[15px] font-medium text-[#17261D] min-[821px]:flex"
            aria-label="Navigasi utama"
          >
            {NAV.map((item) => {
              const isActive = active != null && item.href === `#${active}`;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHash(item.href);
                  }}
                  className={cn(
                    "relative inline-flex min-h-11 items-center rounded-lg outline-none transition-colors hover:text-[#286F3B] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]",
                    isActive && "font-bold text-[#286F3B]",
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 bottom-1 left-0 h-0.5 rounded-full bg-[#286F3B]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Buka menu"
            aria-expanded={menuOpen}
            className="min-h-11 min-w-11 shrink-0 min-[821px]:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </Button>

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
      <Sheet
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } })
            .__lenis;
          if (open) lenis?.stop();
          else lenis?.start();
        }}
      >
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm" aria-label="Menu">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <nav aria-label="Navigasi utama" className="flex flex-col gap-1 p-4 pt-14">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-[#17261D] hover:bg-[#F1F5F2]"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  scrollToHash(item.href);
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={signedIn ? ROUTES.beranda : ROUTES.masuk}
              className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-[#286F3B] px-4 text-base font-semibold text-white"
            >
              {signedIn ? "Beranda" : "Masuk"}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div aria-hidden className="h-[92px]" />
    </>
  );
}

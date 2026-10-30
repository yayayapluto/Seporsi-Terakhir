"use client";

import { House, LogIn, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/#keamanan", label: "Keamanan Pangan" },
  { href: "/#faq", label: "FAQ" },
];

/** Floating pill landing "/" + "/cara-kerja". Panel hamburger mengambang tepat di bawah pill. */
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // biome-ignore lint/correctness/useExhaustiveDependencies: tutup menu tiap pindah rute
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  if (pathname !== "/" && pathname !== "/cara-kerja") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-30 px-4 sm:top-5">
      <div className="relative mx-auto w-full max-w-xl">
        <header className="pointer-events-auto flex h-14 w-full items-center justify-between gap-2 rounded-2xl border border-[#E8ECE9] bg-white py-2 pr-2 pl-4 shadow-[0_2px_12px_rgba(16,24,40,0.08)]">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex min-h-11 min-w-0 items-center gap-2"
            aria-label="Seporsi Terakhir — beranda"
          >
            <span className="truncate font-heading text-lg font-extrabold text-[#2E7D4F]">
              Seporsi Terakhir
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Navigasi utama">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 font-medium text-[#1C2826] transition-colors outline-none hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            {signedIn ? (
              <Link
                href="/beranda"
                aria-label="Beranda"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden min-h-11 gap-1.5 md:inline-flex",
                )}
              >
                <House className="size-4" aria-hidden />
                Beranda
              </Link>
            ) : (
              <Link
                href="/masuk"
                aria-label="Masuk ke akun"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden min-h-11 gap-1.5 md:inline-flex",
                )}
              >
                Masuk
                <LogIn className="size-4" aria-hidden />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="landing-menu"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              className="inline-flex size-11 items-center justify-center rounded-full text-[#1C2826] transition-colors outline-none hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F] md:hidden"
            >
              <span className="relative grid size-6 place-items-center">
                {/* Alasan lib: morph ikon = animasi transform+opacity → Motion. */}
                <motion.span
                  aria-hidden
                  className="grid place-items-center"
                  initial={false}
                  animate={
                    open
                      ? { scale: 0.5, rotate: 90, opacity: 0 }
                      : { scale: 1, rotate: 0, opacity: 1 }
                  }
                  transition={reduce ? { duration: 0 } : { duration: 0.2 }}
                >
                  <Menu strokeWidth={1.75} className="size-6" aria-hidden />
                </motion.span>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 m-auto grid size-6 place-items-center"
                  initial={false}
                  animate={
                    open
                      ? { scale: 1, rotate: 0, opacity: 1 }
                      : { scale: 0.5, rotate: -90, opacity: 0 }
                  }
                  transition={reduce ? { duration: 0 } : { duration: 0.2 }}
                >
                  <X strokeWidth={1.75} className="size-6" aria-hidden />
                </motion.span>
              </span>
            </button>
          </div>
        </header>
        <AnimatePresence>
          {open && (
            <motion.nav
              id="landing-menu"
              aria-label="Navigasi utama"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto absolute inset-x-0 top-[calc(100%+12px)] flex origin-top flex-col gap-1 rounded-2xl border border-[#E8ECE9] bg-white p-2 shadow-[0_12px_32px_rgba(16,24,40,0.16)] md:hidden"
            >
              {NAV.map((n, i) => (
                <motion.span
                  key={n.href}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 + i * 0.05 }}
                  className="block"
                >
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold text-[#1C2826] hover:bg-[#F1F5F2]"
                  >
                    {n.label}
                  </Link>
                </motion.span>
              ))}
              {signedIn ? (
                <Link
                  href="/beranda"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C2826] hover:bg-[#F1F5F2]"
                >
                  <House className="size-4" aria-hidden />
                  Beranda
                </Link>
              ) : (
                <Link
                  href="/masuk"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-1 min-h-11 justify-center gap-1.5",
                  )}
                >
                  Masuk
                  <LogIn className="size-4" aria-hidden />
                </Link>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

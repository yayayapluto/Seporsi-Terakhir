"use client";

import {
  Bell,
  House,
  LayoutGrid,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavTab {
  href: string;
  label: string;
  icon: "home" | "store" | "orders" | "bell" | "account" | "dashboard" | "scan" | "shield";
  badge?: number;
}

const ICONS = {
  home: House,
  store: Store,
  orders: ReceiptText,
  bell: Bell,
  account: UserRound,
  dashboard: LayoutGrid,
  scan: QrCode,
  shield: ShieldCheck,
} as const;

function badgeText(n: number): string {
  return n > 9 ? "9+" : String(n);
}

const PILL_SPRING = { type: "spring", stiffness: 500, damping: 38 } as const;

function ActivePill({ id, rounded }: { id: string; rounded: string }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span aria-hidden className={cn("absolute inset-0", rounded, "bg-[#DCEBE0]")} />;
  }
  return (
    <motion.span
      aria-hidden
      layoutId={id}
      className={cn("absolute inset-0", rounded, "bg-[#DCEBE0]")}
      transition={PILL_SPRING}
    />
  );
}

/** Mobile floating bottom nav + desktop sidebar. Active from pathname segment. */
export function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname();
  const inApp =
    pathname.startsWith("/beranda") ||
    pathname.startsWith("/katalog") ||
    pathname.startsWith("/pesanan") ||
    pathname.startsWith("/notifikasi") ||
    pathname.startsWith("/akun") ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/tenant") ||
    pathname.startsWith("/admin");
  if (!inApp) return null;
  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-[430px] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch rounded-[20px] border border-[#E8ECE9] bg-white px-1 py-1 shadow-[0_8px_24px_rgba(16,24,40,.10)]">
          {tabs.map((t) => {
            const Icon = ICONS[t.icon];
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <li key={`${t.href}-${t.label}`} className="min-w-0 flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-semibold",
                    active ? "text-[#1E5A36]" : "text-muted-foreground",
                  )}
                >
                  {active && <ActivePill id="nav-pill-mobile" rounded="rounded-2xl" />}
                  <span className="relative z-10">
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                    {t.badge != null && (
                      <output
                        aria-label={`${t.badge} belum dibaca`}
                        className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BA1A1A] px-1 text-[10px] font-bold text-white"
                      >
                        {badgeText(t.badge)}
                      </output>
                    )}
                  </span>
                  <span className="relative z-10">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <nav
        aria-label="Navigasi utama"
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 self-start overflow-y-auto border-r border-[#E8ECE9] bg-white p-4 md:flex"
      >
        <Link
          href="/"
          aria-label="Seporsi Terakhir — beranda"
          className="mb-4 flex min-h-11 items-center px-3 font-heading text-lg font-extrabold text-[#2E7D4F]"
        >
          <span className="truncate">Seporsi Terakhir</span>
        </Link>
        <ul className="flex flex-col gap-1">
          {tabs.map((t) => {
            const Icon = ICONS[t.icon];
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <li key={`${t.href}-${t.label}`}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-semibold",
                    active ? "text-[#1E5A36]" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {active && <ActivePill id="nav-pill-desktop" rounded="rounded-[14px]" />}
                  <span className="relative z-10">
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                    {t.badge != null && (
                      <output
                        aria-label={`${t.badge} belum dibaca`}
                        className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BA1A1A] px-1 text-[10px] font-bold text-white"
                      >
                        {badgeText(t.badge)}
                      </output>
                    )}
                  </span>
                  <span className="relative z-10">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

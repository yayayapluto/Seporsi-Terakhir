"use client";

import {
  Bell,
  House,
  LayoutGrid,
  Plus,
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
import { sieraCountText as badgeText } from "./siera";
export interface NavTab {
  href: string;
  label: string;
  icon: "home" | "store" | "orders" | "bell" | "account" | "dashboard" | "scan" | "shield" | "plus";
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
  plus: Plus,
} as const;

// Satu aktif: cocokkan tab dengan path terpanjang. Prefix hanya bila batas
// segmen "/" sehingga /tenant tak ikut aktif saat di /tenant/porsi/baru.
function activeHref(tabs: readonly NavTab[], path: string): string | null {
  let best: string | null = null;
  for (const t of tabs) {
    const href = t.href;
    if (path !== href && !path.startsWith(`${href}/`)) continue;
    if (best == null || href.length > best.length) best = href;
  }
  return best;
}

const LINK_BASE =
  "relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors duration-200 active:scale-[0.99]";

const PILL_SPRING = { type: "spring", stiffness: 550, damping: 38 } as const;

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

/** Mobile floating bottom nav + desktop sidebar. Active dari segmen path. */
export function NavTabs({ tabs, asideTabs }: { tabs: NavTab[]; asideTabs?: NavTab[] }) {
  const pathname = usePathname();
  const path = pathname;
  const inApp =
    path.startsWith("/beranda") ||
    path.startsWith("/katalog") ||
    path.startsWith("/pesanan") ||
    path.startsWith("/notifikasi") ||
    path.startsWith("/akun") ||
    path.startsWith("/profil") ||
    path.startsWith("/tenant") ||
    path.startsWith("/admin");
  if (!inApp) return null;
  // Satu aktif global: anak non-tab (mis. /tenant/porsi/baru) hanya aktifkan shortcutnya.
  const all = asideTabs ? [...tabs, ...asideTabs] : tabs;
  const active = activeHref(all, path);
  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-[430px] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch rounded-[20px] border border-line bg-white px-1 py-1 shadow-[0_8px_24px_rgba(16,24,40,.10)]">
          {tabs.map((t) => {
            const Icon = ICONS[t.icon];
            const isActive = t.href === active;
            return (
              <li key={`${t.href}-${t.label}`} className="min-w-0 flex-1">
                <Link
                  href={t.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-colors duration-200 active:scale-[0.98]",
                    isActive
                      ? "text-[#1E5A36]"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {isActive && <ActivePill id="nav-pill-mobile" rounded="rounded-2xl" />}
                  <span className="relative z-10">
                    <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
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
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 self-start overflow-y-auto border-r border-line bg-white px-4 pb-4 md:flex"
      >
        <Link
          href="/"
          aria-label="Seporsi Terakhir — beranda"
          className="-mx-4 mb-4 flex h-[60px] shrink-0 items-center border-b border-line px-8 font-heading text-lg font-extrabold text-[#2E7D4F]"
        >
          <span className="truncate">Seporsi Terakhir</span>
        </Link>
        <ul className="flex flex-col gap-1">
          {tabs.map((t) => {
            const Icon = ICONS[t.icon];
            const isActive = t.href === active;
            return (
              <li key={`${t.href}-${t.label}`}>
                <Link
                  href={t.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    LINK_BASE,
                    isActive
                      ? "text-[#1E5A36]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {isActive && <ActivePill id="nav-pill-side" rounded="rounded-[14px]" />}
                  <span className="relative z-10">
                    <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
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
        {asideTabs && asideTabs.length > 0 && (
          <>
            <hr aria-hidden className="my-3 border-line" />
            <ul className="flex flex-col gap-1">
              {asideTabs.map((t) => {
                const Icon = ICONS[t.icon];
                const isActive = t.href === active;
                return (
                  <li key={`${t.href}-${t.label}`}>
                    <Link
                      href={t.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        LINK_BASE,
                        isActive
                          ? "text-[#1E5A36]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {isActive && <ActivePill id="nav-pill-side" rounded="rounded-[14px]" />}
                      <span className="relative z-10">
                        <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                      </span>
                      <span className="relative z-10">{t.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>
    </>
  );
}

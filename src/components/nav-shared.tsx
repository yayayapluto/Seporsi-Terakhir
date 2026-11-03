"use client";

import {
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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sieraCountText as badgeText } from "./siera";

export interface NavTab {
  href: string;
  label: string;
  icon: "home" | "store" | "orders" | "account" | "dashboard" | "scan" | "shield" | "plus";
  badge?: number;
}

export const ICONS = {
  home: House,
  store: Store,
  orders: ReceiptText,
  account: UserRound,
  dashboard: LayoutGrid,
  scan: QrCode,
  shield: ShieldCheck,
  plus: Plus,
} as const;

// Satu aktif: cocokkan tab dengan path terpanjang. Prefix hanya bila batas
// segmen "/" sehingga /tenant tak ikut aktif saat di /tenant/porsi/tambah.
export function activeHref(tabs: readonly NavTab[], path: string): string | null {
  let best: string | null = null;
  for (const t of tabs) {
    const href = t.href;
    if (path !== href && !path.startsWith(`${href}/`)) continue;
    if (best == null || href.length > best.length) best = href;
  }
  return best;
}

export const LINK_BASE =
  "relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors duration-200 active:scale-[0.99]";

const PILL_SPRING = { type: "spring", stiffness: 550, damping: 38 } as const;

export function ActivePill({ id, rounded }: { id: string; rounded: string }) {
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

/** True bila path masuk area aplikasi (nav perlu dirender). */
export function useInAppPath(): string | null {
  const pathname = usePathname();
  const inApp =
    pathname.startsWith("/beranda") ||
    pathname.startsWith("/notifikasi") ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/tenant") ||
    pathname.startsWith("/admin");
  return inApp ? pathname : null;
}

export { badgeText };

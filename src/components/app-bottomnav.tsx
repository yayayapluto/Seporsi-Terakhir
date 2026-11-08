"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ActivePill, activeHref, badgeText, ICONS, type NavTab, useInAppPath } from "./nav-shared";

/** Bottom nav mobile mengambang. Hanya tab utama (tanpa asideTabs). */
export function AppBottomNav({ tabs }: { tabs: NavTab[] }) {
  const path = useInAppPath();
  if (path == null) return null;
  const active = activeHref(tabs, path);
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-3 bottom-0 z-40 mx-auto max-w-[430px] md:hidden"
      style={{ marginBottom: "calc(12px + env(safe-area-inset-bottom))" }}
    >
      <ul className="flex min-h-[72px] items-stretch gap-1 rounded-3xl bg-white p-2 shadow-lg ring-1 ring-black/5">
        {tabs.map((t) => {
          const Icon = ICONS[t.icon];
          const isActive = t.href === active;
          return (
            <li key={`${t.href}-${t.label}`} className="min-w-0 flex-1">
              <Link
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-2 text-xs font-semibold transition-colors duration-200 active:scale-[0.98]",
                  isActive
                    ? "bg-[#DCEBE1] text-[#0D5A38] font-bold"
                    : "text-muted-foreground [@media(hover:hover)]:hover:bg-muted/60 [@media(hover:hover)]:hover:text-foreground",
                )}
              >
                {isActive && <ActivePill id="nav-pill-mobile" rounded="rounded-[18px]" />}
                <span className="relative z-10">
                  <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                  {t.badge != null && (
                    <output
                      aria-label={`${t.badge} belum dibaca`}
                      className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#b91c1c] px-1 text-[11px] font-bold text-white"
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
  );
}

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
  );
}

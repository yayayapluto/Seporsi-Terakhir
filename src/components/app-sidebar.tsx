"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ActivePill, ICONS, activeHref, badgeText, useInAppPath, type NavTab } from "./nav-shared";

/** Sidebar desktop: brand + tab utama + tab tambahan. */
export function AppSidebar({ tabs, asideTabs }: { tabs: NavTab[]; asideTabs?: NavTab[] }) {
  const path = useInAppPath();
  if (path == null) return null;
  const all = asideTabs ? [...tabs, ...asideTabs] : tabs;
  const active = activeHref(all, path);
  return (
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
                  "relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors duration-200 active:scale-[0.99]",
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
                      "relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors duration-200 active:scale-[0.99]",
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
  );
}

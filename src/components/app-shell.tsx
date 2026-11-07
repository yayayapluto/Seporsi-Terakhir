import type { ReactNode } from "react";
import { AppContent } from "./app-content";
import { AppFooter } from "./app-footer";
import { AppHeaderShell } from "./app-header-shell";
import { BottomNav } from "./bottom-nav";

/**
 * AppShell: sidebar kiri full-height + kolom kanan (konten tengah + footer).
 * Landing (/) memakai container full-bleed sendiri di page-nya.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-1">
      <div className="flex flex-col">
        <AppHeaderShell />
        <BottomNav />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppContent>{children}</AppContent>
        <AppFooter />
      <div aria-hidden="true" className="hidden max-md:block h-[calc(96px+env(safe-area-inset-bottom))] shrink-0" />
      </div>
}

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
    <>
      <AppHeaderShell />
      <div className="flex w-full flex-1">
        <BottomNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppContent>{children}</AppContent>
          <AppFooter />
        </div>
      </div>
    </>
  );
}

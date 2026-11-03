import type { ReactNode } from "react";
import { SmoothProvider } from "./smooth-provider";

/** Kolom konten aplikasi: center max-w-5xl. */
export function AppContent({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col">
      <SmoothProvider>{children}</SmoothProvider>
    </main>
  );
}

import type { ReactNode } from "react";
import { SmoothProvider } from "./smooth-provider";

/** Kolom konten aplikasi: full width, halaman yang butuh batas atur sendiri. */
export function AppContent({ children }: { children: ReactNode }) {
  return (
    <main className="flex w-full min-w-0 flex-1 flex-col">
      <SmoothProvider>{children}</SmoothProvider>
    </main>
  );
}

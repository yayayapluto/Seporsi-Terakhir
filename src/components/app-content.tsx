import type { ReactNode } from "react";
import { SmoothProvider } from "./smooth-provider";

/** Kolom konten aplikasi: full width, halaman yang butuh batas atur sendiri. */
export function AppContent({ children }: { children: ReactNode }) {
  return (
    <main className="flex w-full min-w-0 flex-1 flex-col max-md:scroll-pb-24 max-md:px-4 max-md:w-full max-md:max-w-full max-md:mx-0 max-md:min-w-0 max-md:min-h-0 max-md:h-auto">
      <SmoothProvider>{children}</SmoothProvider>
    </main>
  );
}

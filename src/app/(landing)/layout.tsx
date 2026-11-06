import type { ReactNode } from "react";

/** Landing page: standalone, no AppShell/AppHeader. */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

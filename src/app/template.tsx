import type { ReactNode } from "react";

/**
 * Remount tiap navigasi → animasi `.page-enter` replay.
 * Enter-only (tanpa exit): cukup untuk rasa halus, tanpa tahan DOM lama.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter flex flex-1 flex-col">{children}</div>;
}

"use client";

import type { ReactNode } from "react";
import { useReveal } from "./use-reveal";

/** Bungkus section server agar [data-reveal] di dalamnya teranimasikan. */
export function RevealScope({ children }: { children: ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref}>{children}</div>;
}

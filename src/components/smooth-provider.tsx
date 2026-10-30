"use client";

import Lenis from "lenis";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";

/** ponytail: satu Lenis global; anchor handler manual agar lenis tangani, bukan jump. */
export function SmoothProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // Lenis sekali per app; mati bila reduced-motion.
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -56 });
    };
    document.addEventListener("click", onAnchor);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onAnchor);
      lenis.destroy();
    };
  }, [reduce]);

  // Tiap ganti route: ke atas instan, Lenis ambil alih setelahnya.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname = pemicu scroll reset.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div key={pathname} className="flex flex-1 flex-col">
      {children}
    </div>
  );
}

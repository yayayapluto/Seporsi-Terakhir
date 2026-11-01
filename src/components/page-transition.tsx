"use client";

import { useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Blur + fade antar halaman tanpa View Transitions API.
 * Klik link internal → halaman lama blur-out 160ms → push → halaman baru blur-in.
 * Reduced-motion → navigasi biasa. Anchor `#` milik Lenis. */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const leaving = useRef(false);

  // Halaman baru selesai mount → buka blur lama + mainkan enter.
  useEffect(() => {
    if (!leaving.current) return;
    leaving.current = false;
    const main = document.querySelector("main");
    if (!main) return;
    main.classList.remove("page-leaving");
    if (reduce) return;
    main.classList.add("page-entering");
    const t = window.setTimeout(() => main.classList.remove("page-entering"), 320);
    return () => window.clearTimeout(t);
  }, [pathname, reduce]);

  useEffect(() => {
    if (reduce) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || leaving.current) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
        return;
      if (a.hasAttribute("download") || a.target === "_blank") return;
      let url: URL;
      try {
        url = new URL(href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      leaving.current = true;
      document.querySelector("main")?.classList.add("page-leaving");
      window.setTimeout(() => {
        router.push(`${url.pathname}${url.search}${url.hash}`);
        // Pengaman: bila navigasi batal, buka blur agar tak macet buram.
        window.setTimeout(() => {
          document.querySelector("main")?.classList.remove("page-leaving");
        }, 600);
      }, 160);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router, reduce]);

  return null;
}

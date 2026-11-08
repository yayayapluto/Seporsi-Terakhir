"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { ScrollProgress } from "./scroll-progress";

/** Scroll halus ke hash via Lenis bila ada, jatuh ke native bila tidak. */
export function scrollToHash(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) {
    lenis.scrollTo(el as HTMLElement, { offset: -(72 + 16), duration: 1.2 });
  } else {
    (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
  }
  history.replaceState(null, "", hash);
}

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
ScrollTrigger.config({ ignoreMobileResize: true });

const LenisCtx = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisCtx);
}

/** Lenis smooth scroll (desktop) + sinkron GSAP ticker/ScrollTrigger. Mati saat reduced-motion. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    let instance: Lenis | null = null;
    let cleanup: (() => void) | undefined;
    import("lenis").then(({ default: LenisCtor }) => {
      instance = new LenisCtor({
        autoRaf: false,
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: false,
      });
      setLenis(instance);
      (window as unknown as { __lenis?: Lenis }).__lenis = instance;
      instance.on("scroll", ScrollTrigger.update);
      const raf = (t: number) => instance?.raf(t * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      cleanup = () => {
        gsap.ticker.remove(raf);
        instance?.destroy();
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
        setLenis(null);
      };
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    });
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => document.documentElement.classList.remove("js-anim"), 3000);
    return () => window.clearTimeout(t);
  }, []);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop: "(min-width: 820px) and (prefers-reduced-motion: no-preference)",
          isMobile: "(max-width: 819px) and (prefers-reduced-motion: no-preference)",
        },
        () => {
          ScrollTrigger.refresh();
        },
      );
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <LenisCtx.Provider value={lenis}>
      <div ref={scope} className="min-w-0">
        <ScrollProgress />
        {children}
      </div>
    </LenisCtx.Provider>
  );
}

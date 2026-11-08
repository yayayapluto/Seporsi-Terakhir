"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

/** Wordmark raksasa di footer dengan parallax naik saat scroll ke bawah. */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ref.current;
      if (!el) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { yPercent: 30 },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "top 60%", scrub: 0.3 },
          },
        );
      }, el);
      return () => ctx.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden="true" className="overflow-hidden">
      <p className="text-center font-heading text-[clamp(2.5rem,9vw,6rem)] leading-none font-extrabold tracking-tight whitespace-nowrap text-white/25">
        Seporsi Terakhir
      </p>
    </div>
  );
}

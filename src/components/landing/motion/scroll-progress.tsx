"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

/** Bar progres tipis di atas halaman, scaleX mengikuti scroll. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ref.current;
      if (!el) return;
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[#2E7D4F]"
    />
  );
}

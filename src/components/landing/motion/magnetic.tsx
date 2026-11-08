"use client";

import gsap from "gsap";
import { type ReactNode, useRef } from "react";

/** Efek magnetik desktop (pointer fine): tombol mengikuti pointer maks 12px, balik dengan spring. */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="inline-block"
      onPointerMove={(e) => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.4, ease: "power3.out" });
      }}
      onPointerLeave={() => {
        if (ref.current)
          gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      }}
    >
      {children}
    </span>
  );
}

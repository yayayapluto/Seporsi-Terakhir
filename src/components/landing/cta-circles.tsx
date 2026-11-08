"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

/** 12 lingkaran dekoratif: abu berubah hijau satu per satu saat CTA masuk viewport (scrub). */
export function CtaCircles() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const root = ref.current;
      if (!root) return;
      const ctx = gsap.context(() => {
        gsap.to(root.querySelectorAll("[data-circle]"), {
          backgroundColor: "#2E7D4F",
          scale: 1.15,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top 85%", end: "top 40%", scrub: 0.4 },
        });
      }, root);
      return () => ctx.revert();
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="grid w-fit grid-cols-6 gap-2.5 max-md:grid-cols-6 md:grid-cols-12"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: lingkaran dekoratif statis
          key={i}
          data-circle
          className="size-3 rounded-full bg-white/35 max-md:size-2.5"
        />
      ))}
    </div>
  );
}

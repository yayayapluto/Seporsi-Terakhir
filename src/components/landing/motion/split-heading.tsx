"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Headline split kata-per-kata dengan mask baris. Teks penuh tetap di aria-label,
 * span split aria-hidden. Reduced-motion: teks utuh tanpa animasi.
 */
export function SplitHeading({
  children,
  className,
  as: Tag = "h2",
  trigger = "scroll",
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2";
  trigger?: "load" | "scroll";
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ref.current;
      if (!el) return;
      const split = new SplitText(el, { type: "words", mask: "lines", aria: "auto" });
      gsap.set(split.words, { yPercent: 110 });
      const tween = gsap.to(split.words, {
        yPercent: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.06,
      });
      if (trigger === "scroll") {
        tween.scrollTrigger({
          trigger: el,
          start: "top 85%",
          once: true,
        });
      }
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        split.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} aria-label={children} className={cn(className)}>
      {children}
    </Tag>
  );
}

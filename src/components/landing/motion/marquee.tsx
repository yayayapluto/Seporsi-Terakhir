"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

const PHRASES = [
  "Surplus layak makan",
  "Reservasi gratis",
  "Bayar di tempat",
  "QR pickup",
  "Tanpa data pribadi di QR",
  "Tahap awal SDG 12",
];

/**
 * Marquee tak berujung; kecepatan mengikuti kecepatan scroll.
 * Reduced-motion: statis, bungkus 2 baris.
 */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const track = root.current?.querySelector<HTMLElement>("[data-marquee-track]");
      if (!track) return;
      const to = gsap.quickTo(track, "xPercent", { duration: 0.4, ease: "none" });
      let pos = 0;
      const speed = gsap.to(track, {
        xPercent: -50,
        duration: 18,
        ease: "none",
        repeat: -1,
        onUpdate() {
          pos = gsap.getProperty(track, "xPercent") as number;
        },
      });
      const st = ScrollTrigger.create({
        onUpdate(self) {
          const v = self.getVelocity() / 100;
          const dir = v < 0 ? -1 : 1;
          speed.timeScale(gsap.utils.clamp(0.3, 3, 1 + Math.abs(v) / 900));
          if (dir < 0) {
            speed.reverse();
          } else {
            speed.play();
          }
          to(pos);
        },
      });
      return () => {
        st.kill();
        speed.kill();
      };
    },
    { scope: root },
  );

  const Row = ({ hidden }: { hidden?: boolean }) => (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-8 pr-8 max-md:gap-6 max-md:pr-6"
    >
      {PHRASES.map((p) => (
        <span key={p} className="flex items-center gap-8 max-md:gap-6">
          <span className="text-sm font-bold tracking-[0.14em] whitespace-nowrap text-[#1E532C] uppercase max-md:text-xs">
            {p}
          </span>
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#2E7D4F]" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      ref={root}
      className="overflow-x-clip border-y border-[#DCEBE0] bg-[#E6F3EA] py-4 max-md:py-3"
    >
      <div className="flex w-full motion-reduce:flex-wrap">
        <div data-marquee-track className="flex w-max motion-reduce:flex-wrap">
          <Row />
          <Row hidden />
        </div>
      </div>
    </div>
  );
}

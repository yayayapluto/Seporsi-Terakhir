"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useRef } from "react";

const CHIPS = [
  { text: "Bayar di tempat", className: "top-4 left-4", speed: 24 },
  { text: "Jam masak tertera", className: "top-4 right-4", speed: 40 },
  { text: "Maks 2 porsi/hari", className: "right-4 bottom-16", speed: 60 },
];

/** Foto hero: reveal clip-path + parallax + chip mengambang. Konten dari SSR, gerak hanya lapisan tambahan. */
export function HeroPhoto({ maxPorsi }: { maxPorsi: number }) {
  const root = useRef<HTMLDivElement>(null);
  const imgWrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          root.current,
          { clipPath: "inset(100% 0 0 0)" },
          { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "power3.inOut" },
        );
        gsap.fromTo(
          imgWrap.current,
          { scale: 1.25 },
          { scale: 1, duration: 1.1, ease: "power3.inOut" },
        );
        gsap.to(imgWrap.current, {
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.3 },
        });
        root.current?.querySelectorAll<HTMLElement>("[data-chip]").forEach((chip, i) => {
          gsap.to(chip, {
            y: CHIPS[i]?.speed ?? 30,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.3,
            },
          });
          gsap.to(chip, {
            y: "-=6",
            duration: 2.5 + i * 0.7,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        });
      }, root);
      return () => ctx.revert();
    },
    { scope: root },
  );

  const chips = CHIPS.map((c) => ({
    ...c,
    text: c.text === "Maks 2 porsi/hari" ? `Maks ${maxPorsi} porsi/hari` : c.text,
  }));

  return (
    <div
      ref={root}
      className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-[#D9E4DC]"
    >
      <div ref={imgWrap} className="absolute inset-0 scale-110">
        <Image
          src="/images/foto_kantin.webp"
          alt="Etalase kantin kampus menjelang tutup"
          fill
          sizes="(min-width: 821px) 520px, 100vw"
          className="object-cover"
          priority
        />
      </div>
      {chips.map((c) => (
        <span
          key={c.text}
          data-chip
          className={`absolute ${c.className} rounded-full border border-white/40 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#1E532C] shadow-sm backdrop-blur max-md:max-w-[60%]`}
        >
          {c.text}
        </span>
      ))}
      <span className="absolute right-4 bottom-4 left-4 max-w-[75%] rounded-lg bg-white/75 px-3 py-2 text-xs leading-snug text-[#1C2826] backdrop-blur">
        Kantin sore hari: sisa layak simpan didata sebelum tutup.
      </span>
    </div>
  );
}

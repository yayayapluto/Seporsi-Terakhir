"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import type { LangkahStep } from "./langkah-stagger";
import { LangkahStagger } from "./langkah-stagger";

/**
 * Cerita pinned 3 langkah: kartu stage morph antar 3 state + teks langkah berganti.
 * Reduced-motion / tanpa JS / gagal init → fallback LangkahStagger statis.
 */
export function LangkahStory({ steps }: { steps: readonly LangkahStep[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setFallback(true);
        return;
      }
      const ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 820px)", () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=300%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              snap: { snapTo: [0, 0.5, 1], duration: 0.4, ease: "power2.inOut" },
            },
          });
          tl.addLabel("step1")
            .to("[data-state='2']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .to("[data-state='3']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .to("[data-text='2']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .to("[data-text='3']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .addLabel("step2")
            .to("[data-state='1']", { opacity: 0, y: -24, duration: 0.5 }, "step2")
            .to("[data-text='1']", { opacity: 0, y: -24, duration: 0.5 }, "step2")
            .fromTo(
              "[data-state='2']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step2",
            )
            .fromTo(
              "[data-text='2']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step2",
            )
            .to("[data-numfill='1']", { opacity: 0, duration: 0.3 }, "step2")
            .to("[data-numfill='2']", { opacity: 1, duration: 0.3 }, "step2")
            .to("[data-rail='1']", { scaleY: 1, duration: 0.5, ease: "none" }, "step2")
            .to("[data-dot='1']", { backgroundColor: "#CFE3D6", duration: 0.3 }, "step2")
            .to("[data-dot='2']", { backgroundColor: "#2E7D4F", duration: 0.3 }, "step2")
            .addLabel("step3")
            .to("[data-state='2']", { opacity: 0, y: -24, duration: 0.5 }, "step3")
            .to("[data-text='2']", { opacity: 0, y: -24, duration: 0.5 }, "step3")
            .fromTo(
              "[data-state='3']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step3",
            )
            .fromTo(
              "[data-text='3']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step3",
            )
            .to("[data-numfill='2']", { opacity: 0, duration: 0.3 }, "step3")
            .to("[data-numfill='3']", { opacity: 1, duration: 0.3 }, "step3")
            .to("[data-rail='2']", { scaleY: 1, duration: 0.5, ease: "none" }, "step3")
            .to("[data-dot='2']", { backgroundColor: "#CFE3D6", duration: 0.3 }, "step3")
            .to("[data-dot='3']", { backgroundColor: "#2E7D4F", duration: 0.3 }, "step3");
          return () => tl.scrollTrigger?.kill();
        });
        mm.add("(max-width: 819px)", () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=250%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              snap: { snapTo: [0, 0.5, 1], duration: 0.4, ease: "power2.inOut" },
            },
          });
          tl.addLabel("step1")
            .to("[data-state='2']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .to("[data-state='3']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .to("[data-text='2']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .to("[data-text='3']", { opacity: 0, y: -24, duration: 0.5 }, 0)
            .addLabel("step2")
            .to("[data-state='1']", { opacity: 0, y: -24, duration: 0.5 }, "step2")
            .to("[data-text='1']", { opacity: 0, y: -24, duration: 0.5 }, "step2")
            .fromTo(
              "[data-state='2']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step2",
            )
            .fromTo(
              "[data-text='2']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step2",
            )
            .to("[data-dot='1']", { backgroundColor: "#CFE3D6", duration: 0.3 }, "step2")
            .to("[data-dot='2']", { backgroundColor: "#2E7D4F", duration: 0.3 }, "step2")
            .addLabel("step3")
            .to("[data-state='2']", { opacity: 0, y: -24, duration: 0.5 }, "step3")
            .to("[data-text='2']", { opacity: 0, y: -24, duration: 0.5 }, "step3")
            .fromTo(
              "[data-state='3']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step3",
            )
            .fromTo(
              "[data-text='3']",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.5 },
              "step3",
            )
            .to("[data-dot='2']", { backgroundColor: "#CFE3D6", duration: 0.3 }, "step3")
            .to("[data-dot='3']", { backgroundColor: "#2E7D4F", duration: 0.3 }, "step3");
          return () => tl.scrollTrigger?.kill();
        });
      }, root);
      return () => ctx.revert();
    },
    { scope: root },
  );

  if (fallback) {
    return <LangkahStagger steps={steps} />;
  }

  return (
    <div ref={root} className="min-w-0">
      <div
        className="grid items-center gap-6 md:min-h-screen md:grid-cols-2 md:gap-12 max-md:min-h-[100svh] max-md:grid-rows-[auto_auto_1fr] max-md:gap-4"
        data-story
      >
        {/* Stage: satu kartu morph antar 3 state */}
        <div className="relative flex aspect-square w-full max-w-[400px] items-center justify-center overflow-hidden rounded-[28px] bg-[#DCEBE1] shadow-[0_14px_28px_rgba(23,38,29,0.12)] max-md:mx-auto max-md:max-h-[42svh]">
          {steps.map((step, i) => (
            <div
              key={step.num}
              data-state={i + 1}
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden={i !== 0}
            >
              {step.panel}
            </div>
          ))}
        </div>

        {/* Progress dots (mobile, horizontal) */}
        <div aria-hidden="true" className="flex items-center justify-center gap-2 md:hidden">
          {steps.map((s, i) => (
            <span
              key={s.num}
              data-dot={i + 1}
              className={`size-2.5 rounded-full ${i === 0 ? "bg-[#2E7D4F]" : "bg-[#CFE3D6]"}`}
            />
          ))}
        </div>

        {/* Progress rail (desktop vertikal, mobile horizontal dots) */}
        <div aria-hidden="true" className="hidden md:block">
          <div className="relative flex h-40 w-px flex-col justify-between bg-[#DCEBE0]">
            <span
              data-rail="1"
              className="absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-[#2E7D4F]"
            />
            <span
              data-rail="2"
              className="absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-[#2E7D4F]"
            />
            {steps.map((s) => (
              <span
                key={s.num}
                className="relative z-10 size-3 rounded-full border-2 border-[#2E7D4F] bg-white"
              />
            ))}
          </div>
        </div>

        {/* Teks langkah: satu tampilan dalam satu waktu */}
        <div className="relative min-h-0">
          {steps.map((step, i) => (
            <div key={step.num} data-text={i + 1} className={i === 0 ? "" : "absolute inset-0"}>
              <div
                aria-hidden
                className="relative font-heading text-[64px] leading-none font-extrabold text-transparent min-[821px]:text-[88px] [-webkit-text-stroke:1.5px_#2E7D4F]"
              >
                {step.num}
                <span
                  data-numfill={i + 1}
                  className={`${i === 0 ? "" : "opacity-0 "}absolute inset-0 text-[#2E7D4F] [-webkit-text-stroke:0px]`}
                >
                  {step.num}
                </span>
              </div>
              <h3 className="mt-2 text-[22px] leading-[1.15] font-bold min-[821px]:text-[28px]">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-[46ch] text-[15px] leading-relaxed text-[#4A5B51]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

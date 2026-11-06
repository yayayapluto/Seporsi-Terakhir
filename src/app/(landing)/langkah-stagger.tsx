"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type LangkahStep = {
  num: string;
  title: string;
  body: string;
  panel: React.ReactNode;
};

type LangkahStaggerProps = {
  steps: readonly LangkahStep[];
};

export function LangkahStagger({ steps }: LangkahStaggerProps) {
  return (
    <motion.div
      className="flex flex-col gap-14"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.25,
            delayChildren: 0.15,
          },
        },
      }}
    >
      {steps.map((step) => {
        const textLeft = step.num === "02";
        const textBlock = (
          <motion.div
            className="flex items-center gap-5"
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            <div
              aria-hidden
              className="font-heading text-[64px] leading-none font-extrabold text-[#CFE3D6] min-[821px]:text-[88px]"
            >
              {step.num}
            </div>
            <div>
              <h3 className="text-[22px] leading-[1.15] font-bold min-[821px]:text-[28px]">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-[46ch] text-[15px] leading-relaxed text-[#4A5B51]">
                {step.body}
              </p>
            </div>
          </motion.div>
        );
        const panel = (
          <motion.div
            className={cn(
              "flex aspect-square w-full max-w-[400px] items-center justify-center rounded-[28px] bg-[#DCEBE1] shadow-[0_14px_28px_rgba(23,38,29,0.12)]",
              textLeft ? "md:justify-self-end" : "md:justify-self-start",
            )}
            variants={{
              hidden: { opacity: 0, scale: 0.97 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            {step.panel}
          </motion.div>
        );

        return (
          <motion.div
            key={step.num}
            className="grid items-center gap-10 md:grid-cols-2 md:gap-12"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.15,
                },
              },
            }}
          >
            {textLeft ? (
              <>
                {textBlock}
                {panel}
              </>
            ) : (
              <>
                {panel}
                {textBlock}
              </>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

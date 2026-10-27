"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function HeroMotion({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <section className={className}>{children}</section>;
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.section>
  );
}

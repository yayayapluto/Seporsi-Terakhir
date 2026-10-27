"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Scroll-triggered fade-up. Transform + opacity only, fires once.
 * Reduced motion → renders static, no JS animation.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.25, delay, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Section wrapper with scroll reveal. Keeps semantic <section>.
 */
export function SectionReveal({ children, className, id }: SectionRevealProps) {
  const reduce = useReducedMotion();
  if (reduce)
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.section>
  );
}

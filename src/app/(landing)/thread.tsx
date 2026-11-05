"use client";

import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Benang: satu garis kontinu mengalir dari hero sampai CTA penutup.
 * Scroll-driven fill (useScroll + useSpring), transform/scaleY saja (60fps).
 * Reduced-motion: benang penuh statis, tanpa scroll listener.
 *
 * Konten SELALU terlihat dari SSR; gerak hanya lapisan tambahan. Karena itu
 * tidak ada `initial` opacity:0 di sini — hydration gagal pun halaman terbaca.
 */
const ThreadCtx = createContext<MotionValue<number> | null>(null);

export function ThreadRoot({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.35"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });
  return (
    <ThreadCtx.Provider value={reduce ? null : smooth}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </ThreadCtx.Provider>
  );
}

/** Benang vertikal: rail abu + fill hijau tumbuh ikut scroll. */
export function ThreadRail({ className }: { className?: string }) {
  const progress = useContext(ThreadCtx);
  const reduce = useReducedMotion();
  const frozen = useMotionValue(0);
  const scaleY = useTransform(reduce ? frozen : (progress ?? frozen), [0, 1], [0.02, 1]);
  return (
    <span aria-hidden className={cn("pointer-events-none absolute top-0 bottom-0 w-px", className)}>
      <span className="absolute inset-0 bg-line" />
      <motion.span
        className="absolute inset-x-0 top-0 origin-top bg-primary"
        style={reduce ? { scaleY: 1 } : { scaleY }}
      />
    </span>
  );
}

/** Wrapper tekan: CTA <Link> tetap server-side, efek press via Motion. */
export function Pressable({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={cn("inline-block", className)}
      whileTap={reduce ? undefined : { scale: 0.98, opacity: 0.7 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.span>
  );
}

/**
 * Reveal sekali saat masuk viewport. Konten TERLIHAT sejak SSR; opasitas hanya
 * diturunkan bila elemen memang di bawah fold saat mount. Ada juga pengaman
 * timer: apa pun yang terjadi, konten dipaksa tampil — hydration gagal,
 * reduced-motion, atau observer yang tidak pernah menyala tak bisa menyembunyikan isi.
 */
export function Reveal({
  children,
  className,
  id,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Hanya sembunyikan bila elemen memang di bawah viewport saat mount.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setPending(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          setPending(false);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // Pengaman: konten tak boleh tetap tersembunyi.
    const failsafe = window.setTimeout(() => {
      setShown(true);
      setPending(false);
    }, 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [reduce]);

  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        !reduce && "transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        !reduce && pending && !shown && "translate-y-3 opacity-0",
        className,
      )}
      style={
        !reduce && pending && !shown
          ? { transitionDelay: `${Math.round(delay * 1000)}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

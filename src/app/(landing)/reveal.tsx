"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Reveal halus sekali saat masuk viewport: translateY(20px)→0 + opacity. */
export function Reveal({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

// Wrapper tekan: CTA <Link> tetap server-side, efek press di span luar.
export function Pressable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={
        className
          ? `inline-block transition duration-150 active:scale-[.98] active:opacity-70 ${className}`
          : "inline-block transition duration-150 active:scale-[.98] active:opacity-70"
      }
    >
      {children}
    </span>
  );
}

// Countdown tutup pickup 18.00 WIB. Render awal statis biar SSR = hydrate.
export function PickupCountdown({ className }: { className?: string }) {
  const [label, setLabel] = useState("16.30–18.00");
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const tick = () => {
      try {
        const parts = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).formatToParts(new Date());
        const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
        const now = g("hour") * 3600 + g("minute") * 60 + g("second");
        if (now < 15.5 * 3600) {
          setLabel("Buka 15.30");
          setClosed(false);
          return;
        }
        if (now >= 18 * 3600) {
          setLabel("Tutup · buka besok");
          setClosed(true);
          return;
        }
        const r = 18 * 3600 - now;
        const h = String(Math.floor(r / 3600)).padStart(2, "0");
        const m = String(Math.floor((r % 3600) / 60)).padStart(2, "0");
        const s = String(r % 60).padStart(2, "0");
        setLabel(`${h}:${m}:${s}`);
        setClosed(false);
      } catch {
        setLabel("16.30–18.00");
        setClosed(false);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      role="timer"
      className={cn(
        "tabular-nums",
        closed && "rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[#B45309]",
        className,
      )}
    >
      {label}
    </span>
  );
}

// Baris papan tulis: reveal per-baris dengan delay stagger.
export function ChalkRow({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <li
      ref={ref}
      style={delay ? { transitionDelay: `${Math.round(delay * 1000)}ms` } : undefined}
      className={cn(
        "transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        "[&_strong[data-pop]]:inline-block [&_strong[data-pop]]:transition-transform [&_strong[data-pop]]:duration-150",
        shown && "[&_strong[data-pop]]:scale-100",
        !shown && "[&_strong[data-pop]]:scale-[.98]",
        className,
      )}
    >
      {children}
    </li>
  );
}

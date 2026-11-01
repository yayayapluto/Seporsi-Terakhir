"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
export function Reveal({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={className}>
      {children}
    </div>
  );
}

// Wrapper tekan: CTA <Link> tetap server-side, efek press di span luar.
export function Pressable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={className ? `inline-block ${className}` : "inline-block"}>{children}</span>
  );
}

// Countdown tutup pickup 18.00 WIB. Render awal statis biar SSR = hydrate.
export function PickupCountdown({ className }: { className?: string }) {
  const [label, setLabel] = useState("16.30–18.00");
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
          return;
        }
        if (now >= 18 * 3600) {
          setLabel("Tutup · buka besok");
          return;
        }
        const r = 18 * 3600 - now;
        const h = String(Math.floor(r / 3600)).padStart(2, "0");
        const m = String(Math.floor((r % 3600) / 60)).padStart(2, "0");
        const s = String(r % 60).padStart(2, "0");
        setLabel(`${h}:${m}:${s}`);
      } catch {
        setLabel("16.30–18.00");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span role="timer" className={className ? `tabular-nums ${className}` : "tabular-nums"}>
      {label}
    </span>
  );
}

// Baris papan tulis: tanpa animasi (stagger via delay prop tak dipakai lagi).
export function ChalkRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return <li className={className}>{children}</li>;
}

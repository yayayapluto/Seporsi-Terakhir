"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { APP_TIMEZONE } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";

const SELL_OPEN_HOUR = 15.5; // 15.30 WIB
const SELL_CLOSE_HOUR = 18; // 18.00 WIB

type Phase = "before" | "open" | "closed";

interface WibNow {
  hour: number;
  minute: number;
  second: number;
}

function wibNow(): WibNow {
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { hour: g("hour"), minute: g("minute"), second: g("second") };
}

const STEPS = [
  { key: "cooked", label: "Dimasak", detail: "15.30 WIB" },
  { key: "sold", label: "Didiskon", detail: "40–50%" },
  { key: "pickup", label: "Diambil", detail: "16.30–18.00" },
  { key: "saved", label: "Sampah dicegah", detail: "1 porsi" },
] as const;

/**
 * Benang mini hero: garis waktu porsi yang hidup. Fase + countdown dihitung
 * dari jam dinding WIB nyata (bukan angka statis); SSR render fase "open" lalu
 * klien menyelaraskan dalam satu tick.
 */
export function LiveThread({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState<WibNow | null>(null);

  useEffect(() => {
    setNow(wibNow());
  }, []);

  let phase: Phase = "open";
  let countdown = "16.30–18.00";
  if (now) {
    const h = now.hour + now.minute / 60 + now.second / 3600;
    if (h < SELL_OPEN_HOUR) {
      phase = "before";
      countdown = "Buka 15.30";
    } else if (h >= SELL_CLOSE_HOUR) {
      phase = "closed";
      countdown = "Tutup · buka besok";
    } else {
      const secs = SELL_CLOSE_HOUR * 3600 - (now.hour * 3600 + now.minute * 60 + now.second);
      const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
      const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
      const ss = String(secs % 60).padStart(2, "0");
      countdown = `${hh}:${mm}:${ss}`;
    }
  }
  const progress = phase === "before" ? 0.12 : phase === "open" ? 0.55 : 1;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border border-line bg-white p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.08em] text-[#64746B] uppercase">
          Benang sore ini
        </p>
        <p className="text-sm font-bold tabular-nums text-[#1E5A36]" role="timer">
          <span className="sr-only">Sisa waktu jual: </span>
          {countdown}
        </p>
      </div>

      <ol className="relative mt-5 grid grid-cols-4 gap-1" aria-label="Perjalanan satu porsi">
        <span aria-hidden className="absolute top-2 right-2 left-2 h-px bg-line" />
        <span
          aria-hidden
          className={cn(
            "absolute top-2 left-2 h-px bg-primary",
            reduce && "transition-none",
            !reduce && "transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          )}
          style={{ width: `calc((100% - 1rem) * ${progress})` }}
        />
        {STEPS.map((s, i) => {
          const lit = progress > i * 0.25 + 0.01;
          return (
            <li key={s.key} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "relative z-10 size-4 shrink-0 rounded-full border-2 bg-white",
                  !reduce && "transition-colors duration-500",
                  lit ? "border-primary" : "border-line",
                )}
              >
                {lit && <span className="absolute inset-1 rounded-full bg-primary" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[11px] leading-tight font-bold sm:text-xs",
                    lit ? "text-[#1C2826]" : "text-[#64746B]",
                  )}
                >
                  {s.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-[#64746B] sm:text-[11px]">
                  {s.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

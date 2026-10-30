"use client";

import { cn } from "cn";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { sieraCardClass } from "@/components/siera";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import type { SoonPortion } from "./page";

/** Row katalog geser: drag Motion + progress bar + tombol (desktop). Fallback scroll native bila reduced-motion. */
export function SoonScroller({ portions }: { portions: SoonPortion[] }) {
  const reduce = useReducedMotion();
  const viewRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState(0);
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());
  const x = useMotionValue(0);
  const barScale = useTransform(x, (v) => (range > 0 ? Math.min(1, Math.max(0, -v / range)) : 0));
  const now = useMemo(() => Date.now(), []);

  useEffect(() => {
    const measure = () => {
      const el = viewRef.current;
      if (!el) return;
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      setRange(max);
      if (x.get() < -max) x.set(-max);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [portions.length, x]);

  const nudge = (dir: 1 | -1) => {
    const el = viewRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    animate(x, Math.min(0, Math.max(-range, x.get() + dir * step)), {
      type: "tween",
      duration: 0.25,
      ease: "easeOut",
    });
  };

  const focusIntoView = (e: React.FocusEvent) => {
    const li = (e.target as HTMLElement).closest("li");
    const view = viewRef.current;
    if (!li || !view) return;
    const left = (li as HTMLElement).offsetLeft;
    const right = left + li.clientWidth;
    const cur = -x.get();
    const vw = view.clientWidth;
    if (left < cur - 4) animate(x, -left, { type: "tween", duration: 0.2 });
    else if (right > cur + vw + 4)
      animate(x, Math.max(-range, -(right - vw)), { type: "tween", duration: 0.2 });
  };

  const items = portions.map((p) => {
    const leftMin = Math.max(0, Math.floor((+new Date(p.expiresAt) - now) / 60000));
    return (
      <li
        key={p.id}
        className={cn(sieraCardClass, "w-[240px] shrink-0 snap-start overflow-hidden")}
      >
        <Link href={`/katalog/${p.id}`} className="flex min-h-11 flex-col">
          <span className="relative block h-28 w-full shrink-0 overflow-hidden bg-[#F4EFE6]">
            {p.imageUrl && !broken.has(p.id) ? (
              <Image
                src={p.imageUrl}
                alt={p.menuName}
                fill
                sizes="240px"
                className="object-cover"
                draggable={false}
                onError={() =>
                  setBroken((prev) => {
                    const next = new Set(prev);
                    next.add(p.id);
                    return next;
                  })
                }
              />
            ) : (
              <Skeleton className="size-full rounded-none" aria-label="Foto porsi belum tersedia" />
            )}
          </span>
          <span className="flex flex-col gap-0.5 p-4 pb-3">
            <span className="line-clamp-2 text-[15px] leading-snug font-bold text-[#1C2826]">
              {p.menuName}
            </span>
            <span className="truncate text-[13px] text-[#64746B]">{p.tenantName}</span>
          </span>
          <span aria-hidden className="mx-4 border-t border-dashed border-[#E8ECE9]" />
          <span className="flex flex-col gap-1 p-4 pt-3">
            <span className="text-[13px] text-[#64746B]">
              Dimasak {formatDateTimeWIB(new Date(p.cookedAt))} · Sisa {p.quantityRemaining}
            </span>
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <del className="text-xs text-[#64746B]">{formatIDR(p.normalPrice)}</del>
              <strong className="text-base font-extrabold text-accent-strong">
                {formatIDR(p.discountPrice)}
              </strong>
            </span>
            {leftMin < 60 && (
              <span className="w-fit rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
                {leftMin <= 5 ? "Segera ambil" : `Batas ambil ${leftMin} mnt lagi`}
              </span>
            )}
          </span>
        </Link>
      </li>
    );
  });

  if (reduce) {
    return (
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pr-8 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items}
      </ul>
    );
  }

  return (
    <div>
      <div ref={viewRef} className="cursor-grab overflow-hidden pb-1 active:cursor-grabbing">
        <motion.ul
          drag="x"
          style={{ x }}
          dragConstraints={{ left: -range, right: 0 }}
          dragElastic={0.06}
          onFocusCapture={focusIntoView}
          className="relative flex w-max gap-3 pr-8"
          aria-label="Katalog sore ini"
        >
          {items}
        </motion.ul>
      </div>
      {range > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F1F5F2]" aria-hidden>
            <motion.div
              className="h-full w-full origin-left rounded-full bg-[#2E7D4F]"
              style={{ scaleX: barScale }}
            />
          </div>
          <div className="hidden shrink-0 gap-1 lg:flex">
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="Geser katalog ke kiri"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#E8ECE9] bg-white text-[#1C2826] outline-none transition-colors hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
            >
              <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="Geser katalog ke kanan"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#E8ECE9] bg-white text-[#1C2826] outline-none transition-colors hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
            >
              <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { sieraCardClass } from "@/components/siera";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { katalogDetail, ROUTES } from "@/lib/routes";
import type { SoonPortion } from "./page";

/** Grid katalog beranda (referensi relayout): foto + badge Hemat%/Sisa + harga rescue. */
export function SoonGrid({ portions }: { portions: SoonPortion[] }) {
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());
  const markBroken = (id: string) =>
    setBroken((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const shown = portions.slice(0, 5);
  const hasMore = portions.length > shown.length;

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
      {shown.map((p) => {
        const pct = p.normalPrice > 0 ? Math.round((1 - p.discountPrice / p.normalPrice) * 100) : 0;
        return (
          <li key={p.id} className={cn(sieraCardClass, "overflow-hidden")}>
            <Link
              href={katalogDetail(p.id)}
              aria-label={`Lihat ${p.menuName}`}
              className="flex min-h-11 flex-col"
            >
              <span className="relative block h-[120px] w-full shrink-0 overflow-hidden bg-[#F4EFE6]">
                {p.imageUrl && !broken.has(p.id) ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.menuName}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    onError={() => markBroken(p.id)}
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs font-semibold text-[#98928a]">
                    Foto menu
                  </span>
                )}
                {pct > 0 && (
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                    Hemat {pct}%
                  </span>
                )}
                <span className="absolute top-2.5 right-2.5 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
                  Sisa {p.quantityRemaining}
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-0.5 p-4">
                <span className="line-clamp-2 text-base leading-snug font-bold text-[#1C2826]">
                  {p.menuName}
                </span>
                <span className="truncate text-[13px] text-[#64746B]">{p.tenantName}</span>
                <span className="mt-2 text-[13px] text-[#64746B]">
                  Dimasak {formatDateTimeWIB(new Date(p.cookedAt))}
                </span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <strong className="text-lg font-extrabold text-[#1E5A36]">
                    {formatIDR(p.discountPrice)}
                  </strong>
                  <del className="text-[13px] text-[#64746B]">{formatIDR(p.normalPrice)}</del>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
      {hasMore && (
        <li>
          <Link
            href={ROUTES.katalog}
            className="flex min-h-[200px] flex-col items-center justify-center gap-1 rounded-[20px] border border-dashed border-line p-4 text-center text-[15px] font-bold text-[#1E5A36] transition-colors hover:bg-[#F1F5F2] focus-visible:bg-[#F1F5F2]"
          >
            <span aria-hidden className="text-[28px] leading-none font-extrabold">
              +{portions.length - shown.length}
            </span>
            Porsi lainnya
            <span className="text-[13px] font-medium text-[#64746B]">Buka katalog lengkap</span>
          </Link>
        </li>
      )}
    </ul>
  );
}

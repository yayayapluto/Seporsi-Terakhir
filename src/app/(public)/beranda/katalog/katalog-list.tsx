"use client";

import { cn } from "cn";
import { ChevronRight, Clock3, ImageOff, LayoutGrid, Rows3 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuidedTour } from "@/components/guided-tour";
import { SieraEmpty, SieraWarningBadge, sieraCardClass } from "@/components/siera";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { MAX_PORTIONS_PER_DAY } from "@/lib/domain/constants";
import { formatDateTimeWIB, formatIDR, formatSisaMenit } from "@/lib/format";
import { katalogDetail, ROUTES } from "@/lib/routes";
import { getJourneyNext } from "@/lib/tour-journey";
import type { CatalogPortion } from "./page";

const BATCH = 12;

const SORTS = [
  { value: "hampir-habis", label: "Hampir habis" },
  { value: "termurah", label: "Termurah" },
  { value: "terbaru", label: "Paling segar" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

type ViewMode = "grid" | "list";

export function KatalogList({
  portions,
  tenants,
  dayTotal,
  tourForced,
  tourJourney,
  tourEntry,
}: {
  portions: CatalogPortion[];
  tenants: string[];
  dayTotal: number;
  tourForced: boolean;
  tourJourney: boolean;
  tourEntry: number | null;
}) {
  const [tenant, setTenant] = useState<string>("semua");
  const [sort, setSort] = useState<SortValue>("hampir-habis");
  const [view, setView] = useState<ViewMode>("grid");
  const [visible, setVisible] = useState(BATCH);
  const moreRef = useRef<HTMLOutputElement>(null);
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());
  const reduce = useReducedMotion();

  const markBroken = (id: string) =>
    setBroken((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    const list =
      tenant === "semua" ? [...portions] : portions.filter((p) => p.tenantName === tenant);
    switch (sort) {
      case "termurah":
        return list.sort((a, b) => a.discountPrice - b.discountPrice);
      case "terbaru":
        return list.sort((a, b) => +new Date(b.cookedAt) - +new Date(a.cookedAt));
      default:
        return list.sort(
          (a, b) =>
            a.quantityRemaining - b.quantityRemaining ||
            +new Date(a.expiresAt) - +new Date(b.expiresAt),
        );
    }
  }, [portions, tenant, sort]);
  const shown = filtered.slice(0, visible);
  const now = Date.now();

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset batch tiap ganti filter/sortir/tampilan.
  useEffect(() => setVisible(BATCH), [tenant, sort, view]);
  useEffect(() => {
    const el = moreRef.current;
    if (!el) return;
    const total = filtered.length;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + BATCH, total));
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  return (
    <div className="flex flex-col gap-4">
      <fieldset
        aria-label="Saring katalog"
        data-tour="filter"
        className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0"
      >
        <label
          htmlFor="tenant-filter"
          className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[200px]"
        >
          <span className="text-xs font-bold text-[#64746B]">Tenant</span>
          <Select value={tenant} onValueChange={(v) => setTenant(String(v))}>
            <SelectTrigger
              id="tenant-filter"
              className="h-12 w-full min-w-0 rounded-xl px-3.5 text-sm [&>span]:min-w-0 [&>span]:truncate"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="semua">Semua tenant</SelectItem>
              {tenants.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label
          htmlFor="sort-filter"
          className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[200px]"
        >
          <span className="text-xs font-bold text-[#64746B]">Urutkan</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger
              id="sort-filter"
              className="h-12 w-full min-w-0 rounded-xl px-3.5 text-sm [&>span]:min-w-0 [&>span]:truncate"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <fieldset className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-white p-1">
          <legend className="sr-only">Tampilan katalog</legend>
          {[
            { value: "grid" as ViewMode, label: "Tampilan grid", Icon: LayoutGrid },
            { value: "list" as ViewMode, label: "Tampilan daftar", Icon: Rows3 },
          ].map(({ value, label, Icon }) => {
            const active = view === value;
            return (
              <Toggle
                key={value}
                pressed={active}
                onPressedChange={() => setView(value)}
                aria-label={label}
                className="relative min-h-11 min-w-11 rounded-lg data-[state=on]:bg-transparent focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
              >
                {active &&
                  (reduce ? (
                    <span aria-hidden className="absolute inset-0 rounded-lg bg-[#DCEBE0]" />
                  ) : (
                    <motion.span
                      aria-hidden
                      layoutId="katalog-view-pill"
                      className="absolute inset-0 rounded-lg bg-[#DCEBE0]"
                      transition={{ type: "spring", stiffness: 550, damping: 38 }}
                    />
                  ))}
                <Icon
                  className={`relative size-5 ${active ? "text-[#1E5A36]" : "text-[#64746B]"}`}
                  aria-hidden
                />
              </Toggle>
            );
          })}
        </fieldset>
      </fieldset>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2
          id="katalog-heading"
          className="text-xs font-bold uppercase tracking-[0.08em] text-[#64746B]"
        >
          Katalog sore ini
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-[#1C2826]">{filtered.length} porsi</span>
          {dayTotal >= MAX_PORTIONS_PER_DAY && (
            <SieraWarningBadge>Batas {MAX_PORTIONS_PER_DAY}/hari tercapai</SieraWarningBadge>
          )}
        </div>
      </div>
      {filtered.length === 0 ? (
        <SieraEmpty
          icon={Clock3}
          title="Belum ada porsi sore ini"
          hint="Biasanya tenant posting sekitar 15.30 sampai 16.30. Cek lagi nanti sore."
          action={
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 flex h-12 w-fit items-center justify-center rounded-xl px-7 text-[15px] font-bold"
            >
              Muat ulang
            </Button>
          }
        />
      ) : view === "grid" ? (
        <motion.ul
          layout={!reduce}
          className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            const pct =
              p.normalPrice > 0 ? Math.round((1 - p.discountPrice / p.normalPrice) * 100) : 0;
            return (
              <motion.li
                key={p.id}
                layout={!reduce}
                className={cn(
                  sieraCardClass,
                  "flex h-full flex-col overflow-hidden",
                  soldOut && "opacity-60",
                )}
              >
                {(() => {
                  const body = (
                    <>
                      <span className="relative block h-[120px] w-full shrink-0 overflow-hidden bg-[#F4EFE6]">
                        {p.imageUrl && !broken.has(p.id) ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.menuName}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                            onError={() => markBroken(p.id)}
                          />
                        ) : (
                          <span className="flex size-full flex-col items-center justify-center gap-0.5 text-[#98928a]">
                            <ImageOff className="size-5" aria-hidden />
                            <span className="px-1 text-center text-xs leading-tight font-semibold">
                              Foto menu
                            </span>
                          </span>
                        )}
                        {!soldOut && pct > 0 && (
                          <span className="absolute top-2.5 left-2.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                            Hemat {pct}%
                          </span>
                        )}
                        {!soldOut && (
                          <span className="absolute top-2.5 right-2.5 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
                            Sisa {p.quantityRemaining}
                          </span>
                        )}
                        {soldOut && (
                          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold text-[#1C2826]">
                            Habis
                          </span>
                        )}
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
                          <del className="text-[13px] text-[#64746B]">
                            {formatIDR(p.normalPrice)}
                          </del>
                          <strong className="text-lg font-extrabold text-[#1E5A36]">
                            {formatIDR(p.discountPrice)}
                          </strong>
                        </span>
                      </span>
                      {!soldOut && (
                        <>
                          <span aria-hidden className="mx-4 border-t border-dashed border-line" />
                          <span className="mt-auto flex min-h-11 items-center justify-between px-4 pt-1 pb-4 text-sm font-bold text-[#1E5A36]">
                            Lihat dan pesan
                            <ChevronRight className="size-5 shrink-0" aria-hidden />
                          </span>
                        </>
                      )}
                    </>
                  );
                  return soldOut ? (
                    <div
                      role="img"
                      aria-label={`${p.menuName} habis`}
                      className="flex min-h-11 flex-1 flex-col"
                    >
                      {body}
                    </div>
                  ) : (
                    <Link
                      href={katalogDetail(p.id)}
                      aria-label={`Lihat dan pesan ${p.menuName}`}
                      className="flex min-h-11 flex-1 flex-col"
                    >
                      {body}
                    </Link>
                  );
                })()}
              </motion.li>
            );
          })}
        </motion.ul>
      ) : (
        <motion.ul
          layout={!reduce}
          className={cn(sieraCardClass, "flex flex-col divide-y divide-dashed divide-line px-4")}
        >
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            const leftMin = Math.max(0, Math.floor((+new Date(p.expiresAt) - now) / 60_000));
            return (
              <motion.li key={p.id} layout={!reduce} className={cn(soldOut && "opacity-60")}>
                {(() => {
                  const inner = (
                    <>
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#F4EFE6]">
                        {p.imageUrl && !broken.has(p.id) ? (
                          <Image
                            src={p.imageUrl}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                            onError={() => markBroken(p.id)}
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-[#64746B]">
                            <ImageOff className="size-5" aria-hidden />
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[15px] font-bold text-[#1C2826]">
                          {p.menuName}
                        </span>
                        <span className="truncate text-[13px] text-[#64746B]">
                          {p.tenantName} · Sisa {p.quantityRemaining}
                        </span>
                        <span className="flex flex-wrap items-baseline gap-x-1.5">
                          <del className="text-xs text-[#64746B]">{formatIDR(p.normalPrice)}</del>
                          <strong className="text-base font-extrabold text-[#1E5A36]">
                            {formatIDR(p.discountPrice)}
                          </strong>
                        </span>
                        {soldOut ? (
                          <span className="w-fit rounded-full bg-[#F1F5F2] px-2.5 py-0.5 text-xs font-bold text-[#64746B]">
                            Habis
                          </span>
                        ) : (
                          leftMin < 60 && (
                            <span className="w-fit rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
                              {leftMin <= 5 ? "Segera ambil" : `Sisa ${formatSisaMenit(leftMin)}`}
                            </span>
                          )
                        )}
                      </span>
                      {!soldOut && (
                        <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
                      )}
                    </>
                  );
                  return soldOut ? (
                    <div
                      role="img"
                      aria-label={`${p.menuName} habis`}
                      className="flex min-h-11 items-center gap-3 py-3"
                    >
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={katalogDetail(p.id)}
                      aria-label={`Lihat dan pesan ${p.menuName}`}
                      className="flex min-h-11 items-center gap-3 py-3"
                    >
                      {inner}
                    </Link>
                  );
                })()}
              </motion.li>
            );
          })}
        </motion.ul>
      )}
      {visible < filtered.length && (
        <output ref={moreRef} className="flex justify-center py-6" aria-live="polite">
          <span className="sr-only">Memuat porsi berikutnya…</span>
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none"
            aria-hidden="true"
          />
        </output>
      )}
      <GuidedTour
        tourKey="katalog"
        forced={tourForced}
        auto={false}
        journey={tourJourney}
        entryStep={tourEntry}
        next={tourJourney ? (getJourneyNext(ROUTES.katalog) ?? undefined) : undefined}
        journeyLabel="Bagian 2 dari 4 · Katalog"
        intro={{
          title: "Cara baca katalog?",
          body: "Saring tenant, dahulukan yang hampir habis, buka kartunya buat pesan. Lewati atau ulangi kapan saja.",
        }}
        steps={[
          {
            target: '[data-tour="filter"]',
            title: "Saring porsi",
            body: "Pilih tenant atau urutan hampir habis.",
          },
          {
            target: "ul li:first-child a, ul li:first-child button",
            title: "Kunci porsimu",
            body: "Pilih Lihat dan pesan, atur jumlah, ambil dengan QR, bayar di tempat.",
          },
        ]}
      />
    </div>
  );
}

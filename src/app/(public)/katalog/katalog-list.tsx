"use client";

import { cn } from "cn";
import { ChevronRight, Clock3, ImageOff, LayoutGrid, Rows3 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuidedTour } from "@/components/guided-tour";
import { SieraCard, SieraSectionTitle, sieraCardClass } from "@/components/siera";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
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
      <SieraCard className="flex flex-col gap-3 p-4">
        <div
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-2"
          data-tour="filter"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Label
              htmlFor="tenant-filter"
              className="w-12 shrink-0 text-[13px] font-semibold text-[#64746B]"
            >
              Tenant
            </Label>
            <Select value={tenant} onValueChange={(v) => setTenant(String(v))}>
              <SelectTrigger
                id="tenant-filter"
                className="h-11 min-w-0 flex-1 gap-1 px-2 text-sm [&>span]:min-w-0 [&>span]:truncate"
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
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Label
              htmlFor="sort-filter"
              className="w-12 shrink-0 text-[13px] font-semibold text-[#64746B]"
            >
              Urut
            </Label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
              <SelectTrigger
                id="sort-filter"
                className="h-11 min-w-0 flex-1 gap-1 px-2 text-sm [&>span]:min-w-0 [&>span]:truncate"
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
          </span>
        </div>
      </SieraCard>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <SieraSectionTitle>Katalog sore ini · {filtered.length}</SieraSectionTitle>
          {dayTotal >= 2 && (
            <p className="w-fit rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
              Batas 2/hari tercapai
            </p>
          )}
        </div>
        <fieldset className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-white p-1">
          <legend className="sr-only">Tampilan katalog</legend>
          {[
            { value: "grid" as ViewMode, label: "Tampilan grid", Icon: LayoutGrid },
            { value: "list" as ViewMode, label: "Tampilan daftar", Icon: Rows3 },
          ].map(({ value, label, Icon }) => {
            const active = view === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                aria-label={label}
                onClick={() => setView(value)}
                className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
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
              </button>
            );
          })}
        </fieldset>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-line bg-white px-4 py-10 text-center">
          <p className="text-sm font-bold text-[#1C2826]">Belum ada porsi sore ini.</p>
          <p className="text-sm text-[#64746B]">
            Biasanya tenant posting sekitar 15.30–16.30. Cek lagi nanti sore.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#2E7D4F] px-2.5 text-[15px] font-bold text-white outline-none transition-colors hover:bg-[#256B41] focus-visible:ring-2 focus-visible:ring-[#2E7D4F] focus-visible:ring-offset-2 active:translate-y-px"
          >
            Muat ulang
          </button>
        </div>
      ) : view === "grid" ? (
        <motion.ul
          layout={!reduce}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            const leftMin = Math.max(0, Math.floor((+new Date(p.expiresAt) - now) / 60_000));
            return (
              <motion.li
                key={p.id}
                layout={!reduce}
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, y: 12 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.2, ease: "easeOut" as const },
                    })}
                className={cn(sieraCardClass, "overflow-hidden", soldOut && "opacity-60")}
              >
                {(() => {
                  const body = (
                    <>
                      <span className="relative block h-28 w-full shrink-0 overflow-hidden bg-[#F4EFE6]">
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
                          <span className="flex size-full flex-col items-center justify-center gap-0.5 text-[#64746B]">
                            <ImageOff className="size-5" aria-hidden />
                            <span className="px-1 text-center text-xs leading-tight">
                              Foto porsi belum tersedia
                            </span>
                          </span>
                        )}
                        {soldOut && (
                          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold text-[#1C2826]">
                            Habis
                          </span>
                        )}
                      </span>
                      <span className="flex flex-col gap-0.5 p-4 pb-3">
                        <span className="line-clamp-2 text-[15px] leading-snug font-bold text-[#1C2826]">
                          {p.menuName}
                        </span>
                        <span className="truncate text-[13px] text-[#64746B]">{p.tenantName}</span>
                      </span>
                      <span aria-hidden className="mx-4 border-t border-dashed border-line" />
                      <span className="flex flex-col gap-1 p-4 pt-3">
                        <span className="flex items-center gap-1.5 text-[13px] text-[#64746B]">
                          <Clock3 className="size-4 shrink-0" aria-hidden />
                          Dimasak {formatDateTimeWIB(new Date(p.cookedAt))} · Sisa{" "}
                          {p.quantityRemaining}
                        </span>
                        <span className="flex flex-wrap items-baseline gap-x-1.5">
                          <del className="text-xs text-[#64746B]">{formatIDR(p.normalPrice)}</del>
                          <strong className="text-base font-extrabold text-accent-strong">
                            {formatIDR(p.discountPrice)}
                          </strong>
                        </span>
                        {!soldOut && leftMin < 60 && (
                          <span className="w-fit rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
                            {leftMin <= 5 ? "Segera ambil" : `Batas ambil ${leftMin} mnt lagi`}
                          </span>
                        )}
                      </span>
                    </>
                  );
                  return soldOut ? (
                    <div className="flex min-h-11 flex-col" aria-label={`${p.menuName} habis`}>
                      {body}
                    </div>
                  ) : (
                    <Link
                      href={`/katalog/${p.id}`}
                      aria-label={`Lihat dan pesan ${p.menuName}`}
                      className="flex min-h-11 flex-col"
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
              <motion.li
                key={p.id}
                layout={!reduce}
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, y: 12 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.2, ease: "easeOut" as const },
                    })}
                className={soldOut ? "opacity-60" : undefined}
              >
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
                          <strong className="text-base font-extrabold text-accent-strong">
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
                              {leftMin <= 5 ? "Segera ambil" : `Sisa ${leftMin} mnt`}
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
                      className="flex min-h-11 items-center gap-3 py-3"
                      aria-label={`${p.menuName} habis`}
                    >
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={`/katalog/${p.id}`}
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
        next={tourJourney ? (getJourneyNext("/katalog") ?? undefined) : undefined}
        journeyLabel="Bagian 2 dari 4 · Katalog"
        intro={{
          title: "Cara baca katalog?",
          body: "Saring tenant, urutkan yang hampir habis, buka kartunya buat pesan. Bisa dilewati, dan diulang kapan saja.",
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
            body: "Pilih Lihat & Pesan, atur jumlah, ambil dengan QR, bayar di tempat.",
          },
        ]}
      />
    </div>
  );
}

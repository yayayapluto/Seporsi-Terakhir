"use client";

import { ChevronRight, Clock3, ImageOff, LayoutGrid, Rows3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuidedTour } from "@/components/guided-tour";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
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
}: {
  portions: CatalogPortion[];
  tenants: string[];
  dayTotal: number;
}) {
  const [tenant, setTenant] = useState<string>("semua");
  const [sort, setSort] = useState<SortValue>("hampir-habis");
  const [view, setView] = useState<ViewMode>("grid");
  const [visible, setVisible] = useState(BATCH);
  const moreRef = useRef<HTMLOutputElement>(null);

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
      <div className="flex flex-col gap-3 rounded-lg border border-[#E5E1D8] bg-white p-4">
        <div className="flex items-center gap-2" data-tour="filter">
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <Label htmlFor="tenant-filter" className="text-sm font-semibold">
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
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <Label htmlFor="sort-filter" className="text-sm font-semibold">
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
          <fieldset className="flex shrink-0 items-center gap-1 rounded-md border border-[#E5E1D8] bg-white p-1">
            <legend className="sr-only">Tampilan katalog</legend>
            <button
              type="button"
              aria-pressed={view === "grid"}
              aria-label="Tampilan grid"
              onClick={() => setView("grid")}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-[0.3rem] outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F] ${
                view === "grid" ? "bg-[#DCEBE0] text-[#1E5A36]" : "text-[#64746B]"
              }`}
            >
              <LayoutGrid className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              aria-label="Tampilan daftar"
              onClick={() => setView("list")}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-[0.3rem] outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F] ${
                view === "list" ? "bg-[#DCEBE0] text-[#1E5A36]" : "text-[#64746B]"
              }`}
            >
              <Rows3 className="size-5" aria-hidden />
            </button>
          </fieldset>
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]">
          Katalog sore ini · {filtered.length}
        </h2>
        {dayTotal >= 2 && <p className="text-xs font-bold text-[#92400E]">Batas 2/hari tercapai</p>}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#E8ECE9] bg-white px-4 py-10 text-center">
          <p className="text-sm font-bold text-[#1C2826]">Belum ada porsi tersedia</p>
          <p className="mt-1 text-sm text-[#64746B]">
            Katalog biasanya diperbarui tenant pukul 15.30–16.30. Cek lagi sore ini.
          </p>
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-1 gap-3">
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            const leftMin = Math.max(0, Math.floor((+new Date(p.expiresAt) - now) / 60_000));
            return (
              <li
                key={p.id}
                className="overflow-hidden rounded-[20px] border border-[#E8ECE9] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]"
              >
                <Link
                  href={`/katalog/${p.id}`}
                  aria-label={soldOut ? `${p.menuName} habis` : `Lihat dan pesan ${p.menuName}`}
                  aria-disabled={soldOut}
                  className="flex min-h-11 flex-col"
                >
                  <span className="relative block h-28 w-full shrink-0 overflow-hidden bg-[#F4EFE6]">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.menuName}
                        fill
                        sizes="430px"
                        className="object-cover"
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
                  <span aria-hidden className="mx-4 border-t border-dashed border-[#E8ECE9]" />
                  <span className="flex flex-col gap-1 p-4 pt-3">
                    <span className="flex items-center gap-1.5 text-[13px] text-[#64746B]">
                      <Clock3 className="size-4 shrink-0" aria-hidden />
                      Dimasak {formatDateTimeWIB(new Date(p.cookedAt))} · Sisa {p.quantityRemaining}
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-1.5">
                      <del className="text-xs text-[#64746B]">{formatIDR(p.normalPrice)}</del>
                      <strong className="text-base font-extrabold text-[#F28C28]">
                        {formatIDR(p.discountPrice)}
                      </strong>
                    </span>
                    {leftMin < 60 && (
                      <span className="w-fit rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
                        {leftMin <= 5 ? "Segera ambil · kedaluwarsa" : `Kedaluwarsa ${leftMin} mnt`}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="flex flex-col divide-y divide-dashed divide-[#E8ECE9] rounded-[20px] border border-[#E8ECE9] bg-white px-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            const leftMin = Math.max(0, Math.floor((+new Date(p.expiresAt) - now) / 60_000));
            return (
              <li key={p.id}>
                <Link
                  href={`/katalog/${p.id}`}
                  aria-label={soldOut ? `${p.menuName} habis` : `Lihat dan pesan ${p.menuName}`}
                  aria-disabled={soldOut}
                  className={`flex min-h-11 items-center gap-3 py-3 ${soldOut ? "opacity-60" : ""}`}
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#F4EFE6]">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt="" fill sizes="56px" className="object-cover" />
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
                      <strong className="text-base font-extrabold text-[#F28C28]">
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
                  <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {visible < filtered.length && (
        <output ref={moreRef} className="flex justify-center py-6" aria-live="polite">
          <span className="sr-only">Memuat porsi berikutnya…</span>
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
            aria-hidden="true"
          />
        </output>
      )}
      <GuidedTour
        tourKey="katalog"
        steps={[
          {
            target: '[data-tour="filter"]',
            title: "Saring porsi",
            body: "Pilih tenant atau urutan hampir habis.",
          },
          {
            target: "ul li:first-child a, ul li:first-child button",
            title: "Kunci porsimu",
            body: "Ketuk Lihat & Pesan, atur jumlah, ambil dengan QR, bayar di tempat.",
          },
        ]}
      />
    </div>
  );
}

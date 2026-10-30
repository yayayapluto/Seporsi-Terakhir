"use client";

import { ImageOff } from "lucide-react";
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset batch tiap ganti filter/sortir.
  useEffect(() => setVisible(BATCH), [tenant, sort]);
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b pb-4" data-tour="filter">
        <span className="flex items-center gap-2">
          <Label htmlFor="tenant-filter" className="text-sm font-semibold">
            Tenant
          </Label>
          <Select value={tenant} onValueChange={(v) => setTenant(String(v))}>
            <SelectTrigger id="tenant-filter" className="h-11 w-fit min-w-32 max-w-[60vw]">
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
        <span className="flex items-center gap-2">
          <Label htmlFor="sort-filter" className="text-sm font-semibold">
            Urut
          </Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger id="sort-filter" className="h-11 w-fit min-w-32 max-w-[60vw]">
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
        <p className="flex basis-full text-xs text-muted-foreground">
          <output>
            {filtered.length} porsi
            {dayTotal >= 2 ? " · batas 2/hari tercapai" : ""}
          </output>
        </p>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#E8ECE9] bg-white px-4 py-10 text-center">
          <p className="text-sm font-bold text-[#1C2826]">Belum ada porsi tersedia</p>
          <p className="mt-1 text-sm text-[#64746B]">
            Katalog biasanya diperbarui tenant pukul 15.30–16.30. Cek lagi sore ini.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
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
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
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
                    <span className="text-[13px] text-[#64746B]">
                      Dimasak {formatDateTimeWIB(new Date(p.cookedAt))} · Sisa {p.quantityRemaining}
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-1.5">
                      <del className="text-xs text-[#64746B]">{formatIDR(p.normalPrice)}</del>
                      <strong className="text-base font-extrabold text-[#F28C28]">
                        {formatIDR(p.discountPrice)}
                      </strong>
                    </span>
                  </span>
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

"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuidedTour } from "@/components/guided-tour";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { Reveal } from "../reveal";
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-4" data-tour="filter">
        <Label htmlFor="tenant-filter" className="text-sm font-semibold">
          Tenant
        </Label>
        <Select value={tenant} onValueChange={(v) => setTenant(String(v))}>
          <SelectTrigger id="tenant-filter" className="h-11 w-fit min-w-32 max-w-[50vw]">
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
        <Label htmlFor="sort-filter" className="text-sm font-semibold">
          Urut
        </Label>
        <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
          <SelectTrigger id="sort-filter" className="h-11 w-fit min-w-32 max-w-[50vw]">
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
        <p className="flex basis-full text-xs text-muted-foreground">
          <output>
            {filtered.length} porsi
            {dayTotal >= 2 ? " · batas 2/hari tercapai" : ""}
          </output>
        </p>
      </div>
      {filtered.length === 0 ? (
        <div className="border-b py-10 text-center">
          <p className="font-bold">Belum ada porsi tersedia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Katalog biasanya diperbarui tenant pukul 15.30–16.30. Cek lagi sore ini.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border-b">
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            return (
              <li key={p.id}>
                <Reveal className="group relative isolate flex flex-col gap-3 py-4 transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none sm:flex-row">
                  <div className="flex gap-3">
                    <div className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.menuName}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full flex-col items-center justify-center gap-0.5 text-muted-foreground">
                          <ImageOff className="size-5" aria-hidden />
                          <span className="px-1 text-center text-[10px] leading-tight">
                            tidak ada gambar
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 min-h-10 break-words text-[15px] font-bold leading-snug sm:text-base">
                        <Link
                          href={`/katalog/${p.id}`}
                          className="underline-offset-4 hover:underline group-hover:underline after:absolute after:inset-0 after:content-['']"
                        >
                          {p.menuName}
                        </Link>
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {p.tenantName} · Dimasak {formatDateTimeWIB(new Date(p.cookedAt))}
                        {soldOut ? " · Habis" : ` · Sisa ${p.quantityRemaining}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:ml-auto sm:flex-col sm:items-end sm:justify-between">
                    <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                      <del className="text-[11px] text-muted-foreground sm:text-xs">
                        <span className="sr-only">Harga awal: </span>
                        {formatIDR(p.normalPrice)}
                      </del>
                      <strong className="text-base sm:text-lg">{formatIDR(p.discountPrice)}</strong>
                    </p>
                    <Button
                      type="button"
                      disabled={soldOut}
                      render={
                        <Link
                          href={`/katalog/${p.id}`}
                          aria-label={
                            soldOut ? `${p.menuName} habis` : `Lihat dan pesan ${p.menuName}`
                          }
                          aria-disabled={soldOut}
                          className="relative z-10 min-h-11 flex-1 sm:flex-none"
                        />
                      }
                    >
                      {soldOut ? "Habis" : "Lihat & Pesan"}
                    </Button>
                  </div>
                </Reveal>
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
            target: "ul li:first-child",
            title: "Kunci porsimu",
            body: "Ketuk Lihat & Pesan, atur jumlah, ambil dengan QR, bayar di tempat.",
          },
        ]}
      />
    </div>
  );
}

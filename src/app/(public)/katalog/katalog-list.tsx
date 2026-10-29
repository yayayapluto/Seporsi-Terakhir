"use client";

import { ImageOff, LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuidedTour } from "@/components/guided-tour";
import { Spinner } from "@/components/spinner";
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
  const [view, setView] = useState<"grid" | "list">("grid");
  const [ordering, setOrdering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [locked, setLocked] = useState(dayTotal);
  const [items, setItems] = useState<CatalogPortion[]>(portions);
  const [visible, setVisible] = useState(BATCH);
  const moreRef = useRef<HTMLOutputElement>(null);

  const filtered = useMemo(
    () => (tenant === "semua" ? items : items.filter((p) => p.tenantName === tenant)),
    [items, tenant],
  );
  const shown = filtered.slice(0, visible);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset batch tiap ganti filter.
  useEffect(() => setVisible(BATCH), [tenant]);
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

  async function order(id: string) {
    if (locked >= 2) {
      setError("Batas harian tercapai: maksimal 2 porsi per hari.");
      return;
    }
    setOrdering(id);
    setError(null);
    setSuccess(null);
    setSuccessOrderId(null);
    const prev = items;
    setItems((current) =>
      current.map((p) => (p.id === id ? { ...p, quantityRemaining: p.quantityRemaining - 1 } : p)),
    );
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portionId: id, quantity: 1 }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        orderId?: string;
      } | null;
      if (!res.ok) {
        setItems(prev);
        setError(body?.error ?? "Gagal memesan. Coba lagi.");
        return;
      }
      setLocked((n) => n + 1);
      setSuccess("1 porsi dipesan. Bayar di tempat dan tunjukkan QR ke tenant.");
      setSuccessOrderId(body?.orderId ?? null);
    } catch {
      setItems(prev);
      setError("Gagal memesan. Coba lagi.");
    } finally {
      setOrdering(null);
    }
  }

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
        <fieldset className="ml-auto flex items-center gap-1" aria-label="Pilihan tampilan">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            title="Tampilan grid"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <LayoutGrid className="size-5" aria-hidden />
            <span className="sr-only">Tampilan grid</span>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            title="Tampilan daftar"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <List className="size-5" aria-hidden />
            <span className="sr-only">Tampilan daftar</span>
          </button>
        </fieldset>
        <p className="flex basis-full text-xs text-muted-foreground">
          <output>
            {filtered.length} porsi{locked >= 2 ? " · batas 2/hari tercapai" : ""}
          </output>
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {success && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-foreground bg-card px-4 pt-3 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm sm:rounded-t-xl sm:border-2 sm:border-b-0"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <p className="text-sm font-bold">{success}</p>
          <Button
            type="button"
            onClick={() =>
              (window.location.href = successOrderId ? `/pesanan/${successOrderId}` : "/pesanan")
            }
            className="mt-2 min-h-11 w-full"
          >
            Lihat QR pesanan
          </Button>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="border-b py-10 text-center">
          <p className="font-bold">Belum ada porsi tersedia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Katalog biasanya diperbarui tenant pukul 15.30–16.30. Cek lagi sore ini.
          </p>
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {shown.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            return (
              <li key={p.id}>
                <Reveal className="group relative isolate flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <div className="relative block aspect-[4/3] w-full bg-muted">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.menuName}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                        <ImageOff className="size-8" aria-hidden />
                        <span className="text-xs">tidak ada gambar</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h2 className="line-clamp-2 min-h-10 break-words text-[15px] font-bold leading-snug sm:text-base">
                      <Link
                        href={`/katalog/${p.id}`}
                        className="underline-offset-4 hover:underline group-hover:underline after:absolute after:inset-0 after:content-['']"
                      >
                        {p.menuName}
                      </Link>
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.tenantName} · Dimasak {formatDateTimeWIB(new Date(p.cookedAt))}
                      {soldOut ? " · Habis" : ` · Sisa ${p.quantityRemaining}`}
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm">
                      <s className="text-[11px] text-muted-foreground sm:text-xs">
                        {formatIDR(p.normalPrice)}
                      </s>
                      <strong className="text-base sm:text-lg">{formatIDR(p.discountPrice)}</strong>
                    </p>
                    <Button
                      type="button"
                      disabled={ordering === p.id || soldOut || locked >= 2}
                      onClick={() => order(p.id)}
                      aria-label={`Pesan ${p.menuName}`}
                      className="relative z-10 mt-2 min-h-11 w-full"
                    >
                      {ordering === p.id ? (
                        <>
                          <Spinner />
                          Memesan…
                        </>
                      ) : soldOut ? (
                        "Habis"
                      ) : (
                        "Pesan"
                      )}
                    </Button>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
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
                      <s className="text-[11px] text-muted-foreground sm:text-xs">
                        {formatIDR(p.normalPrice)}
                      </s>
                      <strong className="text-base sm:text-lg">{formatIDR(p.discountPrice)}</strong>
                    </p>
                    <Button
                      type="button"
                      disabled={ordering === p.id || soldOut || locked >= 2}
                      onClick={() => order(p.id)}
                      aria-label={`Pesan ${p.menuName}`}
                      className="relative z-10 min-h-11 flex-1 sm:flex-none"
                    >
                      {ordering === p.id ? (
                        <>
                          <Spinner />
                          Memesan…
                        </>
                      ) : soldOut ? (
                        "Habis"
                      ) : (
                        "Pesan"
                      )}
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
      {visible >= filtered.length && filtered.length > BATCH && (
        <p className="pb-4 text-center text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {filtered.length} porsi
        </p>
      )}
      <GuidedTour
        tourKey="katalog"
        steps={[
          {
            target: '[data-tour="filter"]',
            title: "Saring porsi",
            body: "Pilih tenant atau ganti tampilan grid/daftar.",
          },
          {
            target: "ul li:first-child",
            title: "Kunci porsimu",
            body: "Ketuk Pesan, ambil dengan QR, bayar di tempat.",
          },
        ]}
      />
    </div>
  );
}

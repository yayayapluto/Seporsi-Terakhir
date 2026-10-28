"use client";

import { ImageOff, LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const moreRef = useRef<HTMLDivElement>(null);

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
      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <Label className="text-sm font-semibold">Tenant</Label>
        <Select value={tenant} onValueChange={(v) => setTenant(String(v))}>
          <SelectTrigger className="h-11 w-fit min-w-32 max-w-[55vw] sm:min-w-40">
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
        <fieldset className="ml-auto flex items-center gap-1">
          <legend className="sr-only">Pilihan tampilan</legend>
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            title="Tampilan grid"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-md border ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <LayoutGrid className="size-5" aria-hidden />
            <span className="sr-only">Tampilan grid</span>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            title="Tampilan daftar"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-md border ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <List className="size-5" aria-hidden />
            <span className="sr-only">Tampilan daftar</span>
          </button>
        </fieldset>
        <p className="flex basis-full flex-wrap gap-x-3 text-xs text-muted-foreground sm:text-sm">
          <output>{filtered.length} porsi tersedia</output>
          <output className="font-semibold">Porsi terkunci {Math.min(locked, 2)}/2 hari ini</output>
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
        <output className="block rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          {success}{" "}
          {successOrderId ? (
            <Link
              href={`/pesanan/${successOrderId}`}
              className="font-semibold underline underline-offset-4"
            >
              Lihat QR pesanan
            </Link>
          ) : (
            <Link href="/pesanan" className="font-semibold underline underline-offset-4">
              Lihat pesanan
            </Link>
          )}
        </output>
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
                <Reveal className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card">
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
                    <h2 className="break-words text-[15px] font-bold leading-snug sm:text-base">
                      <Link
                        href={`/katalog/${p.id}`}
                        className="underline-offset-4 hover:underline group-hover:underline after:absolute after:inset-0 after:content-['']"
                      >
                        {p.menuName}
                      </Link>
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.tenantName}
                      {p.tenantLocation ? ` • ${p.tenantLocation}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dimasak {formatDateTimeWIB(new Date(p.cookedAt))}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {soldOut ? "Sudah habis" : `Sisa ${p.quantityRemaining} porsi`}
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm">
                      <s className="text-[11px] text-muted-foreground sm:text-xs">
                        {formatIDR(p.normalPrice)}
                      </s>
                      <strong className="text-base sm:text-lg">{formatIDR(p.discountPrice)}</strong>
                    </p>
                    <button
                      type="button"
                      disabled={ordering === p.id || soldOut || locked >= 2}
                      onClick={() => order(p.id)}
                      aria-label={`Pesan ${p.menuName}`}
                      className="relative z-10 mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {ordering === p.id ? "Memesan…" : soldOut ? "Habis" : "Pesan"}
                    </button>
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
                <Reveal className="group relative flex flex-col gap-3 py-4 sm:flex-row">
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
                      <h2 className="break-words text-[15px] font-bold leading-snug sm:text-base">
                        <Link
                          href={`/katalog/${p.id}`}
                          className="underline-offset-4 hover:underline group-hover:underline after:absolute after:inset-0 after:content-['']"
                        >
                          {p.menuName}
                        </Link>
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {p.tenantName}
                        {p.tenantLocation ? ` • ${p.tenantLocation}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Dimasak {formatDateTimeWIB(new Date(p.cookedAt))}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        {soldOut ? "Sudah habis" : `Sisa ${p.quantityRemaining} porsi`}
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
                    <button
                      type="button"
                      disabled={ordering === p.id || soldOut || locked >= 2}
                      onClick={() => order(p.id)}
                      aria-label={`Pesan ${p.menuName}`}
                      className="relative z-10 inline-flex h-11 flex-1 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
                    >
                      {ordering === p.id ? "Memesan…" : soldOut ? "Habis" : "Pesan"}
                    </button>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
      {visible < filtered.length && (
        <div ref={moreRef} className="flex justify-center py-6" aria-hidden="true">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}
      {visible >= filtered.length && filtered.length > BATCH && (
        <p className="pb-4 text-center text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {filtered.length} porsi
        </p>
      )}
    </div>
  );
}

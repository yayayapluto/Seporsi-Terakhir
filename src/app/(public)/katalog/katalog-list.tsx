"use client";

import { useMemo, useState } from "react";
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

export function KatalogList({
  portions,
  tenants,
}: {
  portions: CatalogPortion[];
  tenants: string[];
}) {
  const [tenant, setTenant] = useState<string>("semua");
  const [ordering, setOrdering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogPortion[]>(portions);

  const filtered = useMemo(
    () => (tenant === "semua" ? items : items.filter((p) => p.tenantName === tenant)),
    [items, tenant],
  );

  async function order(id: string) {
    setOrdering(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portionId: id, quantity: 1 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Gagal memesan. Coba lagi.");
        return;
      }
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantityRemaining: p.quantityRemaining - 1 } : p)),
      );
      setSuccess("Pesanan terkunci. Bayar di tempat dan tunjukkan pesanan ini ke tenant.");
    } catch {
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
          <SelectTrigger className="h-11 w-fit min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua tenant</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <output className="text-sm text-muted-foreground">{filtered.length} porsi tersedia</output>
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
          {success}
        </output>
      )}
      {filtered.length === 0 ? (
        <div className="border-b py-10 text-center">
          <p className="font-bold">Belum ada porsi tersedia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Katalog biasanya diperbarui tenant pukul 15.30–16.30. Cek lagi sore ini.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border-b">
          {filtered.map((p) => {
            const soldOut = p.quantityRemaining <= 0;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <h2 className="font-bold leading-snug">{p.menuName}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.tenantName}
                    {p.tenantLocation ? ` • ${p.tenantLocation}` : ""} • Dimasak{" "}
                    {formatDateTimeWIB(new Date(p.cookedAt))}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                    {soldOut ? "Sudah habis" : `Sisa ${p.quantityRemaining} porsi`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                  <p className="text-sm">
                    <s className="mr-1.5 text-xs text-muted-foreground">
                      {formatIDR(p.normalPrice)}
                    </s>
                    <strong className="text-lg">{formatIDR(p.discountPrice)}</strong>
                  </p>
                  <button
                    type="button"
                    disabled={ordering === p.id || soldOut}
                    onClick={() => order(p.id)}
                    className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640] disabled:opacity-50"
                  >
                    {ordering === p.id ? "Memesan…" : soldOut ? "Habis" : "Kunci 1 porsi"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

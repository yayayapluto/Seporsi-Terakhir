"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
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

  const filtered = useMemo(
    () => (tenant === "semua" ? portions : portions.filter((p) => p.tenantName === tenant)),
    [portions, tenant],
  );

  async function order(id: string) {
    setOrdering(id);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portionId: id, quantity: 1 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Gagal memesan. Coba lagi.");
      }
    } catch {
      setError("Gagal memesan. Coba lagi.");
    } finally {
      setOrdering(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="tenant-filter" className="text-sm font-medium">
          Tenant:
        </label>
        <select
          id="tenant-filter"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          className="h-10 rounded-lg border bg-card px-3 text-sm"
        >
          <option value="semua">Semua tenant</option>
          {tenants.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <output className="text-sm text-muted-foreground">{filtered.length} porsi tersedia</output>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="font-bold">Belum ada porsi tersedia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Katalog biasanya diperbarui tenant pukul 15.30–16.30. Cek lagi sore ini.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.22, delay: Math.min(i % 6, 5) * 0.04 }}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4"
            >
              <div>
                <h2 className="font-bold leading-snug">{p.menuName}</h2>
                <p className="text-xs text-muted-foreground">
                  {p.tenantName}
                  {p.tenantLocation ? ` • ${p.tenantLocation}` : ""}
                </p>
              </div>
              <p className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                <span className="rounded-md border px-1.5 py-0.5">
                  Dimasak {formatDateTimeWIB(new Date(p.cookedAt))}
                </span>
                <span className="rounded-md border px-1.5 py-0.5">
                  Sisa {p.quantityRemaining} porsi
                </span>
              </p>
              <p className="text-sm">
                <s className="mr-1.5 text-xs text-muted-foreground">{formatIDR(p.normalPrice)}</s>
                <strong className="text-[#8a5a00]">{formatIDR(p.discountPrice)}</strong>
              </p>
              <div className="mt-auto flex gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={ordering === p.id}
                  onClick={() => order(p.id)}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640] disabled:opacity-70"
                >
                  {ordering === p.id ? "Memesan…" : "Pesan 1 porsi"}
                </motion.button>
                <Link
                  href={`/katalog/${p.id}`}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Detail
                </Link>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

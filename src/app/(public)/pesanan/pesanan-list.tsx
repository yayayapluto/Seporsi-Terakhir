"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { cancelOrder } from "./actions";
import type { MyOrder } from "./page";

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "reserved", label: "Menunggu pickup" },
  { value: "picked_up", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
] as const;

export function OrdersList({ orders, loadError }: { orders: MyOrder[]; loadError: string | null }) {
  const [filter, setFilter] = useState<string>("semua");
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "semua" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  function cancel(orderId: string) {
    if (!window.confirm("Batalkan pesanan ini? Stok porsi akan dikembalikan.")) return;
    setError(null);
    setCancelling(orderId);
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      if (!res.ok) setError(res.error);
      setCancelling(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <label htmlFor="status-filter" className="text-sm font-semibold">
          Status
        </label>
        <select
          id="status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 rounded-md border bg-card px-3 text-sm"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <output className="text-sm text-muted-foreground">{filtered.length} pesanan</output>
      </div>

      {loadError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {loadError ? null : filtered.length === 0 ? (
        <EmptyState
          title={filter === "semua" ? "Belum ada pesanan" : "Tidak ada pesanan dengan status ini"}
          hint={
            filter === "semua"
              ? "Porsi hari ini menunggu diselamatkan."
              : "Coba filter status lain."
          }
          ctaHref="/katalog"
          ctaLabel="Lihat katalog"
        />
      ) : (
        <ul className="divide-y divide-border border-b">
          {filtered.map((o) => (
            <li key={o.orderId} className="flex flex-col gap-2 py-4 sm:flex-row sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold leading-snug">
                    {o.menuName} <span className="font-normal">× {o.quantity}</span>
                  </h2>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {o.tenantName}
                  {o.tenantLocation ? ` · ${o.tenantLocation}` : ""} · dipesan{" "}
                  {formatDateTimeWIB(new Date(o.createdAt))} WIB
                </p>
                {o.slotStart && o.slotEnd && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Slot pickup: {formatDateTimeWIB(new Date(o.slotStart))} –{" "}
                    {formatDateTimeWIB(new Date(o.slotEnd))} WIB
                  </p>
                )}
                {o.pickedUpAt && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Diambil {formatDateTimeWIB(new Date(o.pickedUpAt))} WIB
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm font-bold">
                  {formatIDR(o.discountPriceSnapshot * o.quantity)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {o.status === "reserved" && (
                    <Link
                      href={`/pesanan/${o.orderId}`}
                      className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
                    >
                      Lihat QR pickup
                    </Link>
                  )}
                  <Link
                    href={`/pesanan/${o.orderId}`}
                    className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold transition-colors hover:bg-[#F3EFE6]"
                  >
                    Detail
                  </Link>
                  {o.status === "reserved" && (
                    <button
                      type="button"
                      onClick={() => cancel(o.orderId)}
                      disabled={cancelling !== null || pending}
                      className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                    >
                      {cancelling === o.orderId ? "Membatalkan…" : "Batalkan"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

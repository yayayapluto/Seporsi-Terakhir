"use client";

import { cn } from "cn";
import { Store } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { SieraAlert, SieraSection, SieraTile, sieraCardClass } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { pesananDetail, ROUTES } from "@/lib/routes";
import { cancelOrder } from "./actions";
import { OrderLiveStatus } from "./order-live-status";
import type { MyOrder } from "./page";
import { QrModal } from "./qr-modal";

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "reserved", label: "Menunggu pickup" },
  { value: "picked_up", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
] as const;

export function OrdersList({ orders, loadError }: { orders: MyOrder[]; loadError: string | null }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("semua");
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const reduce = useReducedMotion();

  const filtered = useMemo(
    () => (filter === "semua" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  function cancel(orderId: string) {
    setError(null);
    setCancelling(orderId);
    setConfirmId(null);
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      if (!res.ok) setError(res.error);
      else router.refresh();
      setCancelling(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SieraSection
        id="filter-heading"
        label="Saring pesanan"
        action={
          <output className="inline-flex min-h-11 items-center text-sm font-bold text-[#1E5A36]">
            {filtered.length} pesanan
          </output>
        }
      >
        <div data-tour="order-filter" className={cn(sieraCardClass, "flex flex-col gap-3 p-4")}>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="status-filter"
              className="w-12 shrink-0 text-[13px] font-semibold text-[#64746B]"
            >
              Status
            </Label>
            <Select value={filter} onValueChange={(v) => setFilter(String(v))}>
              <SelectTrigger id="status-filter" className="h-11 min-w-0 flex-1 gap-1 px-2 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SieraSection>

      {loadError && <SieraAlert variant="error">{loadError}</SieraAlert>}
      {error && <SieraAlert variant="error">{error}</SieraAlert>}

      {loadError ? null : filtered.length === 0 ? (
        <EmptyState
          title={filter === "semua" ? "Belum ada pesanan" : "Tidak ada pesanan dengan status ini"}
          hint={
            filter === "semua"
              ? "Porsi hari ini menunggu diselamatkan."
              : "Coba filter status lain."
          }
          ctaHref={ROUTES.katalog}
          ctaLabel="Lihat katalog"
        />
      ) : (
        <SieraSection
          id="list-heading"
          label={`Daftar pesanan${filtered.length > 0 ? ` (${filtered.length})` : ""}`}
        >
          <OrderLiveStatus
            orderIds={filtered.filter((o) => o.status === "reserved").map((o) => o.orderId)}
          />
          <motion.ul
            data-tour="order-list"
            layout={!reduce}
            className="flex min-w-0 flex-col gap-3"
          >
            {filtered.map((o) => (
              <motion.li
                key={o.orderId}
                layout={!reduce}
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, y: 12 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.2, ease: "easeOut" as const },
                    })}
                className={cn(sieraCardClass, "flex flex-col gap-3 p-4")}
              >
                <div className="flex items-center gap-3">
                  <SieraTile>
                    <Store className="size-5" strokeWidth={1.75} aria-hidden />
                  </SieraTile>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] leading-snug font-bold text-[#1C2826]">
                        {o.menuName} <span className="font-semibold">× {o.quantity}</span>
                      </h2>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-[#64746B]">
                      {o.tenantName}
                      {o.tenantLocation ? ` · ${o.tenantLocation}` : ""} · dipesan{" "}
                      {formatDateTimeWIB(new Date(o.createdAt))} WIB
                    </p>
                    {o.pickedUpAt && (
                      <p className="mt-0.5 text-[13px] text-[#64746B]">
                        Diambil {formatDateTimeWIB(new Date(o.pickedUpAt))} WIB
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t border-dashed border-line" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-extrabold text-accent-strong">
                    {formatIDR(o.discountPriceSnapshot * o.quantity)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {o.status === "reserved" && <QrModal order={o} />}
                    <Link
                      href={pesananDetail(o.orderId)}
                      className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5")}
                    >
                      Detail
                    </Link>
                    {o.status === "reserved" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 border-[#F1B6B6] px-5 text-[#BA1A1A] hover:bg-[#FEE2E2] hover:text-[#BA1A1A]"
                        onClick={() => setConfirmId(o.orderId)}
                        disabled={cancelling === o.orderId}
                      >
                        {cancelling === o.orderId ? (
                          <>
                            <Spinner />
                            Membatalkan…
                          </>
                        ) : (
                          "Batalkan"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </SieraSection>
      )}
      <Dialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent>
          <DialogTitle>Batalkan pesanan?</DialogTitle>
          <DialogDescription>Stok porsi akan dikembalikan ke katalog.</DialogDescription>
          <DialogFooter>
            <Button type="button" autoFocus className="min-h-11" onClick={() => setConfirmId(null)}>
              Kembali
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={confirmId === null || cancelling !== null}
              onClick={() => confirmId && cancel(confirmId)}
            >
              Ya, batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

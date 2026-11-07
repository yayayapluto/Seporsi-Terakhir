"use client";

import { cn } from "cn";
import { Store } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PickupCountdown } from "@/components/pickup-countdown";
import { SieraAlert, SieraTile, sieraCardClass } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { pesananDetail, ROUTES } from "@/lib/routes";
import { cancelOrder, sweepLatePickups } from "./actions";
import { OrderLiveStatus } from "./order-live-status";
import type { MyOrder } from "./page";

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
      <fieldset
        aria-label="Saring pesanan"
        data-tour="order-filter"
        className="m-0 flex min-w-0 flex-wrap gap-2.5 border-0 p-0"
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const count =
            f.value === "semua" ? orders.length : orders.filter((o) => o.status === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-[18px] text-sm transition-colors",
                active
                  ? "border-primary bg-primary font-bold text-primary-foreground"
                  : "border-line bg-white font-semibold text-[#2F4037] hover:bg-[#F1F5F2] focus-visible:bg-[#F1F5F2]",
              )}
            >
              {f.label}
              <span className={cn("ml-1.5", active ? "opacity-85" : "text-[#64746B]")}>
                {count}
              </span>
            </button>
          );
        })}
      </fieldset>

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
        <div className="flex min-w-0 flex-col gap-3">
          <OrderLiveStatus
            orderIds={filtered.filter((o) => o.status === "reserved").map((o) => o.orderId)}
          />
          <motion.ul
            data-tour="order-list"
            layout={!reduce}
            aria-label="Daftar pesanan"
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
              >
                <article
                  className={cn(sieraCardClass, "flex min-w-0 flex-col gap-3 px-5 py-[18px]")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <SieraTile className="size-12 shrink-0">
                      <Store className="size-[22px]" strokeWidth={1.8} aria-hidden />
                    </SieraTile>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 max-md:hidden">
                        <h2 className="text-base font-bold text-[#1C2826]">
                          {o.menuName}{" "}
                          <span className="font-semibold opacity-60">× {o.quantity}</span>
                        </h2>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <div className="flex min-w-0 flex-col items-start gap-1 md:hidden">
                        <h2 className="text-base font-bold text-[#1C2826] break-words">
                          {o.menuName}{" "}
                          <span className="font-semibold opacity-60">× {o.quantity}</span>
                        </h2>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 truncate text-[13px] text-[#64746B] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                        {o.tenantName}
                        {o.tenantLocation ? ` · ${o.tenantLocation}` : ""}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-[#64746B] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                        {formatDateTimeWIB(new Date(o.createdAt))} WIB
                      </p>
                      {o.pickedUpAt && (
                        <p className="truncate text-[13px] text-[#64746B] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                          Diambil {formatDateTimeWIB(new Date(o.pickedUpAt))} WIB
                        </p>
                      )}
                      {o.status === "reserved" && o.pickupDeadlineAt && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-[#B45309]">
                          Ambil dalam{" "}
                          <PickupCountdown
                            deadlineIso={o.pickupDeadlineAt}
                            className="tabular-nums"
                            onExpire={() => {
                              void sweepLatePickups().then(() => router.refresh());
                            }}
                          />
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-base font-extrabold text-[#1E5A36] max-md:hidden">
                      {formatIDR(o.discountPriceSnapshot * o.quantity)}
                    </p>
                  </div>
                  {o.status === "reserved" && (
                    <Link
                      href={pesananDetail(o.orderId)}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-bold text-[#1E5A36] md:hidden",
                      )}
                    >
                      Lihat QR pickup
                    </Link>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-2 max-md:hidden">
                    <Link
                      href={pesananDetail(o.orderId)}
                      className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-xl px-5")}
                    >
                      Detail
                    </Link>
                    {o.status === "reserved" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl border-[#F1B6B6] px-5 text-[#BA1A1A] hover:bg-[#FEE2E2] hover:text-[#BA1A1A]"
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
                  <div className="flex flex-wrap items-center justify-between gap-2 md:hidden">
                    <p className="text-base font-extrabold text-[#1E5A36]">
                      {formatIDR(o.discountPriceSnapshot * o.quantity)}
                    </p>
                    <div className="flex items-center gap-2">
                      {o.status === "reserved" && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-xl border-[#F1B6B6] px-4 text-[#BA1A1A] hover:bg-[#FEE2E2] hover:text-[#BA1A1A]"
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
                      <Link
                        href={pesananDetail(o.orderId)}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "h-11 rounded-xl px-5",
                        )}
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </article>
              </motion.li>
            ))}
          </motion.ul>
        </div>
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

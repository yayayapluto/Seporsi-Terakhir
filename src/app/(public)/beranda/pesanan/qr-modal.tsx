"use client";

import { useState } from "react";
import { QRCode } from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/format";
import { getPickupToken } from "./actions";
import type { MyOrder } from "./page";

/**
 * Modal QR pickup di baris list: token diambil on-open via server action
 * (bukan dari payload list), dirender hanya sebagai QR value.
 */
export function QrModal({ order }: { order: MyOrder }) {
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const total = order.discountPriceSnapshot * order.quantity;

  async function onOpenChange(open: boolean) {
    if (!open) return;
    setFailed(false);
    if (token) return;
    const res = await getPickupToken(order.orderId);
    if (res.ok) setToken(res.token);
    else setFailed(true);
  }

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button type="button" className="h-11 px-5" />}>
        Lihat QR pickup
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            Tunjukkan layar ini
          </p>
          <DialogTitle className="text-2xl">{order.tenantName}</DialogTitle>
          <DialogDescription>
            {order.menuName} · {order.tenantLocation ?? "lihat lokasi di detail pesanan"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {token ? (
            <>
              <QRCode value={token} size={256} title={`QR pickup pesanan ${order.menuName}`} />
              <p className="text-center">
                <span className="block text-xs text-muted-foreground">
                  Kode manual (bila kamera tenant bermasalah)
                </span>
                <span className="font-mono text-lg font-bold tracking-widest">
                  {token.slice(0, 8).toUpperCase()}
                </span>
              </p>
            </>
          ) : (
            <output className="flex h-64 w-64 items-center justify-center" aria-label="Memuat QR">
              {failed ? (
                <span className="rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                  Gagal memuat QR. Coba lagi.
                </span>
              ) : (
                <Skeleton className="h-64 w-64 rounded-lg" />
              )}
            </output>
          )}
          <p className="text-center">
            <span className="block text-xs text-muted-foreground">Total bayar tunai</span>
            <span className="text-3xl font-bold">{formatIDR(total)}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
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
          <DialogTitle>{order.menuName}</DialogTitle>
          <DialogDescription>
            {order.tenantName}
            {order.tenantLocation ? ` · ${order.tenantLocation}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {token ? (
            <QRCode value={token} size={256} title={`QR pickup pesanan ${order.menuName}`} />
          ) : (
            <output className="flex h-64 w-64 items-center justify-center rounded-lg bg-muted text-center text-sm text-muted-foreground">
              {failed ? "Gagal memuat QR. Coba lagi." : "Memuat QR…"}
            </output>
          )}
          <p className="text-center">
            <span className="block text-xs text-muted-foreground">Total bayar di tempat</span>
            <span className="text-xl font-bold">{formatIDR(total)}</span>
          </p>
          {order.slotStart && order.slotEnd && (
            <p className="text-center text-sm">
              Slot pickup:{" "}
              <span className="font-semibold">
                {formatDateTimeWIB(new Date(order.slotStart))} –{" "}
                {formatDateTimeWIB(new Date(order.slotEnd))} WIB
              </span>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

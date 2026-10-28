"use client";

import { QRCode } from "react-qr-code";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";

/**
 * QR pickup besar. pickup_token hanya hidup di sini sebagai QR value —
 * tidak pernah dirender/dilog sebagai teks atau URL.
 */
export function QrPanel({
  menuName,
  tenantName,
  tenantLocation,
  totalPrice,
  slotStart,
  slotEnd,
  pickupToken,
}: {
  menuName: string;
  tenantName: string;
  tenantLocation: string | null;
  totalPrice: number;
  slotStart: string | null;
  slotEnd: string | null;
  pickupToken: string | null;
}) {
  if (!pickupToken) {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        Gagal memuat QR. Muat ulang halaman atau hubungi tenant di lokasi pickup.
      </p>
    );
  }
  return (
    <section aria-labelledby="qr-heading" className="flex flex-col gap-4 border-b pb-8">
      <h2 id="qr-heading" className="text-lg font-bold">
        QR pickup
      </h2>
      <p className="text-sm text-muted-foreground">Tunjukkan ke tenant, bayar di tempat.</p>
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 sm:p-8">
        <p className="text-center text-sm font-bold">{tenantName}</p>
        <QRCode value={pickupToken} size={256} title={`QR pickup pesanan ${menuName}`} />
        <p className="text-center">
          <span className="block text-xs text-muted-foreground">Total bayar di tempat</span>
          <span className="text-xl font-bold">{formatIDR(totalPrice)}</span>
        </p>
        {slotStart && slotEnd && (
          <p className="text-center text-sm">
            Slot pickup:{" "}
            <span className="font-semibold">
              {formatDateTimeWIB(new Date(slotStart))} – {formatDateTimeWIB(new Date(slotEnd))} WIB
            </span>
          </p>
        )}
        {tenantLocation && (
          <p className="text-center text-sm font-semibold">Lokasi: {tenantLocation}</p>
        )}
      </div>
    </section>
  );
}

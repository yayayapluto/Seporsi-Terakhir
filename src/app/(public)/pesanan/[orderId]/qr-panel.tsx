"use client";

import { QRCode } from "react-qr-code";
import { formatIDR } from "@/lib/format";

/**
 * QR pickup besar. pickup_token hanya hidup di sini sebagai QR value —
 * tidak pernah dirender/dilog sebagai teks atau URL.
 */
export function QrPanel({
  menuName,
  tenantName,
  tenantLocation,
  totalPrice,
  pickupToken,
}: {
  menuName: string;
  tenantName: string;
  tenantLocation: string | null;
  totalPrice: number;
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
  <section aria-labelledby="qr-heading" className="flex flex-col gap-4 border-b pb-8">
    <div>
      <p className="text-xs font-bold tracking-widest text-primary uppercase">
        Tunjukkan layar ini
      </p>
      <h2 id="qr-heading" className="mt-1 text-2xl font-bold text-balance">
        {tenantName}
      </h2>
      {tenantLocation && <p className="mt-0.5 text-sm font-semibold">Lokasi: {tenantLocation}</p>}
    </div>
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 sm:p-8">
      <QRCode value={pickupToken} size={256} title={`QR pickup pesanan ${menuName}`} />
      <p className="text-center text-sm font-semibold">
        Tunjukkan ke {tenantName}, bayar {formatIDR(totalPrice)} tunai di tempat.
      </p>
      <p className="text-center">
        <span className="block text-xs text-muted-foreground">Total bayar tunai</span>
        <span className="text-3xl font-bold">{formatIDR(totalPrice)}</span>
      </p>
    </div>
  </section>;
}

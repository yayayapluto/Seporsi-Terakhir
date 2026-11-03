"use client";

import { cn } from "cn";
import { QRCode } from "react-qr-code";
import { sieraCardClass } from "@/components/siera";
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
  return (
    <section aria-labelledby="qr-heading" className={cn(sieraCardClass, "flex flex-col gap-4 p-5")}>
      <div>
        <p className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]">
          Tunjukkan layar ini ke tenant
        </p>
        <h2 id="qr-heading" className="mt-1 text-xl font-extrabold text-[#1C2826]">
          {tenantName}
        </h2>
        {tenantLocation && (
          <p className="mt-0.5 text-sm font-semibold text-[#1C2826]">Lokasi: {tenantLocation}</p>
        )}
      </div>
      <div className="flex flex-col items-center gap-4">
        <QRCode value={pickupToken} size={256} title={`QR pickup pesanan ${menuName}`} />
        <p className="text-center text-sm font-semibold text-[#1C2826]">
          Tunjukkan ke {tenantName}, bayar {formatIDR(totalPrice)} tunai di tempat.
        </p>
        <p className="text-center">
          <span className="block text-xs text-[#64746B]">Total bayar tunai</span>
          <strong className="text-3xl font-extrabold text-accent-strong">
            {formatIDR(totalPrice)}
          </strong>
        </p>
      </div>
    </section>
  );
}

"use client";

import { cn } from "cn";
import { QRCode } from "react-qr-code";
import { SieraAlert, sieraCardClass } from "@/components/siera";
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
      <SieraAlert variant="error">
        Gagal memuat QR. Muat ulang halaman atau hubungi tenant di lokasi pickup.
      </SieraAlert>
    );
  }
  return (
    <section
      aria-labelledby="qr-heading"
      className={cn(
        sieraCardClass,
        "flex flex-col gap-4 p-5 max-md:h-auto max-md:min-h-0 max-md:w-full max-md:min-w-0 max-md:max-w-full max-md:overflow-visible max-md:p-4 max-md:rounded-2xl max-md:bg-white max-md:border max-md:border-[#e3e9e5]",
      )}
    >
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
      <div className="flex w-full min-w-0 flex-col items-center gap-4">
        <div className="mx-auto aspect-square w-full min-w-0 max-w-[260px] rounded-xl border border-[#e3e9e5] bg-white p-3">
          <QRCode
            value={pickupToken}
            size={256}
            title={`QR pickup pesanan ${menuName}`}
            className="block h-full w-full"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <p className="text-center max-md:hidden">
          <span className="block text-xs text-[#64746B]">Total bayar tunai</span>
          <strong className="text-3xl font-extrabold text-[#0d5a38]">
            {formatIDR(totalPrice)}
          </strong>
        </p>
      </div>
    </section>
  );
}

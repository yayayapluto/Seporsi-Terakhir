"use client";

import { QRCode } from "react-qr-code";
import { formatDateTimeWIB } from "@/lib/format";

/**
 * QR pickup besar. pickup_token hanya hidup di sini sebagai QR value —
 * tidak pernah dirender/dilog sebagai teks atau URL.
 */
export function QrPanel({
  menuName,
  slotStart,
  slotEnd,
  pickupToken,
}: {
  menuName: string;
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
      <p className="text-sm text-muted-foreground">
        Tunjukkan QR ini ke tenant saat pickup, lalu bayar di tempat sesuai ringkasan di bawah.
      </p>
      <div className="flex flex-col items-center gap-3 self-start rounded-xl border bg-card p-6">
        <QRCode value={pickupToken} size={220} title={`QR pickup pesanan ${menuName}`} />
        <p className="text-xs text-muted-foreground">Berlaku selama jendela penjualan porsi.</p>
      </div>
      {slotStart && slotEnd && (
        <p className="text-sm">
          Slot pickup-mu:{" "}
          <span className="font-semibold">
            {formatDateTimeWIB(new Date(slotStart))} – {formatDateTimeWIB(new Date(slotEnd))} WIB
          </span>
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Datang di jendela waktu ini supaya porsi masih hangat dan tenant siap menyerahkan.
      </p>
    </section>
  );
}

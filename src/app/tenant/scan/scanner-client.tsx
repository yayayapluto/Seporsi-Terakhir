"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmPickup, lookupOrderByToken } from "./actions";

export interface ScannedOrder {
  menuName: string;
  quantity: number;
  status: string;
  slotStart: string | null;
  slotEnd: string | null;
}

type Phase =
  | { kind: "scanning" }
  | { kind: "preview"; token: string; order: ScannedOrder }
  | { kind: "success" }
  | { kind: "error"; message: string };

const STATUS_LABEL: Record<string, string> = {
  reserved: "Menunggu pickup",
  picked_up: "Sudah diambil",
  cancelled: "Dibatalkan",
};

function orderStatusLine(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export function ScannerClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const [confirming, setConfirming] = useState(false);

  async function onScan(result: string) {
    if (phase.kind !== "scanning") return;
    const res = await lookupOrderByToken(result);
    if (!res.ok) {
      setPhase({ kind: "error", message: res.error });
      return;
    }
    if (res.order.status !== "reserved") {
      setPhase({
        kind: "error",
        message: `Pesanan sudah ${orderStatusLine(res.order.status).toLowerCase()}.`,
      });
      return;
    }
    setPhase({ kind: "preview", token: result, order: res.order });
  }

  async function onConfirm() {
    if (phase.kind !== "preview") return;
    setConfirming(true);
    const res = await confirmPickup(phase.token);
    setConfirming(false);
    if (!res.ok) {
      setPhase({ kind: "error", message: res.error });
      return;
    }
    setPhase({ kind: "success" });
    router.refresh();
  }

  function reset() {
    setPhase({ kind: "scanning" });
  }

  return (
    <div className="flex flex-col gap-4">
      {phase.kind === "scanning" && (
        <div className="flex flex-col gap-3">
          <Scanner
            onScan={(codes) => {
              const value = codes[0]?.rawValue;
              if (value) onScan(value);
            }}
            onError={() => setPhase({ kind: "error", message: "Kamera tidak bisa dibuka." })}
            styles={{ container: { width: "100%", maxWidth: 420, marginInline: "auto" } }}
          />
          <p className="text-center text-sm text-muted-foreground">
            Arahkan kamera ke QR pickup mahasiswa. Konfirmasi terjadi setelah kamu menekan tombol.
          </p>
        </div>
      )}

      {phase.kind === "preview" && (
        <section aria-labelledby="preview-heading" className="rounded-xl border bg-card p-5">
          <h2 id="preview-heading" className="text-lg font-bold">
            Konfirmasi pickup
          </h2>
          <dl className="mt-3 flex flex-col divide-y divide-border">
            <div className="flex gap-3 py-2">
              <dt className="w-28 shrink-0 text-sm text-muted-foreground">Menu</dt>
              <dd className="min-w-0 text-sm font-medium">{phase.order.menuName}</dd>
            </div>
            <div className="flex gap-3 py-2">
              <dt className="w-28 shrink-0 text-sm text-muted-foreground">Jumlah</dt>
              <dd className="min-w-0 text-sm font-medium">{phase.order.quantity} porsi</dd>
            </div>
            {phase.order.slotStart && phase.order.slotEnd && (
              <div className="flex gap-3 py-2">
                <dt className="w-28 shrink-0 text-sm text-muted-foreground">Slot</dt>
                <dd className="min-w-0 text-sm font-medium">
                  {new Date(phase.order.slotStart).toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {" – "}
                  {new Date(phase.order.slotEnd).toLocaleTimeString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            )}
            <div className="flex gap-3 py-2">
              <dt className="w-28 shrink-0 text-sm text-muted-foreground">Status</dt>
              <dd className="min-w-0 text-sm font-medium">{orderStatusLine(phase.order.status)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            Terima pembayaran di tempat sesuai harga diskon, lalu konfirmasi.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={reset}>
              Batal
            </Button>
            <Button type="button" onClick={onConfirm} disabled={confirming}>
              {confirming ? "Mengonfirmasi…" : "Konfirmasi pickup"}
            </Button>
          </div>
        </section>
      )}

      {phase.kind === "success" && (
        <output aria-live="polite" className="block rounded-xl border bg-card p-8 text-center">
          <p className="text-2xl font-bold text-primary">✓</p>
          <p className="mt-2 font-bold">Pickup dikonfirmasi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pesanan tercatat selesai. Pembayaran diterima di tempat.
          </p>
          <Button type="button" className="mt-4" onClick={reset}>
            Scan berikutnya
          </Button>
        </output>
      )}

      {phase.kind === "error" && (
        <section
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-center"
        >
          <p className="font-bold text-destructive">Gagal</p>
          <p className="mt-1 text-sm text-destructive">{phase.message}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={reset}>
            Scan ulang
          </Button>
        </section>
      )}
    </div>
  );
}

"use client";

import { type IScannerError, Scanner } from "@yudiel/react-qr-scanner";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SieraTenantHeader, sieraCardClass } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { confirmPickup, lookupOrderByToken } from "./actions";

export interface ScannedOrder {
  menuName: string;
  quantity: number;
  status: string;
  totalPrice: number;
}

type Phase =
  | { kind: "scanning" }
  | { kind: "preview"; token: string; order: ScannedOrder }
  | { kind: "success"; order: ScannedOrder }
  | { kind: "error"; message: string; hint?: string; showManual?: boolean };

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  async function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualBusy) return;
    const token = manualToken.trim();
    if (!token) return;
    setManualBusy(true);
    const res = await lookupOrderByToken(token);
    setManualBusy(false);
    if (!res.ok) {
      setPhase({ kind: "error", message: res.error });
      return;
    }
    if (res.order.status === "picked_up") {
      setPhase({ kind: "error", message: "Pesanan ini sudah diambil." });
      return;
    }
    if (res.order.status === "cancelled") {
      setPhase({ kind: "error", message: "Pesanan ini sudah dibatalkan." });
      return;
    }
    if (res.order.status !== "reserved") {
      setPhase({
        kind: "error",
        message: `Pesanan berstatus ${orderStatusLine(res.order.status).toLowerCase()}.`,
      });
      return;
    }
    setPhase({ kind: "preview", token, order: res.order });
  }

  async function onScan(result: string) {
    if (phase.kind !== "scanning") return;
    const res = await lookupOrderByToken(result);
    if (!res.ok) {
      setPhase({ kind: "error", message: res.error });
      return;
    }
    if (res.order.status === "picked_up") {
      setPhase({ kind: "error", message: "Pesanan ini sudah diambil." });
      return;
    }
    if (res.order.status === "cancelled") {
      setPhase({ kind: "error", message: "Pesanan ini sudah dibatalkan." });
      return;
    }
    if (res.order.status !== "reserved") {
      setPhase({
        kind: "error",
        message: `Pesanan berstatus ${orderStatusLine(res.order.status).toLowerCase()}.`,
      });
      return;
    }
    setPhase({ kind: "preview", token: result, order: res.order });
  }

  async function onConfirm() {
    if (phase.kind !== "preview") return;
    setConfirmOpen(false);
    setConfirming(true);
    const res = await confirmPickup(phase.token);
    setConfirming(false);
    if (!res.ok) {
      setPhase({ kind: "error", message: res.error });
      return;
    }
    setPhase({ kind: "success", order: phase.order });
    router.refresh();
  }
  function onCameraError(error: IScannerError) {
    switch (error.kind) {
      case "permission-denied":
        setPhase({
          kind: "error",
          message: "Akses kamera diblokir.",
          hint: "Ketuk ikon kamera di address bar untuk mengizinkan, lalu pilih Scan ulang.",
          showManual: true,
        });
        break;
      case "no-camera":
        setPhase({
          kind: "error",
          message: "Tidak ada kamera di perangkat ini.",
          hint: "Minta kode pickup dari layar mahasiswa, lalu masukkan manual.",
          showManual: true,
        });
        break;
      case "in-use":
        setPhase({
          kind: "error",
          message: "Kamera sedang dipakai aplikasi lain.",
          hint: "Tutup aplikasi yang memakai kamera, lalu pilih Scan ulang.",
          showManual: true,
        });
        break;
      default:
        setPhase({
          kind: "error",
          message: "Kamera tidak bisa dibuka.",
          hint: "Pilih Scan ulang, atau masukkan kode manual dari layar mahasiswa.",
          showManual: true,
        });
    }
  }

  function reset(openManual = false) {
    setManualOpen(openManual);
    setManualToken("");
    setPhase({ kind: "scanning" });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <SieraTenantHeader kicker="SCANNER TENANT" title="Scan pickup">
        <p className="text-sm">Arahkan kamera ke QR pickup mahasiswa.</p>
      </SieraTenantHeader>
      {phase.kind === "scanning" && (
        <div data-tour="scanner" className="flex flex-col gap-3">
          <Scanner
            onScan={(codes) => {
              const value = codes[0]?.rawValue;
              if (value) onScan(value);
            }}
            onError={onCameraError}
            styles={{ container: { width: "100%", maxWidth: 420, marginInline: "auto" } }}
          />
          <p className="text-center text-sm text-muted-foreground">
            QR hanya pratinjau. Tekan Konfirmasi setelah terima bayar.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="ghost"
              data-tour="manual"
              className="min-h-11 self-center px-3 text-sm underline"
              onClick={() => setManualOpen((v) => !v)}
              aria-expanded={manualOpen}
            >
              {manualOpen ? "Sembunyikan kode manual" : "Kamera bermasalah? Masukkan kode manual"}
            </Button>
            {manualOpen && (
              <form onSubmit={onManualSubmit} className="flex flex-col gap-2">
                <label htmlFor="manual-token" className="text-center text-sm text-muted-foreground">
                  Minta kode pickup dari layar mahasiswa, lalu tempel di sini.
                </label>
                <input
                  id="manual-token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Tempel kode pickup di sini"
                  autoComplete="off"
                  inputMode="text"
                  className="min-h-11 rounded-md border border-input bg-background px-3 text-sm"
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="min-h-11"
                  disabled={manualBusy || !manualToken.trim()}
                >
                  {manualBusy ? (
                    <>
                      <Spinner />
                      Mencari…
                    </>
                  ) : (
                    "Cari pesanan"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {phase.kind === "preview" && (
        <section aria-labelledby="preview-heading" className={cn(sieraCardClass, "p-5")}>
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
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            Terima pembayaran di tempat sesuai harga diskon, lalu konfirmasi.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => reset()}>
              Batal
            </Button>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger
                render={<Button type="button" className="min-h-11" disabled={confirming} />}
              >
                {confirming ? (
                  <>
                    <Spinner />
                    Mengonfirmasi…
                  </>
                ) : (
                  "Konfirmasi pickup"
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>
                  Konfirmasi pickup {phase.order.menuName} × {phase.order.quantity}?
                </DialogTitle>
                <DialogDescription>
                  Pastikan pembayaran tunai sudah diterima. Tindakan ini tidak bisa dibatalkan.
                </DialogDescription>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={onConfirm}
                    disabled={confirming}
                  >
                    Ya, konfirmasi
                  </Button>
                  <Button
                    type="button"
                    autoFocus
                    className="min-h-11 flex-1"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Kembali
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      )}

      {phase.kind === "success" && (
        <output aria-live="polite" className={cn(sieraCardClass, "block p-8 text-center")}>
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <CheckIcon className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-bold">Pickup dikonfirmasi</p>
          <p className="mt-1 text-sm font-medium">
            {phase.order.menuName} — {phase.order.quantity} porsi
          </p>
          <p className="mt-1 text-2xl font-bold">{formatIDR(phase.order.totalPrice)} diterima</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pesanan tercatat selesai. Pembayaran diterima di tempat.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button type="button" className="min-h-11" onClick={() => reset()}>
              Scan berikutnya
            </Button>
            <Link
              href="/tenant/pesanan"
              className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 text-sm underline")}
            >
              Lihat pesanan
            </Link>
          </div>
        </output>
      )}

      {phase.kind === "error" && (
        <section
          role="alert"
          className="rounded-[20px] border border-destructive/30 bg-destructive/10 p-5 text-center"
        >
          <p className="font-bold text-destructive">{phase.message}</p>
          {phase.hint && <p className="mt-1 text-sm text-destructive">{phase.hint}</p>}
          <div className="mt-4 flex flex-col gap-2">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => reset()}>
              Scan ulang
            </Button>
            {phase.showManual && (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 text-sm underline"
                onClick={() => reset(true)}
              >
                Masukkan kode manual
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

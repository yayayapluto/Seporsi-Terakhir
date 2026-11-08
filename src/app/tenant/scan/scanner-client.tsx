"use client";

import { type IScannerError, type IScannerHandle, Scanner } from "@yudiel/react-qr-scanner";
import { CameraOff, CheckIcon, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyLine } from "@/components/shared/empty-line";
import { SieraRailPage, SieraSection, SieraStat, sieraCardClass } from "@/components/siera";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/toast";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  confirmPickup,
  confirmPickupByCode,
  lookupOrderByCode,
  lookupOrderByToken,
} from "./actions";
import type { LastPickup } from "./page";
export interface ScannedOrder {
  menuName: string;
  quantity: number;
  status: string;
  totalPrice: number;
}

type Phase =
  | { kind: "scanning" }
  | {
      kind: "preview";
      auth: { kind: "token"; value: string } | { kind: "code"; value: string };
      order: ScannedOrder;
    }
  | { kind: "success"; order: ScannedOrder };

const STATUS_LABEL: Record<string, string> = {
  reserved: "Menunggu pickup",
  picked_up: "Sudah diambil",
  cancelled: "Dibatalkan",
};

function orderStatusLine(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export function ScannerClient({
  lastPickup,
  greet,
  tenantName,
}: {
  lastPickup: LastPickup | null;
  greet: string;
  tenantName: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const [confirming, setConfirming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<IScannerHandle | null>(null);
  const [mirrored, setMirrored] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Kamera depan tampil mirror; counter dengan scaleX(-1) agar tidak mirror.
  // Kamera belakang tampil normal; biarkan none.
  useEffect(() => {
    let alive = true;
    const id = window.setInterval(() => {
      const facing = scannerRef.current?.getStream()?.getVideoTracks()[0]?.getSettings().facingMode;
      if (!alive || !facing) return;
      setMirrored(facing !== "environment");
      setVideoReady(true);
      window.clearInterval(id);
    }, 300);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // Pengaman: bila facingMode tak terbaca, tampilkan video apa adanya.
  useEffect(() => {
    if (videoReady) return;
    const t = window.setTimeout(() => setVideoReady(true), 2000);
    return () => window.clearTimeout(t);
  }, [videoReady]);

  async function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualBusy) return;
    const code = manualToken.trim();
    if (!code) return;
    setManualBusy(true);
    const res = await lookupOrderByCode(code);
    setManualBusy(false);
    if (!res.ok) {
      toast.add({ type: "error", title: "Kode tidak dikenali.", description: res.error });
      return;
    }
    if (res.order.status === "picked_up") {
      toast.add({ type: "error", title: "Pesanan ini sudah diambil." });
      return;
    }
    if (res.order.status === "cancelled") {
      toast.add({ type: "error", title: "Pesanan ini sudah dibatalkan." });
      return;
    }
    if (res.order.status !== "reserved") {
      toast.add({
        type: "error",
        title: `Pesanan berstatus ${orderStatusLine(res.order.status).toLowerCase()}.`,
      });
      return;
    }
    setPhase({ kind: "preview", auth: { kind: "code", value: code }, order: res.order });
  }

  async function onScan(result: string) {
    if (phase.kind !== "scanning") return;
    const res = await lookupOrderByToken(result);
    if (!res.ok) {
      toast.add({ type: "error", title: "QR tidak dikenali.", description: res.error });
      return;
    }
    if (res.order.status === "picked_up") {
      toast.add({ type: "error", title: "Pesanan ini sudah diambil." });
      return;
    }
    if (res.order.status === "cancelled") {
      toast.add({ type: "error", title: "Pesanan ini sudah dibatalkan." });
      return;
    }
    if (res.order.status !== "reserved") {
      toast.add({
        type: "error",
        title: `Pesanan berstatus ${orderStatusLine(res.order.status).toLowerCase()}.`,
      });
      return;
    }
    setPhase({ kind: "preview", auth: { kind: "token", value: result }, order: res.order });
  }

  async function onConfirm() {
    if (phase.kind !== "preview") return;
    setConfirmOpen(false);
    setConfirming(true);
    const res =
      phase.auth.kind === "code"
        ? await confirmPickupByCode(phase.auth.value)
        : await confirmPickup(phase.auth.value);
    setConfirming(false);
    if (!res.ok) {
      toast.add({ type: "error", title: "Konfirmasi gagal.", description: res.error });
      return;
    }
    toast.add({
      type: "success",
      title: "Pickup dikonfirmasi.",
      description: `${phase.order.menuName} × ${phase.order.quantity} · ${formatIDR(phase.order.totalPrice)} diterima.`,
    });
    setPhase({ kind: "success", order: phase.order });
    router.refresh();
  }
  function onCameraError(error: IScannerError) {
    switch (error.kind) {
      case "permission-denied":
        setCameraError(
          "Akses kamera diblokir. Ketuk ikon kamera di address bar untuk mengizinkan.",
        );
        break;
      case "no-camera":
        setCameraError("Tidak ada kamera di perangkat ini.");
        break;
      case "in-use":
        setCameraError("Kamera sedang dipakai aplikasi lain.");
        break;
      default:
        setCameraError("Kamera tidak bisa dibuka.");
    }
  }

  function reset(openManual = false) {
    setManualOpen(openManual);
    setManualToken("");
    setCameraError(null);
    setPhase({ kind: "scanning" });
  }
  const manualForm = (
    <form onSubmit={onManualSubmit} className="flex flex-col items-center gap-3 text-center">
      <div className="flex flex-col items-center gap-1">
        <p id="manual-code-heading" className="text-sm font-bold text-[#1C2826]">
          Kode pickup
        </p>
        <p className="text-[13px] text-muted-foreground">
          Minta dari layar mahasiswa, lalu tempel di sini.
        </p>
      </div>
      <InputOTP
        maxLength={4}
        value={manualToken}
        onChange={(v: string) => setManualToken(v.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        aria-label="Kode pickup 4 digit"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
      <Button
        type="submit"
        className="min-h-12 w-full text-[15px]"
        disabled={manualBusy || manualToken.trim().length !== 4}
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
  );

  const manualCard =
    phase.kind === "preview" || phase.kind === "success" ? null : manualOpen ? (
      <div className="rounded-[20px] border border-line bg-white p-4">{manualForm}</div>
    ) : (
      <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-white p-4">
        <p className="text-sm font-bold text-[#1C2826]">Belum bisa pindai?</p>
        <p className="text-sm text-muted-foreground">
          QR hanya pratinjau. Minta kode dari layar mahasiswa, terima bayar, lalu konfirmasi.
        </p>
      </div>
    );

  const main = (
    <>
      <div id="tour-hero" className="flex flex-col gap-2">
        <p className="text-[13px] font-bold text-[#2E7D4F]">SCAN PICKUP</p>
        <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl leading-[1.2] font-extrabold tracking-[-0.02em] text-[#1C2826]">
          {greet}, {tenantName}
        </h1>
        <p className="text-[15px] leading-normal text-[#64746B]">
          Serahkan porsi dalam 3 langkah: bidik QR mahasiswa, terima bayar di tempat, konfirmasi
          pickup.
        </p>
      </div>
      {phase.kind === "scanning" && (
        <div data-tour="scanner" className="relative mx-auto w-full max-w-[520px]">
          <style>{`@media (max-width: 819px){ .siera-scanner video { aspect-ratio: 1/1; object-fit: cover; min-height: 280px; } }`}</style>
          {cameraError ? (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-line bg-white p-6 text-center">
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-2xl bg-[#F1F5F2] text-[#64746B]"
              >
                <CameraOff className="size-6" />
              </span>
              <p className="text-sm font-bold text-[#1C2826]">Kamera tidak tersedia</p>
              <p className="text-[13px] text-muted-foreground">{cameraError}</p>
            </div>
          ) : (
            <>
              <Scanner
                ref={scannerRef}
                onScan={(codes) => {
                  const value = codes[0]?.rawValue;
                  if (value) onScan(value);
                }}
                onError={onCameraError}
                constraints={{ facingMode: "environment" }}
                components={{ finder: false }}
                classNames={{ container: "siera-scanner" }}
                styles={{
                  container: {
                    width: "100%",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid var(--line)",
                  },
                  video: {
                    transform: mirrored ? "scaleX(-1)" : "none",
                    opacity: videoReady ? 1 : 0,
                  },
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <div className="relative h-52 w-52">
                  <span className="absolute top-0 left-0 h-7 w-7 rounded-tl-lg border-t-4 border-l-4 border-[#2E7D4F]" />
                  <span className="absolute top-0 right-0 h-7 w-7 rounded-tr-lg border-t-4 border-r-4 border-[#2E7D4F]" />
                  <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-4 border-l-4 border-[#2E7D4F]" />
                  <span className="absolute right-0 bottom-0 h-7 w-7 rounded-br-lg border-r-4 border-b-4 border-[#2E7D4F]" />
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {phase.kind === "preview" && (
        <section aria-labelledby="preview-heading">
          <div className={cn(sieraCardClass, "p-5")}>
            <p className="text-xs font-bold tracking-wide text-[#1E5A36]">CEK SEBELUM SERAHKAN</p>
            <h2 id="preview-heading" className="mt-1 text-lg font-extrabold">
              {phase.order.menuName} × {phase.order.quantity}
            </h2>
            <p className="mt-1 text-2xl font-extrabold text-primary tabular-nums">
              {formatIDR(phase.order.totalPrice)}
            </p>
            <dl className="mt-3 flex flex-col divide-y divide-dashed divide-line border-t border-dashed border-line">
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-24 shrink-0 text-[13px] text-muted-foreground">Status</dt>
                <dd className="min-w-0 text-sm font-semibold text-[#B45309]">
                  {orderStatusLine(phase.order.status)}
                </dd>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-24 shrink-0 text-[13px] text-muted-foreground">Jumlah</dt>
                <dd className="min-w-0 text-sm font-semibold">{phase.order.quantity} porsi</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-xl bg-[#FEF3C7] px-3 py-2 text-[13px] font-medium text-[#7C4A03]">
              Terima pembayaran tunai {formatIDR(phase.order.totalPrice)} dulu, baru tekan
              konfirmasi.
            </p>
            <div className="mt-3 flex min-w-0 flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-12 w-full"
                onClick={() => reset()}
              >
                Batal, scan ulang
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
                      className="min-h-11 flex-1"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Kembali
                    </Button>
                    <Button
                      type="button"
                      autoFocus
                      className="min-h-11 flex-1"
                      onClick={onConfirm}
                      disabled={confirming}
                    >
                      Ya, konfirmasi
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      )}
      {phase.kind === "success" && (
        <output
          aria-live="polite"
          className="flex flex-col gap-1 rounded-[20px] border border-line bg-gradient-to-b from-[#EAF5ED] to-white p-5"
        >
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#1E5A36]">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#2E7D4F] text-white">
              <CheckIcon className="size-4" aria-hidden="true" />
            </span>
            PICKUP SELESAI
          </p>
          <p className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826] lg:text-2xl">
            {formatIDR(phase.order.totalPrice)} diterima
          </p>
          <p className="text-sm text-[#1E5A36]">
            {phase.order.menuName} × {phase.order.quantity} · pesanan tercatat selesai.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" className="min-h-12 w-full text-[15px]" onClick={() => reset()}>
              Scan berikutnya
            </Button>
            <Link
              href="/tenant/pesanan"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-12 w-full")}
            >
              Lihat pesanan
            </Link>
          </div>
        </output>
      )}
    </>
  );

  const aside = (
    <>
      <SieraSection
        id="manual-heading"
        label="Konfirmasi manual"
        action={
          phase.kind === "scanning" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-tour="manual"
              className="min-h-11"
              onClick={() => setManualOpen((v) => !v)}
              aria-expanded={manualOpen}
            >
              {manualOpen ? "Tutup kode manual" : "Masukkan kode manual"}
            </Button>
          ) : undefined
        }
      >
        {phase.kind === "preview" || phase.kind === "success" ? (
          <EmptyLine>Selesaikan konfirmasi di kolom utama dulu.</EmptyLine>
        ) : (
          manualCard
        )}
      </SieraSection>
      <SieraSection id="terakhir-heading" label="Pickup terakhir">
        {lastPickup == null ? (
          <EmptyLine>Belum ada pickup.</EmptyLine>
        ) : (
          <div className={`${sieraCardClass} p-4`}>
            <SieraStat
              icon={History}
              value={`${lastPickup.menuName} ×${lastPickup.quantity}`}
              label={`${formatDateTimeWIB(new Date(lastPickup.pickedUpAt))} WIB · ${formatIDR(lastPickup.totalPrice)}`}
            />
          </div>
        )}
      </SieraSection>
    </>
  );

  return <SieraRailPage main={main} asideLabel="Bantuan konfirmasi" aside={aside} />;
}

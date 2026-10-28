"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_QUANTITY_PER_ORDER } from "@/lib/domain/constants";
import { formatIDR } from "@/lib/format";

/** Quantity 1–2 + slot pickup opsional (berpasangan) → POST /api/orders → /pesanan/[id]. */

function slotValue(value: string): string | null {
  if (!value) return null;
  // datetime-local tanpa zona → kirim sebagai WIB (UTC+7).
  const d = new Date(`${value}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function OrderForm({
  portionId,
  discountPrice,
  quantityRemaining,
}: {
  portionId: string;
  discountPrice: number;
  quantityRemaining: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const soldOut = quantityRemaining <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (qty < 1 || qty > 2) {
      setError("Jumlah porsi harus 1–2.");
      return;
    }
    if (slotStart !== "" && slotEnd === "") {
      setError("Lengkapi jam mulai dan jam selesai slot pickup.");
      return;
    }
    if (slotStart === "" && slotEnd !== "") {
      setError("Lengkapi jam mulai dan jam selesai slot pickup.");
      return;
    }
    if (slotStart !== "" && slotEnd !== "" && slotEnd <= slotStart) {
      setError("Jam selesai slot harus setelah jam mulai.");
      return;
    }
    const body: Record<string, unknown> = { portionId, quantity: qty };
    const start = slotValue(slotStart);
    const end = slotValue(slotEnd);
    if (start && end) {
      body.slotStart = start;
      body.slotEnd = end;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        orderId?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.orderId) {
        setError(data?.error ?? "Gagal memesan. Coba lagi.");
        return;
      }
      router.push(`/pesanan/${data.orderId}`);
    } catch {
      setError("Gagal memesan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Form pesan porsi">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Label className="font-semibold">Jumlah porsi</Label>
        <Select value={String(qty)} onValueChange={(v) => setQty(Number(v))} disabled={soldOut}>
          <SelectTrigger className="h-11 w-fit min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, MAX_QUANTITY_PER_ORDER].map((n) => (
              <SelectItem key={n} value={String(n)} disabled={n > quantityRemaining}>
                {n} porsi{n > quantityRemaining ? " (sisa tidak cukup)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <output className="text-sm text-muted-foreground">
          Total {formatIDR(discountPrice * qty)}
        </output>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Slot pickup (opsional)</legend>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="slot-start" className="text-xs font-normal text-muted-foreground">
              Jam mulai
            </Label>
            <Input
              id="slot-start"
              type="datetime-local"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
              disabled={soldOut}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="slot-end" className="text-xs font-normal text-muted-foreground">
              Jam selesai
            </Label>
            <Input
              id="slot-end"
              type="datetime-local"
              value={slotEnd}
              onChange={(e) => setSlotEnd(e.target.value)}
              disabled={soldOut}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Kosongkan untuk ambil kapan saja selama jendela penjualan.
        </p>
      </fieldset>
      {soldOut ? (
        <p className="text-sm font-semibold text-[#DE7819]">Porsi ini sudah habis terjual.</p>
      ) : (
        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? "Memproses…" : "Pesan dan dapatkan QR"}
        </Button>
      )}
    </form>
  );
}

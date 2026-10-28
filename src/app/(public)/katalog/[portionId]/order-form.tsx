"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_QUANTITY_PER_ORDER } from "@/lib/domain/constants";
import { formatIDR } from "@/lib/format";

/** Jumlah 1–2 + slot pickup opsional (berpasangan) → POST /api/orders → /pesanan/[id]. */

function slotValue(value: string): string | null {
  if (!value) return null;
  // datetime-local tanpa zona → kirim sebagai WIB (UTC+7).
  const d = new Date(`${value}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO UTC → nilai datetime-local dalam WIB ("YYYY-MM-DDTHH:MM"). */
function toWibInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

interface SlotChip {
  start: string;
  end: string;
  label: string;
}

/** Tiga jendela 30 menit (awal/tengah/akhir) di dalam [releaseAt, expiresAt]. */
function buildSlotChips(releaseIso: string, expiresIso: string): SlotChip[] {
  const start = Date.parse(releaseIso);
  const end = Date.parse(expiresIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return [];
  const MIN = 60_000;
  if (end - start < 15 * MIN) return [];
  const half = 30 * MIN;
  const mid = (start + end) / 2;
  const raw: Array<[number, number]> =
    end - start <= half
      ? [[start, end]]
      : [
          [start, start + half],
          [mid - half / 2, mid + half / 2],
          [end - half, end],
        ];
  const seen = new Set<string>();
  const chips: SlotChip[] = [];
  for (const [s, e] of raw) {
    const cs = Math.max(s, start);
    const ce = Math.min(e, end);
    if (ce - cs < 15 * MIN) continue;
    const chip = {
      start: toWibInput(new Date(cs).toISOString()),
      end: toWibInput(new Date(ce).toISOString()),
      label: "",
    };
    chip.label = `${chip.start.slice(11).replace(":", ".")}–${chip.end.slice(11).replace(":", ".")}`;
    if (seen.has(chip.start + chip.end)) continue;
    seen.add(chip.start + chip.end);
    chips.push(chip);
  }
  return chips;
}

export function OrderForm({
  portionId,
  discountPrice,
  quantityRemaining,
  releaseAt,
  expiresAt,
}: {
  portionId: string;
  discountPrice: number;
  quantityRemaining: number;
  releaseAt: string;
  expiresAt: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [showSlot, setShowSlot] = useState(false);
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const soldOut = quantityRemaining <= 0;
  const maxQty = Math.min(MAX_QUANTITY_PER_ORDER, quantityRemaining);
  const chips = useMemo(() => buildSlotChips(releaseAt, expiresAt), [releaseAt, expiresAt]);
  const minSlot = useMemo(() => toWibInput(releaseAt), [releaseAt]);
  const maxSlot = useMemo(() => toWibInput(expiresAt), [expiresAt]);
  const slotActive = slotStart !== "" || slotEnd !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (qty < 1 || qty > maxQty) {
      setError(`Jumlah porsi harus 1–${maxQty}.`);
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
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Jumlah porsi</legend>
        <div className="flex gap-2">
          {[1, MAX_QUANTITY_PER_ORDER].map((n) => {
            const disabled = soldOut || n > maxQty;
            const selected = qty === n && !disabled;
            return (
              <Label
                key={n}
                className={`flex h-11 min-w-20 flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-40 ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/60"
                }`}
              >
                <input
                  type="radio"
                  name="qty"
                  value={n}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => setQty(n)}
                  className="sr-only"
                />
                {n} porsi
              </Label>
            );
          })}
        </div>
        <output className="text-sm text-muted-foreground">
          Total {formatIDR(discountPrice * qty)}
          {maxQty === 1 && !soldOut && " · sisa 1, maks 1 per pesanan"}
        </output>
      </fieldset>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          aria-expanded={showSlot}
          onClick={() => setShowSlot((v) => !v)}
          className="inline-flex w-fit items-center gap-1 text-sm font-semibold transition-colors hover:text-primary"
        >
          Atur jam ambil (opsional)
          <ChevronDown
            className={`size-4 transition-transform ${showSlot ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {showSlot && (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Slot pickup</legend>
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chips.map((chip, i) => {
                  const selected = slotStart === chip.start && slotEnd === chip.end;
                  return (
                    <Label
                      key={chip.start + chip.end}
                      className={`flex h-9 cursor-pointer items-center rounded-full border px-3 text-xs font-semibold transition-colors has-disabled:opacity-40 ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={i}
                        checked={selected}
                        disabled={soldOut}
                        onChange={() => {
                          setSlotStart(chip.start);
                          setSlotEnd(chip.end);
                        }}
                        className="sr-only"
                      />
                      {chip.label}
                    </Label>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label htmlFor="slot-start" className="text-xs font-normal text-muted-foreground">
                  Jam mulai
                </Label>
                <Input
                  id="slot-start"
                  type="datetime-local"
                  value={slotStart}
                  min={minSlot}
                  max={maxSlot}
                  step={900}
                  onChange={(e) => setSlotStart(e.target.value)}
                  disabled={soldOut}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label htmlFor="slot-end" className="text-xs font-normal text-muted-foreground">
                  Jam selesai
                </Label>
                <Input
                  id="slot-end"
                  type="datetime-local"
                  value={slotEnd}
                  min={minSlot}
                  max={maxSlot}
                  step={900}
                  onChange={(e) => setSlotEnd(e.target.value)}
                  disabled={soldOut}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {slotActive
                ? "Pilih chip atau ubah manual. Kosongkan keduanya untuk ambil kapan saja."
                : "Kosongkan untuk ambil kapan saja selama jendela penjualan."}
            </p>
          </fieldset>
        )}
      </div>
      {soldOut ? (
        <p className="text-sm font-semibold text-accent-strong">Porsi ini sudah habis terjual.</p>
      ) : (
        <Button type="submit" disabled={submitting} className="h-12 w-full text-base">
          {submitting ? "Memproses…" : `Pesan ${qty} porsi · ${formatIDR(discountPrice * qty)}`}
        </Button>
      )}
    </form>
  );
}

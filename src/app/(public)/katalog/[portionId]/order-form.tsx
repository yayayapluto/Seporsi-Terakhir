"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_QUANTITY_PER_ORDER } from "@/lib/domain/constants";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";

/** Jumlah 1–2 → POST /api/orders → /pesanan/[id]. Slot tak dipilih di UI. */
export function OrderForm({
  portionId,
  discountPrice,
  quantityRemaining,
  expiresAt,
}: {
  portionId: string;
  discountPrice: number;
  quantityRemaining: number;
  expiresAt: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const soldOut = quantityRemaining <= 0;
  const maxQty = Math.min(MAX_QUANTITY_PER_ORDER, quantityRemaining);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (qty < 1 || qty > maxQty) {
      setError(`Jumlah porsi harus 1–${maxQty}.`);
      return;
    }
    const body: Record<string, unknown> = { portionId, quantity: qty };
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
      <p className="text-sm text-muted-foreground">
        Ambil kapan saja sebelum {formatDateTimeWIB(new Date(expiresAt))} WIB.
      </p>
      {soldOut ? (
        <Button type="button" disabled className="min-h-11 w-full">
          Habis
        </Button>
      ) : (
        <Button type="submit" disabled={submitting} className="min-h-11 w-full">
          {submitting ? (
            <>
              <Spinner />
              Memesan…
            </>
          ) : (
            "Pesan"
          )}
        </Button>
      )}
    </form>
  );
}

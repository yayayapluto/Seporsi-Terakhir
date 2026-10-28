"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "../actions";

export function CancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm("Batalkan pesanan ini? Stok porsi akan dikembalikan.")) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-11 px-6 text-destructive"
        onClick={onClick}
        disabled={pending}
      >
        {pending ? "Membatalkan…" : "Batalkan pesanan"}
      </Button>
    </div>
  );
}

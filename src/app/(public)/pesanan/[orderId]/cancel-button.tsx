"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelOrder } from "../actions";

export function CancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  function onConfirm() {
    setError(null);
    setOpen(false);
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline" className="w-full px-6 text-destructive" />
          }
        >
          {pending ? (
            <>
              <Spinner />
              Membatalkan…
            </>
          ) : (
            "Batalkan pesanan"
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Batalkan pesanan?</DialogTitle>
          <DialogDescription>Stok porsi akan dikembalikan ke katalog.</DialogDescription>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? (
                <>
                  <Spinner />
                  Membatalkan…
                </>
              ) : (
                "Ya, batalkan"
              )}
            </Button>
            <Button
              type="button"
              autoFocus
              className="min-h-11 flex-1"
              onClick={() => setOpen(false)}
            >
              Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

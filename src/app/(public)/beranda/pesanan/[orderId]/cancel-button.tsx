"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialogFooter } from "@/components/shared/confirm-dialog-footer";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
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
          <ConfirmDialogFooter
            confirmLabel="Ya, batalkan"
            busyLabel="Membatalkan…"
            cancelLabel="Kembali"
            busy={pending}
            onConfirm={onConfirm}
            onCancel={() => setOpen(false)}
            lockCancelWhenBusy={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

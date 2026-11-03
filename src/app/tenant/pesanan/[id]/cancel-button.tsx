"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { ConfirmDialogFooter } from "@/components/shared/confirm-dialog-footer";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { tenantCancelOrder } from "./actions";

export function TenantCancelButton({
  orderId,
  menuName,
  quantity,
  buyerName,
}: {
  orderId: string;
  menuName: string;
  quantity: number;
  buyerName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  function onConfirm() {
    setError(null);
    setOpen(false);
    startTransition(async () => {
      const res = await tenantCancelOrder(orderId);
      if (!res.ok) setError(res.error);
      else {
        router.refresh();
        router.push("/tenant/pesanan");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline" className="min-h-12 w-full text-destructive" />
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
          <DialogTitle>
            Batalkan {menuName} × {quantity} milik {buyerName}?
          </DialogTitle>
          <DialogDescription>
            {buyerName} akan melihat status batal. Stok {quantity} porsi dikembalikan ke katalog.
          </DialogDescription>
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

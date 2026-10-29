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
            <Button type="button" variant="outline" className="min-h-11 px-6 text-destructive" />
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setOpen(false)}
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

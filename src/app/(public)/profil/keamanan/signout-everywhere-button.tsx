"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialogFooter } from "@/components/shared/confirm-dialog-footer";
import { SieraAlert } from "@/components/siera";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { signOutEverywhere } from "./actions";

/** Tombol bahaya keluar dari semua perangkat; konfirmasi lewat dialog. */
export function SignOutEverywhereButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await signOutEverywhere();
      if (!res.ok) setError(res.error);
      else {
        setOpen(false);
        router.push("/masuk");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      <Button
        type="button"
        variant="destructive"
        onClick={() => setOpen(true)}
        className="min-h-11 w-full"
      >
        Keluar dari semua perangkat
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Keluar dari semua perangkat?</DialogTitle>
          <DialogDescription>
            Termasuk perangkat yang sedang dipakai. Masuk ulang di tiap perangkat bila masih
            dibutuhkan.
          </DialogDescription>
          <ConfirmDialogFooter
            confirmLabel="Ya, keluarkan"
            busyLabel="Keluar…"
            cancelLabel="Batal"
            busy={pending}
            onConfirm={onConfirm}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

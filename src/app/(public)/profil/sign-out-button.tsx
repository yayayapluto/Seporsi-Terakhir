"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialogFooter } from "@/components/shared/confirm-dialog-footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

/** Danger Action Card — klik buka dialog konfirmasi, spinner hanya di tombol Keluar dialog. */
export function SignOutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      try {
        await fetch("/auth/sign-out", { method: "POST" });
        await createClient().auth.signOut();
      } finally {
        setOpen(false);
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-start gap-3 rounded-[20px] border border-line bg-card p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,.04)]"
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#BA1A1A]"
        >
          <LogOut className="size-5" />
        </span>
        <span className="flex-1 text-sm font-bold text-[#BA1A1A]">Keluar</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Keluar dari akun?</DialogTitle>
          <DialogDescription>
            Sesi di perangkat ini diakhiri. Pesanan aktif dan riwayatmu tetap tersimpan.
          </DialogDescription>
          <ConfirmDialogFooter
            confirmLabel="Keluar"
            busyLabel="Keluar…"
            cancelLabel="Batal"
            busy={pending}
            onConfirm={onConfirm}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

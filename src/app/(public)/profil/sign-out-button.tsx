"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialogFooter } from "@/components/shared/confirm-dialog-footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

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
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-[#F0CFCF] px-5 text-[15px] font-bold text-[#A61B1B] sm:w-fit sm:self-start hover:bg-[#FEF2F2] hover:text-[#A61B1B]"
      >
        <LogOut className="size-[18px]" strokeWidth={1.9} aria-hidden />
        Keluar
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

"use client";

import { LogOut } from "lucide-react";
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
} from "@/components/ui/dialog";
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center gap-3 rounded-[20px] border border-[#E8ECE9] bg-card p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-opacity active:opacity-70"
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#BA1A1A]"
        >
          <LogOut className="size-5" />
        </span>
        <span className="flex-1 text-sm font-bold text-[#BA1A1A]">Keluar</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Keluar dari akun?</DialogTitle>
          <DialogDescription>
            Sesi di perangkat ini diakhiri. Pesanan aktif dan riwayatmu tetap tersimpan.
          </DialogDescription>
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
                  Keluar…
                </>
              ) : (
                "Keluar"
              )}
            </Button>
            <Button
              type="button"
              autoFocus
              className="min-h-11 flex-1"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

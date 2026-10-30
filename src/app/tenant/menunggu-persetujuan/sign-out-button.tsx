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
} from "@/components/ui/dialog";
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
        className="min-h-11 text-destructive"
        onClick={() => setOpen(true)}
      >
        Keluar dari akun
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Keluar dari akun?</DialogTitle>
          <DialogDescription>
            Sesi di perangkat ini diakhiri. Kamu bisa masuk lagi kapan saja.
          </DialogDescription>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
              className="min-h-11"
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

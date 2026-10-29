"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11 text-destructive"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/auth/sign-out", { method: "POST" });
          await createClient().auth.signOut();
        } finally {
          router.push("/");
          router.refresh();
        }
      }}
    >
      {busy ? (
        <>
          <Spinner />
          Keluar…
        </>
      ) : (
        "Keluar dari akun"
      )}
    </Button>
  );
}

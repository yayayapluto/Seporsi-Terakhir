"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="text-destructive"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {busy ? (
        "Keluar…"
      ) : (
        <>
          <LogOut className="mr-2 size-4 shrink-0" aria-hidden />
          Keluar dari akun
        </>
      )}
    </Button>
  );
}

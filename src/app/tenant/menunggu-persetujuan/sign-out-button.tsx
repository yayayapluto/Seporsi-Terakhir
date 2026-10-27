"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="inline-flex h-11 items-center rounded-lg border px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
    >
      {busy ? "Keluar…" : "Keluar dari akun"}
    </button>
  );
}

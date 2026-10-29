"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { createClient } from "@/lib/supabase/client";

/** Danger Action Card — satu-satunya tempat aksi Keluar (Siera §5.3). */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
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
      className="flex min-h-11 w-full items-center gap-3 rounded-[20px] border border-[#E8ECE9] bg-card p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-opacity active:opacity-70 disabled:opacity-60"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#BA1A1A]"
      >
        <LogOut className="size-5" />
      </span>
      <span className="flex-1 text-sm font-bold text-[#BA1A1A]">
        {busy ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Keluar…
          </span>
        ) : (
          "Keluar"
        )}
      </span>
    </button>
  );
}

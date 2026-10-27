"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignIn({ next }: { next?: string }) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (busy) return;
    setFailed(false);
    setBusy(true);
    try {
      const supabase = createClient();
      const target = next ?? "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
        },
      });
      if (error) {
        setFailed(true);
        setBusy(false);
      }
      // Success → browser leaves for Google; keep busy state (no reset).
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        type="button"
        onClick={signIn}
        disabled={busy}
        whileTap={{ scale: 0.98 }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-[#256640] disabled:opacity-70"
      >
        {busy ? "Membuka Google…" : "Masuk dengan Google"}
      </motion.button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Gagal memulai login Google. Coba lagi.
        </p>
      )}
    </div>
  );
}

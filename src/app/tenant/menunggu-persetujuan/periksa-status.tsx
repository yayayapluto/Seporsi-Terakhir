"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** "Periksa status" = refresh ulang server component (bukan fake progress). */
export function PeriksaStatus() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  return (
    <button
      type="button"
      disabled={checking}
      onClick={() => {
        setChecking(true);
        router.refresh();
        setTimeout(() => setChecking(false), 600);
      }}
      className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
    >
      {checking ? "Memeriksa…" : "Periksa status"}
    </button>
  );
}

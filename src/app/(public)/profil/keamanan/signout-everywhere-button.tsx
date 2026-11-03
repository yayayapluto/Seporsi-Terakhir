"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { signOutEverywhere } from "./actions";

/** Tombol bahaya keluar dari semua perangkat (tetap di halaman). */
export function SignOutEverywhereButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm("Keluar dari semua perangkat termasuk yang ini?")) return;
    setError(null);
    startTransition(async () => {
      const res = await signOutEverywhere();
      if (!res.ok) setError(res.error);
      else {
        router.push("/masuk");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      <Button type="button" variant="destructive" onClick={onClick} disabled={pending} className="min-h-11 w-full">
        {pending ? (
          <>
            <Spinner />
            Keluar…
          </>
        ) : (
          "Keluar dari semua perangkat"
        )}
      </Button>
    </div>
  );
}

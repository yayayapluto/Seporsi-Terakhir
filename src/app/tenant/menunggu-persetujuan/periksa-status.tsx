"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";

/** "Periksa status" = refresh ulang server component (bukan fake progress). */
export function PeriksaStatus() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  return (
    <Button
      type="button"
      disabled={checking}
      onClick={() => {
        setChecking(true);
        router.refresh();
        setTimeout(() => setChecking(false), 600);
      }}
    >
      {checking ? (
        <>
          <Spinner />
          Memeriksa…
        </>
      ) : (
        "Periksa status"
      )}
    </Button>
  );
}

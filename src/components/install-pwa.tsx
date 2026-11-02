"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { SieraCard, SieraTile } from "@/components/siera";
import { Button } from "@/components/ui/button";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BIPEvent;
  }
}

/** Kartu "Pasang aplikasi": muncul hanya saat browser tawarkan install. */
export function InstallPwa() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: BIPEvent) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setDeferred(null);
  };

  return (
    <SieraCard className="flex items-center gap-3 p-4">
      <SieraTile>
        <Download size={20} aria-hidden />
      </SieraTile>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Pasang Seporsi Terakhir</p>
        <p className="truncate text-xs text-muted-foreground">
          Buka cepat dari layar utama, tetap bisa lihat info saat offline.
        </p>
      </div>
      <Button size="sm" onClick={install}>
        Pasang
      </Button>
    </SieraCard>
  );
}

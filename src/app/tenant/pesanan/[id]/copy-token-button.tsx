"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Tombol salin token pickup (clipboard butuh HTTPS; fallback: input readonly). */
export function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button type="button" variant="outline" size="sm" className="mt-2 min-h-11" onClick={onCopy}>
      {copied ? "Tersalin ✓" : "Salin kode"}
    </Button>
  );
}

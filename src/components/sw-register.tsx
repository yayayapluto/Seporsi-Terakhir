"use client";

import { useEffect } from "react";

/** Daftarkan /sw.js sekali per sesi (prod saja, bukan localhost). */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* offline-first opsional: tanpa SW aplikasi tetap jalan */
    });
  }, []);
  return null;
}

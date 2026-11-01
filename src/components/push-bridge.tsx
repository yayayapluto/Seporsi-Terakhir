"use client";

import { useEffect } from "react";
import { pushPrefKey } from "@/lib/push-prefs";
import { createClient } from "@/lib/supabase/client";

function textFor(event: string, status: unknown): { title: string; body: string } {
  if (event === "INSERT")
    return { title: "Pesanan baru", body: "Ada kabar pesanan terbaru. Buka untuk detail." };
  if (status === "picked_up")
    return { title: "Pesanan selesai", body: "Porsi sudah diambil. Selamat menikmati!" };
  if (status === "cancelled")
    return {
      title: "Pesanan dibatalkan",
      body: "Ada pesanan yang dibatalkan. Stok kembali ke katalog.",
    };
  return { title: "Kabar pesanan", body: "Status pesanan berubah. Buka untuk detail." };
}

/**
 * Jembatan realtime → notifikasi browser. Bunyi hanya bila toggle di
 * Pengaturan menyala dan izin diberikan. RLS Supabase menyaring baris
 * yang boleh dilihat pengguna ini.
 */
export function PushBridge({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const supabase = createClient();
    const channel = supabase
      .channel("push-bridge")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        try {
          if (localStorage.getItem(pushPrefKey(userId)) !== "1") return;
          if (Notification.permission !== "granted") return;
          const row = (payload.new ?? {}) as { id?: string; status?: string };
          const { title, body } = textFor(payload.eventType, row.status);
          const n = new Notification(`Seporsi Terakhir · ${title}`, {
            body,
            tag: `seporsi-order-${String(row.id ?? "x")}-${payload.eventType}`,
          });
          n.onclick = () => window.focus();
        } catch {
          /* abaikan */
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  return null;
}

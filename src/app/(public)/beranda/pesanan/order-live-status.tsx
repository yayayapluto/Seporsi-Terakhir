"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Live-update halaman buyer via Supabase Realtime: satu WebSocket channel
 * per halaman, dengar UPDATE orders milik sendiri. Refresh sekali saat
 * status keluar dari reserved. Nol request saat idle; tanpa polling.
 */
export function OrderLiveStatus({ orderIds }: { orderIds: string[] }) {
  const router = useRouter();
  const key = orderIds.slice().sort().join(",");

  useEffect(() => {
    if (!key) return;
    const supabase = createClient();
    const channel = supabase
      .channel("buyer-order-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=in.(${key})`,
        },
        (payload) => {
          const status = (payload.new as { status?: string } | undefined)?.status;
          if (status && status !== "reserved") router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, router]);

  return null;
}

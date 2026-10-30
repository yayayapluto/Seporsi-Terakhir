"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Refresh halaman notifikasi saat ada perubahan orders/tenants. Idle nol request. */
export function NotifLive({ tables }: { tables: ("orders" | "tenants")[] }) {
  const router = useRouter();
  const key = tables.slice().sort().join(",");
  useEffect(() => {
    if (!key) return;
    const supabase = createClient();
    const channel = supabase.channel("notif-live");
    for (const table of key.split(",") as ("orders" | "tenants")[]) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () =>
        router.refresh(),
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, key]);
  return null;
}

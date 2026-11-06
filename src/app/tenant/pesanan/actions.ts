"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Sapu pesanan lewat batas ambil 15 menit (idempoten, server-side).
 * Dipicu countdown tenant/pembeli saat menyentuh 00:00 → refresh status.
 * RPC hanya butuh auth.uid(); aman dipanggil role mana pun.
 */
export async function sweepLatePickups(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.rpc("sweep_late_pickups");
  if (error) return { ok: false };
  revalidatePath("/tenant");
  revalidatePath("/tenant/pesanan");
  return { ok: true };
}

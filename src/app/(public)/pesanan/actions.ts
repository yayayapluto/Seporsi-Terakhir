"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CancelSchema = z.object({ orderId: z.string().uuid() });

export async function cancelOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = CancelSchema.safeParse({ orderId });
  if (!parsed.success) return { ok: false, error: "Pesanan tidak valid." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu untuk membatalkan." };
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: parsed.data.orderId,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not found")) return { ok: false, error: "Pesanan tidak ditemukan." };
    if (msg.includes("not_reserved"))
      return { ok: false, error: "Hanya pesanan aktif yang bisa dibatalkan." };
    if (msg.includes("forbidden"))
      return { ok: false, error: "Kamu tidak punya akses ke pesanan ini." };
    return { ok: false, error: "Gagal membatalkan. Coba lagi." };
  }
  revalidatePath("/pesanan");
  return { ok: true };
}

/**
 * Token QR satu pesanan untuk modal di list. RLS orders_read membatasi ke
 * row milik sendiri; token tak pernah masuk payload list (QR-value only).
 */
export async function getPickupToken(
  orderId: string,
): Promise<{ ok: true; token: string } | { ok: false }> {
  const parsed = CancelSchema.safeParse({ orderId });
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data } = await supabase
    .from("orders")
    .select("pickup_token")
    .eq("id", parsed.data.orderId)
    .single();
  const token = data?.pickup_token as string | undefined;
  if (!token) return { ok: false };
  return { ok: true, token };
}

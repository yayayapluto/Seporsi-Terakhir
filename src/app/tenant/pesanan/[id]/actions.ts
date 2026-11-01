"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const IdSchema = z.object({ orderId: z.string().uuid() });

export async function tenantCancelOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = IdSchema.safeParse({ orderId });
  if (!parsed.success) return { ok: false, error: "Pesanan tidak valid." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai tenant." };
  const { error } = await supabase.rpc("tenant_cancel_order", {
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
  revalidatePath("/tenant/pesanan");
  return { ok: true };
}

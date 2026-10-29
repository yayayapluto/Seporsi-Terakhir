"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const TokenSchema = z.string().trim().uuid();

/** Decode hasil scan → preview order (tanpa mengonfirmasi). */
export async function lookupOrderByToken(token: string): Promise<
  | {
      ok: true;
      order: {
        menuName: string;
        quantity: number;
        status: string;
      };
    }
  | { ok: false; error: string }
> {
  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) return { ok: false, error: "QR tidak dikenali." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai tenant." };
  // Token opaque → server cari order; student identity disamarkan.
  const { data, error } = await supabase
    .from("orders")
    .select("status, quantity, portions!inner(tenant_id, menu_items!inner(name))")
    .eq("pickup_token", parsed.data)
    .maybeSingle();
  if (error) return { ok: false, error: "Gagal membaca QR. Coba lagi." };
  if (!data)
    return {
      ok: false,
      error: "QR tidak dikenali. Pastikan kode dari layar pesanan mahasiswa.",
    };
  const portion = data.portions as unknown as {
    tenant_id: string;
    menu_items: { name: string };
  } | null;
  if (!portion) return { ok: false, error: "QR tidak dikenali." };
  const { data: own } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!own) return { ok: false, error: "Profil tenant tidak ditemukan." };
  if (portion.tenant_id !== own.id)
    return { ok: false, error: "Pesanan ini bukan untuk tenant kamu." };
  const menu = Array.isArray(portion.menu_items) ? portion.menu_items[0] : portion.menu_items;
  return {
    ok: true,
    order: {
      menuName: menu?.name ?? "Menu",
      quantity: data.quantity,
      status: data.status,
    },
  };
}

/** Konfirmasi pickup setelah preview: rpc confirm_pickup. */
export async function confirmPickup(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) return { ok: false, error: "QR tidak dikenali." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai tenant." };
  const { error } = await supabase.rpc("confirm_pickup", {
    p_pickup_token: parsed.data,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not found")) return { ok: false, error: "QR tidak dikenali." };
    if (msg.includes("already")) return { ok: false, error: "QR ini sudah dipakai." };
    if (msg.includes("expired")) return { ok: false, error: "Porsi sudah kedaluwarsa." };
    if (msg.includes("cancelled")) return { ok: false, error: "Pesanan sudah dibatalkan." };
    return { ok: false, error: "Gagal konfirmasi pickup. Coba lagi." };
  }
  revalidatePath("/tenant");
  revalidatePath("/tenant/pesanan");
  return { ok: true };
}

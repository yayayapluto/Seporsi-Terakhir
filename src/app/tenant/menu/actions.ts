"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MenuSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1, "Nama menu wajib diisi."),
  normalPrice: z
    .number()
    .int("Harga harus bilangan bulat.")
    .positive("Harga normal harus lebih dari 0."),
  avgWeightGrams: z
    .number()
    .int("Berat harus bilangan bulat.")
    .positive("Berat harus lebih dari 0.")
    .nullable(),
  isActive: z.boolean(),
  ingredients: z.string().trim().max(500).optional(),
  allergenNote: z.string().trim().max(300).optional(),
});

/** Tenant create/update menu sendiri via RPC upsert_menu_item. */
export async function saveMenuItem(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = MenuSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data menu tidak valid." };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai tenant." };
  const { error } = await supabase.rpc("upsert_menu_item", {
    p_name: d.name,
    p_normal_price: d.normalPrice,
    p_id: d.id,
    p_avg_weight_grams: d.avgWeightGrams,
    p_is_active: d.isActive,
    p_ingredients: d.ingredients?.trim() ? d.ingredients.trim() : null,
    p_allergen_note: d.allergenNote?.trim() ? d.allergenNote.trim() : null,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("menu name already used"))
      return { ok: false, error: "Nama menu sudah dipakai." };
    if (msg.includes("invalid normal price"))
      return { ok: false, error: "Harga normal harus lebih dari 0." };
    if (msg.includes("invalid weight"))
      return { ok: false, error: "Berat rata-rata harus lebih dari 0." };
    if (msg.includes("forbidden"))
      return { ok: false, error: "Kamu tidak punya akses ke menu ini." };
    return { ok: false, error: "Gagal menyimpan menu. Coba lagi." };
  }
  revalidatePath("/tenant/menu");
  return { ok: true };
}

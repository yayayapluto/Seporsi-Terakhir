"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const PostSchema = z.object({
  menuItemId: z.string().uuid("Pilih menu dulu."),
  quantity: z.coerce
    .number({ message: "Jumlah wajib diisi." })
    .int("Jumlah harus bilangan bulat.")
    .positive("Jumlah harus lebih dari 0."),
  cookedAtLocal: z.string().min(1, "Jam masak wajib diisi."),
  sellWindowMinutes: z.coerce
    .number()
    .int()
    .min(120, "Jendela jual minimal 120 menit.")
    .max(240, "Jendela jual maksimal 240 menit."),
  releaseAtLocal: z.string().optional(),
  discountPrice: z.coerce
    .number({ message: "Harga diskon wajib diisi." })
    .int("Harga harus bilangan bulat.")
    .positive("Harga diskon harus lebih dari 0."),
});

const UpdateSchema = PostSchema.extend({ portionId: z.string().uuid() });

/** datetime-local (WIB, tanpa offset) → ISO UTC. Invalid → null. */
function toIso(local: string | undefined): string | null {
  if (!local) return null;
  const d = new Date(`${local}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type PortionFormInput = z.infer<typeof PostSchema> & { portionId?: string };

/** Tenant posting porsi baru via RPC post_portion. */
export async function postPortion(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = PostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data porsi tidak valid." };
  }
  const d = parsed.data;
  const cookedIso = toIso(d.cookedAtLocal);
  if (!cookedIso) return { ok: false, error: "Jam masak tidak valid." };
  const releaseIso = toIso(d.releaseAtLocal || d.cookedAtLocal);
  if (!releaseIso) return { ok: false, error: "Jam mulai jual tidak valid." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai tenant." };
  const { error } = await supabase.rpc("post_portion", {
    p_menu_item_id: d.menuItemId,
    p_quantity: d.quantity,
    p_cooked_at: cookedIso,
    p_discount_price: d.discountPrice,
    p_sell_window_minutes: d.sellWindowMinutes,
    p_release_at: releaseIso,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("menu not found")) return { ok: false, error: "Menu tidak ditemukan." };
    if (msg.includes("forbidden"))
      return { ok: false, error: "Kamu tidak punya akses ke menu ini." };
    if (msg.includes("invalid quantity"))
      return { ok: false, error: "Jumlah porsi harus lebih dari 0." };
    if (msg.includes("invalid sell window"))
      return { ok: false, error: "Jendela jual harus 120–240 menit." };
    if (msg.includes("discount must be below normal"))
      return { ok: false, error: "Harga diskon harus di bawah harga normal." };
    if (msg.includes("invalid discount price"))
      return { ok: false, error: "Harga diskon harus lebih dari 0." };
    if (msg.includes("tenant not approved"))
      return { ok: false, error: "Tenant belum disetujui admin." };
    return { ok: false, error: "Gagal memposting porsi. Coba lagi." };
  }
  revalidatePath("/tenant");
  revalidatePath("/katalog");
  return { ok: true };
}

/** Tenant edit porsi sendiri via RPC update_portion. */
export async function updatePortion(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data porsi tidak valid." };
  }
  const d = parsed.data;
  const cookedIso = toIso(d.cookedAtLocal);
  if (!cookedIso) return { ok: false, error: "Jam masak tidak valid." };
  const releaseIso = toIso(d.releaseAtLocal || d.cookedAtLocal);
  if (!releaseIso) return { ok: false, error: "Jam mulai jual tidak valid." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai tenant." };
  const { error } = await supabase.rpc("update_portion", {
    p_portion_id: d.portionId,
    p_menu_item_id: d.menuItemId,
    p_quantity: d.quantity,
    p_cooked_at: cookedIso,
    p_sell_window_minutes: d.sellWindowMinutes,
    p_release_at: releaseIso,
    p_discount_price: d.discountPrice,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("portion not found")) return { ok: false, error: "Porsi tidak ditemukan." };
    if (msg.includes("active reservations"))
      return {
        ok: false,
        error: "Ada reservasi aktif, quantity tidak bisa diubah sebelum reservasi selesai.",
      };
    if (msg.includes("discount must be below normal"))
      return { ok: false, error: "Harga diskon harus di bawah harga normal." };
    if (msg.includes("invalid discount price"))
      return { ok: false, error: "Harga diskon harus lebih dari 0." };
    if (msg.includes("invalid quantity"))
      return { ok: false, error: "Jumlah porsi harus lebih dari 0." };
    if (msg.includes("invalid sell window"))
      return { ok: false, error: "Jendela jual harus 120–240 menit." };
    if (msg.includes("forbidden"))
      return { ok: false, error: "Kamu tidak punya akses ke porsi ini." };
    return { ok: false, error: "Gagal menyimpan porsi. Coba lagi." };
  }
  revalidatePath("/tenant");
  revalidatePath("/katalog");
  return { ok: true };
}

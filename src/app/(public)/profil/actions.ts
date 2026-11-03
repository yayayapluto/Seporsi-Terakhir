"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SaveMyProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Nama wajib diisi.").max(80, "Nama maksimal 80 karakter."),
});

/** Simpan nama pengguna: auth metadata + tabel profiles. */
export async function saveMyProfile(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = SaveMyProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Nama tidak valid." };
  }
  const fullName = parsed.data.fullName.trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Masuk ulang lalu coba lagi." };
  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName } });
  if (authError) return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);
  if (profileError) return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  revalidatePath("/profil");
  return { ok: true };
}

const SaveMyAvatarSchema = z.object({
  avatarPath: z
    .string()
    .trim()
    .max(300, "Path avatar tidak valid.")
    .regex(/^[A-Za-z0-9/_.-]*$/, "Path avatar tidak valid.")
    .nullable()
    .optional(),
});

/** Simpan avatar via RPC set_my_avatar (null = pertahankan, "" = hapus). */
export async function saveMyAvatar(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = SaveMyAvatarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Avatar tidak valid." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_avatar", {
    p_avatar_path: parsed.data.avatarPath ?? null,
  });
  if (error) {
    if (error.message.includes("bad avatar path"))
      return { ok: false, error: "Path avatar tidak valid." };
    return { ok: false, error: "Gagal menyimpan avatar. Coba lagi." };
  }
  revalidatePath("/profil");
  return { ok: true };
}

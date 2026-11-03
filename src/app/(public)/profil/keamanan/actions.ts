"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const PasswordSchema = z
  .object({
    password: z.string().min(8, "Sandi minimal 8 karakter."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Konfirmasi sandi tidak sama.",
    path: ["confirm"],
  });

/** Ubah sandi akun email. Google-login tak punya sandi — error jelas. */
export async function requestPasswordChange(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = PasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Sandi tidak valid." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Masuk ulang lalu coba lagi." };
  const provider = user.app_metadata?.provider ?? "email";
  if (provider !== "email")
    return {
      ok: false,
      error: "Akun login Google tidak punya sandi. Ganti sandi di akun Googlemu.",
    };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "Gagal ubah sandi. Coba lagi." };
  revalidatePath(ROUTES.profilKeamanan);
  return { ok: true };
}

/** Keluar dari semua perangkat (revoke semua sesi). */
export async function signOutEverywhere(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) return { ok: false, error: "Gagal keluar. Coba lagi." };
  return { ok: true };
}

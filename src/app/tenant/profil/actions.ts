"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeTenantProfile, TenantProfileSchema } from "@/lib/tenant-profile";

/** Tenant simpan nama gerai + lokasi via RPC update_tenant_profile. */
export async function saveTenantProfile(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = TenantProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = normalizeTenantProfile(parsed.data);
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_tenant_profile", {
    p_name: d.name,
    p_location_note: d.locationNote,
  });
  if (error) {
    if (error.message.includes("name required"))
      return { ok: false, error: "Nama gerai wajib diisi." };
    if (error.message.includes("tenant not found"))
      return { ok: false, error: "Data kantin tidak ketemu." };
    return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  }
  revalidatePath("/tenant");
  return { ok: true };
}

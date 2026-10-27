"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildTenantCsv } from "./csv";

const IdSchema = z.object({ tenantId: z.string().uuid() });

/** Admin setujui pendaftaran tenant: flip is_approved + promosikan owner role. */
export async function approveTenant(
  tenantId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = IdSchema.safeParse({ tenantId });
  if (!parsed.success) return { ok: false, error: "Data tenant tidak valid." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai admin." };
  const { error } = await supabase.rpc("approve_tenant", {
    p_tenant_id: parsed.data.tenantId,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("admin only")) return { ok: false, error: "Khusus admin." };
    if (msg.includes("not found")) return { ok: false, error: "Tenant tidak ditemukan." };
    return { ok: false, error: "Gagal menyetujui tenant. Coba lagi." };
  }
  revalidatePath("/admin/tenant");
  revalidatePath("/admin");
  return { ok: true };
}

export interface ExportRow {
  tenantName: string;
  portionsPosted: number;
  portionsPickedUp: number;
  revenue: number;
  moneySaved: number;
  wasteGrams: number;
}

/** Export CSV laporan per-tenant — kembali sebagai file, bukan teks. */
export async function exportCsv(
  from: string,
  to: string,
): Promise<
  | {
      ok: true;
      filename: string;
      csv: string;
    }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Masuk dulu sebagai admin." };
  // role check server-side (RLS: admin_report re-checks anyway)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { ok: false, error: "Khusus admin." };

  // WIB day boundaries, sama dengan halaman /admin. Format YYYY-MM-DD tervalidasi —
  // input sampah bikin Invalid Date → .toISOString() lempar 500.
  const iso = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  const fromOk = from && iso.test(from) ? from : null;
  const toOk = to && iso.test(to) ? to : null;
  if ((from && !fromOk) || (to && !toOk))
    return { ok: false, error: "Rentang tanggal tidak valid." };
  const fromUtc = fromOk ? new Date(`${fromOk}T00:00:00+07:00`).toISOString() : null;
  const toExclusive = toOk
    ? new Date(new Date(`${toOk}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : null;
  const { data, error } = await supabase.rpc("admin_report", {
    p_from: fromUtc,
    p_to: toExclusive,
  });
  if (error || !data) return { ok: false, error: "Gagal mengambil laporan. Coba lagi." };

  const rows = (data as Array<Record<string, unknown>>).map((r) => ({
    tenantName: String(r.tenant_name ?? ""),
    portionsPosted: Number(r.portions_posted ?? 0),
    portionsPickedUp: Number(r.portions_picked_up ?? 0),
    revenue: Number(r.revenue ?? 0),
    moneySaved: Number(r.money_saved ?? 0),
    wasteGrams: Number(r.waste_grams ?? 0),
  }));
  return {
    ok: true,
    filename: `porsi-terakhir-laporan-${from || "awal"}-${to || "sekarang"}.csv`,
    csv: buildTenantCsv(rows),
  };
}

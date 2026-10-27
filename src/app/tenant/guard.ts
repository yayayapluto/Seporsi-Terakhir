import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getOwnTenant, type OwnTenant } from "@/lib/tenant";

/**
 * Guard bersama semua halaman /tenant/* kecuali pendaftaran & menunggu:
 * role tenant/admin, lalu tenant harus ada dan approved.
 */
export async function requireOwnTenant(next: string): Promise<OwnTenant> {
  await requireRole(next, "tenant", "admin");
  const tenant = await getOwnTenant();
  if (!tenant) redirect("/tenant/pendaftaran");
  if (!tenant.is_approved) redirect("/tenant/menunggu-persetujuan");
  return tenant;
}

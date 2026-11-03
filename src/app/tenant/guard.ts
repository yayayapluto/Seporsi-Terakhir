import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getOwnTenant, type OwnTenant } from "@/lib/tenant";

/**
 * Guard bersama semua halaman /tenant/* kecuali pendaftaran & menunggu:
 * role tenant/admin, lalu tenant harus ada dan approved.
 */
export async function requireOwnTenant(next: string): Promise<OwnTenant> {
  await requireRole(next, "tenant", "admin");
  const tenant = await getOwnTenant();
  if (!tenant) redirect(ROUTES.tenantPendaftaran);
  if (!tenant.is_approved) redirect(ROUTES.tenantMenunggu);
  return tenant;
}

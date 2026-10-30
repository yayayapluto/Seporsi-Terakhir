import { redirect } from "next/navigation";
import { SieraTenantHeader } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { getOwnTenant } from "@/lib/tenant";
import { PendaftaranForm } from "./pendaftaran-form";

/**
 * Pendaftaran tenant: terbuka untuk semua user login (applicant baru
 * masih role student; role baru jadi tenant setelah admin approve).
 * Sudah mendaftar → redirect sesuai status.
 */
export default async function PendaftaranPage() {
  await requireRole("/tenant/pendaftaran", "student", "tenant", "admin");
  const tenant = await getOwnTenant();
  if (tenant) redirect(tenant.is_approved ? "/tenant" : "/tenant/menunggu-persetujuan");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <SieraTenantHeader kicker="MITRA KANTIN" title="Daftar jadi tenant">
        Jual sisa masakanmu lewat Seporsi Terakhir — gratis selama pilot kampus. Admin meninjau
        pendaftaranmu sebelum porsi bisa diposting.
      </SieraTenantHeader>
      <PendaftaranForm />
    </div>
  );
}

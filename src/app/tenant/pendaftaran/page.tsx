import { BadgeCheck, ClipboardCheck, Hourglass } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  SieraTenantHeader,
} from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getOwnTenant } from "@/lib/tenant";
import { PendaftaranForm } from "./pendaftaran-form";

export const metadata: Metadata = { title: "Pendaftaran Tenant" };

/**
 * Pendaftaran tenant: terbuka untuk semua user login (applicant baru
 * masih role student; role baru jadi tenant setelah admin approve).
 * Sudah mendaftar → redirect sesuai status.
 */
export default async function PendaftaranPage() {
  await requireRole(ROUTES.tenantPendaftaran, "student", "tenant", "admin");
  const tenant = await getOwnTenant();
  if (tenant) redirect(tenant.is_approved ? ROUTES.tenant : ROUTES.tenantMenunggu);
  const steps = [
    {
      icon: ClipboardCheck,
      title: "1. Isi form",
      subtitle: "Nama gerai + lokasi, sekali kirim",
    },
    {
      icon: Hourglass,
      title: "2. Admin meninjau",
      subtitle: "Biasanya ≤1×24 jam",
    },
    {
      icon: BadgeCheck,
      title: "3. Disetujui → posting",
      subtitle: "Dasbor + menu langsung terbuka",
    },
  ];
  return (
    <SieraRailPage
      asideLabel="Alur verifikasi"
      main={
        <>
          <SieraTenantHeader kicker="MITRA KANTIN" title="Daftar jadi tenant">
            Jual sisa masakanmu lewat Seporsi Terakhir, gratis selama pilot kampus. Admin meninjau
            pendaftaranmu sebelum porsi bisa diposting.
          </SieraTenantHeader>
          <PendaftaranForm />
        </>
      }
      aside={
        <SieraSection id="alur-heading" label="Alur verifikasi">
          <SieraList>
            {steps.map((s) => (
              <SieraRowLink
                key={s.title}
                href={ROUTES.tenantPendaftaran}
                icon={s.icon}
                title={s.title}
                subtitle={s.subtitle}
              />
            ))}
          </SieraList>
        </SieraSection>
      }
    />
  );
}

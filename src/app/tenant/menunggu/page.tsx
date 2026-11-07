import { BadgeCheck, ClipboardCheck, Hourglass } from "lucide-react";
import { redirect } from "next/navigation";
import {
  SieraCard,
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  SieraTenantHeader,
  sieraCardClass,
} from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getOwnTenant } from "@/lib/tenant";
import { PeriksaStatus } from "./periksa-status";
import { SignOutButton } from "./sign-out-button";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Menunggu Verifikasi" };

/** Status pendaftaran tenant yang belum disetujui. Approved → dashboard. */
export default async function MenungguPersetujuanPage() {
  await requireRole(ROUTES.tenantMenunggu, "student", "tenant", "admin");
  const tenant = await getOwnTenant();
  if (!tenant) redirect(ROUTES.tenantPendaftaran);
  if (tenant.is_approved) redirect(ROUTES.tenant);

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("created_at").eq("id", tenant.id).single();
  const registeredAt = (data?.created_at as string | undefined) ?? null;

  const steps = [
    {
      icon: ClipboardCheck,
      title: "1. Pendaftaran diterima",
      subtitle: registeredAt
        ? formatDateTimeWIB(new Date(registeredAt))
        : (tenant.name ?? "Terkirim"),
    },
    {
      icon: Hourglass,
      title: "2. Menunggu admin",
      subtitle: "Sedang ditinjau",
    },
    {
      icon: BadgeCheck,
      title: "3. Disetujui → dasbor",
      subtitle: "Lalu posting porsi pertama",
    },
  ];

  return (
    <SieraRailPage
      asideLabel="Alur verifikasi"
      main={
        <>
          <SieraTenantHeader kicker="MITRA KANTIN" title="Menunggu persetujuan">
            Pendaftaranmu sedang ditinjau admin.
          </SieraTenantHeader>

          <section aria-labelledby="status-heading" className={`${sieraCardClass} p-5`}>
            <h2 id="status-heading" className="text-lg font-bold">
              Pendaftaran diterima
            </h2>
            <dl className="mt-3 flex flex-col divide-y divide-dashed divide-line">
              <div className="flex gap-3 py-2">
                <dt className="w-36 shrink-0 text-sm text-muted-foreground">Nama tenant</dt>
                <dd className="min-w-0 text-sm font-medium">{tenant.name}</dd>
              </div>
              {tenant.location_note && (
                <div className="flex gap-3 py-2">
                  <dt className="w-36 shrink-0 text-sm text-muted-foreground">Lokasi</dt>
                  <dd className="min-w-0 text-sm font-medium">{tenant.location_note}</dd>
                </div>
              )}
              {registeredAt && (
                <div className="flex gap-3 py-2">
                  <dt className="w-36 shrink-0 text-sm text-muted-foreground">Didaftarkan</dt>
                  <dd className="min-w-0 text-sm font-medium">
                    {formatDateTimeWIB(new Date(registeredAt))} WIB
                  </dd>
                </div>
              )}
              <div className="flex gap-3 py-2">
                <dt className="w-36 shrink-0 text-sm text-muted-foreground">Status</dt>
                <dd className="min-w-0">
                  <span className="inline-flex items-center rounded-full border border-secondary bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    Menunggu persetujuan admin
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <SieraCard className="p-4">
            <p className="text-sm text-[#64746B]">
              Admin akan meninjau pendaftaranmu. Setelah disetujui, dashboard tenant terbuka dan
              kamu bisa mengunggah porsi pertama.
            </p>
          </SieraCard>

          <div className="flex flex-wrap items-center gap-3 border-t pt-6">
            <PeriksaStatus />
            <SignOutButton />
          </div>
        </>
      }
      aside={
        <SieraSection id="alur-heading" label="Alur verifikasi">
          <SieraList>
            {steps.map((s) => (
              <SieraRowLink
                key={s.title}
                href={ROUTES.tenantMenunggu}
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

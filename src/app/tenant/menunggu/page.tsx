import { redirect } from "next/navigation";
import { SieraTenantHeader, sieraCardClass } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getOwnTenant } from "@/lib/tenant";
import { PeriksaStatus } from "./periksa-status";
import { SignOutButton } from "./sign-out-button";

/** Status pendaftaran tenant yang belum disetujui. Approved → dashboard. */
export default async function MenungguPersetujuanPage() {
  await requireRole(ROUTES.tenantMenunggu, "student", "tenant", "admin");
  const tenant = await getOwnTenant();
  if (!tenant) redirect(ROUTES.tenantPendaftaran);
  if (tenant.is_approved) redirect(ROUTES.tenant);

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("created_at").eq("id", tenant.id).single();
  const registeredAt = (data?.created_at as string | undefined) ?? null;

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <SieraTenantHeader kicker="MITRA KANTIN" title="Menunggu persetujuan">
        Pendaftaranmu sedang ditinjau admin.
      </SieraTenantHeader>

      <section aria-labelledby="status-heading" className={`${sieraCardClass} p-5`}>
        <h2 id="status-heading" className="text-lg font-bold">
          Pendaftaran diterima
        </h2>
        <dl className="mt-3 flex flex-col divide-y divide-border">
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

      <p className="text-sm text-muted-foreground">
        Admin akan meninjau pendaftaranmu. Setelah disetujui, dashboard tenant terbuka dan kamu bisa
        mengunggah porsi pertama.
      </p>

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <PeriksaStatus />
        <SignOutButton />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getOwnTenant } from "@/lib/tenant";
import { PeriksaStatus } from "./periksa-status";
import { SignOutButton } from "./sign-out-button";

/** Status pendaftaran tenant yang belum disetujui. Approved → dashboard. */
export default async function MenungguPersetujuanPage() {
  await requireRole("/tenant/menunggu-persetujuan", "tenant", "admin");
  const tenant = await getOwnTenant();
  if (!tenant) redirect("/tenant/pendaftaran");
  if (tenant.is_approved) redirect("/tenant");

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("created_at").eq("id", tenant.id).single();
  const registeredAt = (data?.created_at as string | undefined) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">MITRA KANTIN</p>
        <h1 className="text-3xl font-bold">Menunggu persetujuan</h1>
      </div>

      <section aria-labelledby="status-heading" className="rounded-xl border bg-card p-5">
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
              <span className="inline-flex items-center rounded-full border border-[#FAD8B3] bg-[#FEF3E7] px-2.5 py-0.5 text-xs font-semibold text-[#DE7819]">
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

import { AppHeader } from "@/components/app-header";
import { ROUTES } from "@/lib/routes";
import { SieraCard, SieraTenantHeader } from "@/components/siera";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../guard";
import { TenantProfileForm } from "./profile-form";

/** Profil kantin: nama gerai + lokasi, bisa diubah tenant sendiri. */
export default async function TenantProfilPage() {
  const tenant = await requireOwnTenant("/tenant/profil");
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("name, location_note")
    .eq("id", tenant.id)
    .single();
  return (
    <>
      <AppHeader
        title="Profil Kantin"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Profil Kantin" }]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <SieraTenantHeader kicker="PROFIL KANTIN" title="Gerai kamu">
        Nama dan lokasi ini tampil ke mahasiswa di katalog dan pesanan.
      </SieraTenantHeader>
      <SieraCard className="p-4">
        <TenantProfileForm
          initialName={(data?.name as string | undefined) ?? tenant.name}
          initialLocation={(data?.location_note as string | undefined) ?? ""}
        />
      </SieraCard>
      </div>
    </>
  );
}

import { Store } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import {
  SieraCard,
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  SieraTenantHeader,
} from "@/components/siera";
import { ROUTES } from "@/lib/routes";
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
  const name = (data?.name as string | undefined) ?? tenant.name;
  const location = (data?.location_note as string | undefined) ?? "";
  return (
    <>
      <AppHeader
        title="Profil Kantin"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Profil Kantin" }]}
      />
      <SieraRailPage
        asideLabel="Pratinjau gerai"
        main={
          <>
            <SieraTenantHeader kicker="PROFIL KANTIN" title="Gerai kamu">
              Nama dan lokasi ini tampil ke mahasiswa di katalog dan pesanan.
            </SieraTenantHeader>
            <SieraCard className="p-4">
              <TenantProfileForm initialName={name} initialLocation={location} />
            </SieraCard>
          </>
        }
        aside={
          <SieraSection id="pratinjau-heading" label="Tampil di katalog">
            <SieraList>
              <SieraRowLink
                href={ROUTES.tenantPorsiTambah}
                icon={Store}
                title={name}
                subtitle={
                  location
                    ? `${location} · posting porsi biar tampil`
                    : "Isi lokasi biar mudah ditemu"
                }
              />
            </SieraList>
          </SieraSection>
        }
      />
    </>
  );
}

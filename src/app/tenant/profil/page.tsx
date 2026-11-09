import { Store } from "lucide-react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { ImageUploader } from "@/components/image-uploader";
import { SieraList, SieraRowLink, SieraSection, sieraCardClass } from "@/components/siera";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../guard";
import { TenantProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profil Tenant" };

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
    <div className="mx-auto flex w-full min-w-0 max-w-[1160px] flex-col gap-6 px-4 pt-6 pb-8 md:px-6 max-md:px-0 max-md:mx-0 max-md:pt-4 max-md:pb-0 max-md:max-w-full">
      <AppHeader
        title="Profil Kantin"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Profil Kantin" }]}
      />
      <section aria-label="Identitas gerai" className={`${sieraCardClass} p-6`}>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-bold text-[#2E7D4F]">PROFIL KANTIN</p>
          <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl leading-[1.2] font-extrabold tracking-[-0.02em] text-[#1C2826]">
            {name}
          </h1>
          <div className="mt-2">
            <ImageUploader
              kind="tenant_logo"
              targetId={tenant.id}
              currentPath={tenant.logo_path}
              shape="circle"
            />
          </div>
          <p className="text-[15px] leading-normal text-[#64746B]">
            Nama dan lokasi ini tampil ke mahasiswa di katalog dan pesanan.
          </p>
        </div>
        <div className="mt-4">
          <TenantProfileForm initialName={name} initialLocation={location} />
        </div>
      </section>
      <SieraSection id="pratinjau-heading" label="Tampil di katalog">
        <SieraList>
          <SieraRowLink
            href={ROUTES.tenantPorsiTambah}
            icon={Store}
            title={name}
            subtitle={
              location
                ? `${location} · posting porsi biar tampil`
                : "Isi lokasi biar mudah ditemukan mahasiswa"
            }
          />
        </SieraList>
      </SieraSection>
    </div>
  );
}

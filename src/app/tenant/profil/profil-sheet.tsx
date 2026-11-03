import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../guard";
import { TenantProfileForm } from "./profile-form";

/** Isi sheet edit profil kantin: data sama persis profil/page.tsx. */
export async function ProfilSheet() {
  const tenant = await requireOwnTenant("/tenant/profil");
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("name, location_note")
    .eq("id", tenant.id)
    .single();
  return (
    <TenantProfileForm
      initialName={(data?.name as string | undefined) ?? tenant.name}
      initialLocation={(data?.location_note as string | undefined) ?? ""}
    />
  );
}

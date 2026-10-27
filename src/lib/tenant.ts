import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

export interface OwnTenant {
  id: string;
  name: string;
  location_note: string | null;
  is_approved: boolean;
}

/** Tenant row owned by the signed-in user, or null when none. */
export async function getOwnTenant(): Promise<OwnTenant | null> {
  const current = await getCurrentUser();
  if (!current) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, name, location_note, is_approved")
    .eq("owner_id", current.user.id)
    .maybeSingle();
  return (data as OwnTenant | null) ?? null;
}

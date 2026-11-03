import { AppHeader } from "@/components/app-header";
import { SieraCard } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { MyProfileForm } from "../../profile-form";

/** Ubah nama + foto profil pengguna. */
export default async function ProfilEditPage() {
  const current = await requireRole(ROUTES.profilPengaturan, "student", "tenant", "admin");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", current.user.id)
    .single();
  const fullName =
    (profile?.full_name as string | null) ??
    (profile?.email as string | null)?.split("@")[0] ??
    "Pengguna";
  const avatarPath = (profile?.avatar_url as string | null) ?? null;
  return (
    <>
      <AppHeader
        title="Profil"
        trail={[
          { label: "Profil", href: ROUTES.profil },
          { label: "Pengaturan", href: ROUTES.profilPengaturan },
          { label: "Profil" },
        ]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
        <SieraCard className="p-3">
          <MyProfileForm
            initialName={fullName}
            initialAvatarPath={avatarPath}
            userId={current.user.id}
          />
        </SieraCard>
      </div>
    </>
  );
}

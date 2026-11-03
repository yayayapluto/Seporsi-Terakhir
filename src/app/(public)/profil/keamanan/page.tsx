import { AtSign, CalendarCheck, KeyRound } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SieraCard, SieraField } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { SignOutEverywhereButton } from "./signout-everywhere-button";
import { UbahSandiButton } from "./ubah-sandi-button";

/** Keamanan: info sesi + ubah sandi + keluar semua perangkat. */
export default async function KeamananPage() {
  const current = await requireRole(ROUTES.profilKeamanan, "student", "tenant", "admin");
  const provider = current.user.app_metadata?.provider ?? "email";
  const method = provider === "google" ? "Login Google" : `Login ${provider}`;
  return (
    <>
      <AppHeader
        title="Keamanan"
        trail={[
          { label: "Profil", href: ROUTES.profil },
          { label: "Pengaturan", href: ROUTES.profilPengaturan },
          { label: "Keamanan" },
        ]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4 px-4 py-6 md:px-8">
        <SieraCard className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_1.2fr]">
          <dl className="divide-y divide-dashed divide-line">
            <SieraField icon={AtSign} label="Email">
              {current.user.email ?? "—"}
            </SieraField>
            <SieraField icon={KeyRound} label="Metode login">
              {method}
            </SieraField>
            <SieraField icon={CalendarCheck} label="Akun aktif sejak">
              {formatDateTimeWIB(new Date(current.user.created_at ?? Date.now()))}
            </SieraField>
          </dl>
          <div className="flex flex-col gap-2 lg:border-l lg:border-dashed lg:border-line lg:pl-4">
            <UbahSandiButton />
            <SignOutEverywhereButton />
          </div>
        </SieraCard>
        <p className="text-[11px] leading-relaxed text-[#64746B]">
          Ada perangkat asing? Ubah sandi lalu keluar dari semua perangkat. Butuh bantuan? Tulis ke
          admin lewat halaman Bantuan.
        </p>
      </div>
    </>
  );
}

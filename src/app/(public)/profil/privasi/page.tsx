import { AppHeader } from "@/components/app-header";
import { SieraCard, SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { ExportButton } from "./export-button";

/** Privasi & data: unduh data sendiri + info hapus via admin. */
export default async function PrivasiPage() {
  const current = await requireRole(ROUTES.profilPrivasi, "student", "tenant", "admin");
  return (
    <>
      <AppHeader
        title="Privasi & Data"
        trail={[
          { label: "Profil", href: ROUTES.profil },
          { label: "Pengaturan", href: ROUTES.profilPengaturan },
          { label: "Privasi & Data" },
        ]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8 max-md:px-0 max-md:mx-0 max-md:pb-0">
        <SieraHero eyebrow="Privasi & data" title="Data kamu milik kamu">
          Unduh seluruh data akunmu kapan saja. Isinya: profil, pesanan, dan data kantin bila kamu
          tenant.
        </SieraHero>
        <SieraCard className="p-4">
          <ExportButton role={current.role} />
        </SieraCard>
        <p className="text-[12px] leading-relaxed text-[#64746B]">
          Mau hapus akun beserta datanya? Tulis ke admin lewat halaman Bantuan. Penghapusan bersifat
          permanen dan tidak bisa dibatalkan.
        </p>
      </div>
    </>
  );
}

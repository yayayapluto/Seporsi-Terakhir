import { AppHeader } from "@/components/app-header";
import { SieraCard, SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { BantuanForm } from "./bantuan-form";
import { LaporButton } from "./lapor-button";

/** Bantuan & lapor: FAQ + formulir lapor via email admin. Semua role. */
export default async function BantuanPage() {
  const current = await requireRole(ROUTES.profilBantuan, "student", "tenant", "admin");
  return (
    <>
      <AppHeader
        title="Bantuan & Lapor"
        trail={[
          { label: "Profil", href: ROUTES.profil },
          { label: "Pengaturan", href: ROUTES.profilPengaturan },
          { label: "Bantuan & Lapor" },
        ]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4 max-md:px-5 max-md:pb-[calc(112px+env(safe-area-inset-bottom))] px-4 py-6 md:px-8">
        <SieraHero eyebrow="Bantuan" title="Ada yang bisa dibantu?">
          Jawaban cepat di bawah, atau kirim laporan langsung ke admin.
        </SieraHero>
        <SieraCard className="p-4">
          <BantuanForm userEmail={current.user.email ?? null} faqOnly />
          <div className="mt-3">
            <LaporButton userEmail={current.user.email ?? null} />
          </div>
        </SieraCard>
      </div>
    </>
  );
}

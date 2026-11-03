import { AppHeader } from "@/components/app-header";
import { SieraCard, SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { BantuanForm } from "./bantuan-form";

/** Bantuan & lapor: FAQ + formulir lapor via email admin. Semua role. */
export default async function BantuanPage() {
  const current = await requireRole(ROUTES.akunBantuan, "student", "tenant", "admin");
  return (
    <>
      <AppHeader
        title="Bantuan & Lapor"
        trail={[{ label: "Pengaturan", href: ROUTES.akunPengaturan }, { label: "Bantuan & Lapor" }]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8">
        <SieraHero eyebrow="Bantuan" title="Ada yang bisa dibantu?">
          Jawaban cepat di bawah, atau kirim laporan langsung ke admin.
        </SieraHero>
        <SieraCard className="p-4">
          <BantuanForm userEmail={current.user.email ?? null} />
        </SieraCard>
      </div>
    </>
  );
}

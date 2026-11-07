import type { Metadata } from "next";
import { SieraCard, SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ExportButton } from "./export-button";

export const metadata: Metadata = { title: "Privasi & Data" };

/** Privasi & data: unduh data sendiri + info hapus via admin. */
export default async function PrivasiPage() {
  const current = await requireRole("/akun/privasi", "student", "tenant", "admin");
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-6 px-4 py-6 sm:max-w-none md:max-w-3xl">
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
  );
}

import { AppHeader } from "@/components/app-header";
import { SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { PushToggle } from "./push-toggle";

/** Notifikasi: toggle push browser + status izin + contoh. */
export default async function NotifikasiSettingPage() {
  const current = await requireRole(ROUTES.profilNotifikasi, "student", "tenant", "admin");
  return (
    <>
      <AppHeader
        title="Notifikasi"
        trail={[
          { label: "Profil", href: ROUTES.profil },
          { label: "Pengaturan", href: ROUTES.profilPengaturan },
          { label: "Notifikasi" },
        ]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8 max-md:px-0 max-md:mx-0 max-md:pb-0">
        <SieraHero eyebrow="Notifikasi" title="Kabar sampai bunyi">
          Nyalakan agar kabar pesanan muncul sebagai notifikasi browser di perangkat ini.
        </SieraHero>
        <PushToggle userId={current.user.id} />
        <p className="text-[12px] leading-relaxed text-[#64746B]">
          Bunyi bekerja saat aplikasi terbuka. Kalau tab ditutup, semua kabar tetap tercatat di
          halaman Notifikasi.
        </p>
      </div>
    </>
  );
}

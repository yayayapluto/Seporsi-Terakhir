import type { Metadata } from "next";
import { SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { PushToggle } from "./push-toggle";

export const metadata: Metadata = { title: "Notifikasi" };

/** Notifikasi: toggle push browser + status izin + contoh. */
export default async function NotifikasiSettingPage() {
  const current = await requireRole("/akun/notifikasi", "student", "tenant", "admin");
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-6 px-4 py-6 sm:max-w-none md:max-w-3xl">
      <SieraHero eyebrow="Notifikasi" title="Kabar sampai bunyi">
        Nyalakan agar kabar pesanan muncul sebagai notifikasi browser di perangkat ini.
      </SieraHero>
      <PushToggle userId={current.user.id} />
      <p className="text-[12px] leading-relaxed text-[#64746B]">
        Bunyi bekerja saat aplikasi terbuka. Kalau tab ditutup, semua kabar tetap tercatat di
        halaman Notifikasi.
      </p>
    </div>
  );
}

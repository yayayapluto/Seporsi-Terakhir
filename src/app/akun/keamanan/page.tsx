import { AtSign, CalendarCheck, KeyRound } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SieraCard, SieraField, SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { SecurityForm } from "./security-form";

/** Keamanan: info sesi + ubah sandi + keluar semua perangkat. */
export default async function KeamananPage() {
  const current = await requireRole(ROUTES.akunKeamanan, "student", "tenant", "admin");
  const provider = current.user.app_metadata?.provider ?? "email";
  const method = provider === "google" ? "Login Google" : `Login ${provider}`;
  return (
    <>
      <AppHeader
        title="Keamanan"
        trail={[{ label: "Pengaturan", href: ROUTES.akunPengaturan }, { label: "Keamanan" }]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8">
        <SieraHero eyebrow="Keamanan" title="Sesi masuk kamu">
          Cara kamu masuk dan sejak kapan akun ini aktif.
        </SieraHero>
        <SieraCard className="p-4">
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
        </SieraCard>
        <SieraCard className="p-4">
          <SecurityForm />
        </SieraCard>
        <p className="text-[12px] leading-relaxed text-[#64746B]">
          Ada perangkat asing? Ubah sandi di atas lalu keluar dari semua perangkat. Butuh bantuan?
          Tulis ke admin lewat halaman Bantuan.
        </p>
      </div>
    </>
  );
}

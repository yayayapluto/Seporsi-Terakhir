import { AtSign, CalendarCheck, KeyRound } from "lucide-react";
import { SieraCard, SieraField, SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Keamanan" };

/** Keamanan: info sesi masuk saja — tanpa aksi. */
export default async function KeamananPage() {
  const current = await requireRole("/akun/keamanan", "student", "tenant", "admin");
  const provider = current.user.app_metadata?.provider ?? "email";
  const method = provider === "google" ? "Login Google" : `Login ${provider}`;
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-6 px-4 py-6 sm:max-w-none md:max-w-3xl">
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
      <p className="text-[12px] leading-relaxed text-[#64746B]">
        Ada perangkat asing? Keluar dari halaman ini tidak cukup. Ganti sandi email kamu, lalu masuk
        ulang. Butuh bantuan? Tulis ke admin lewat halaman Bantuan.
      </p>
    </div>
  );
}

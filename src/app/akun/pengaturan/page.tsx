import {
  Bell,
  ChevronRight,
  CircleHelp,
  Database,
  Globe,
  ReceiptText,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/app/(public)/profil/sign-out-button";
import { requireRole } from "@/lib/auth";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pengaturan Akun" };

const CARD =
  "rounded-[20px] border border-[#E8ECE9] bg-card p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]";
const ROW_TILE =
  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F2] text-primary";

interface Row {
  href: string;
  icon: typeof Bell;
  title: string;
  desc: string;
}

function Group({ heading, label, rows }: { heading: string; label: string; rows: Row[] }) {
  const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]">
        {heading}
      </h2>
      <nav aria-label={label} className={`${CARD} divide-y divide-dashed divide-[#E8ECE9] !p-0`}>
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href} className="flex min-h-11 items-center gap-3 p-4">
              <span aria-hidden className={ROW_TILE}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{r.title}</span>
                <span className="block text-[12px] text-[#64746B]">{r.desc}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

/** Pengaturan per role: standar lengkap + menu sesuai peran. Tanpa backend baru. */
export default async function PengaturanPage() {
  const current = await requireRole("/akun/pengaturan", "student", "tenant", "admin");

  const akun: Row[] = [
    { href: "/profil", icon: UserRound, title: "Profil", desc: "Nama dan info akun" },
    {
      href: "/masuk",
      icon: ShieldCheck,
      title: "Keamanan",
      desc: "Login Google, sesi aktif",
    },
    {
      href: "/notifikasi",
      icon: Bell,
      title: "Notifikasi",
      desc: "Kabar pesanan dan pendaftaran",
    },
    {
      href: "/akun/pengaturan",
      icon: Globe,
      title: "Bahasa",
      desc: "Indonesia, satu-satunya bahasa",
    },
    {
      href: "/profil",
      icon: Database,
      title: "Privasi & data",
      desc: "Minta ekspor atau hapus via admin",
    },
  ];

  const peran: Row[] =
    current.role === "tenant"
      ? [
          {
            href: "/tenant/menu",
            icon: Store,
            title: "Profil kantin",
            desc: "Nama gerai dan lokasi",
          },
          {
            href: "/tenant/pesanan",
            icon: ReceiptText,
            title: "Operasional",
            desc: "Pesanan dan jam posting",
          },
        ]
      : current.role === "admin"
        ? [
            {
              href: "/admin/tenant",
              icon: Store,
              title: "Persetujuan tenant",
              desc: "Daftar menunggu verifikasi",
            },
            {
              href: "/admin",
              icon: ReceiptText,
              title: "Kebijakan jendela jual",
              desc: "120–240 menit pasca-masak",
            },
          ]
        : [
            {
              href: "/cara-kerja",
              icon: CircleHelp,
              title: "Bantuan & lapor",
              desc: "Cara kerja dan keamanan pangan",
            },
          ];

  return (
    <div className="mx-auto grid w-full max-w-[430px] flex-1 grid-cols-1 content-start gap-6 px-4 py-6 md:max-w-3xl md:grid-cols-2 md:px-6">
      <div className="flex flex-col gap-1 md:col-span-2">
        <h1 className="text-[18px] leading-[1.3] font-extrabold">Pengaturan</h1>
        <p className="text-[13px] text-[#64746B]">Kelola akun dan preferensi kamu.</p>
      </div>

      <Group heading="Akun & preferensi" label="Akun dan preferensi" rows={akun} />
      <Group heading="Khusus peran kamu" label="Menu khusus peran" rows={peran} />

      <div className="md:col-span-2">
        <SignOutButton />
      </div>

      <p className="pb-4 text-center text-[11px] font-semibold text-[#64746B] md:col-span-2">
        Seporsi Terakhir v0.1.0
      </p>
    </div>
  );
}

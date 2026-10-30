import {
  Bell,
  CircleHelp,
  Database,
  ReceiptText,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { SignOutButton } from "@/app/(public)/profil/sign-out-button";
import { SieraList, SieraRowLink, SieraSectionTitle } from "@/components/siera";
import { requireRole } from "@/lib/auth";

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
      <SieraSectionTitle id={id}>{heading}</SieraSectionTitle>
      <SieraList aria-label={label}>
        {rows.map((r) => (
          <SieraRowLink
            key={r.href}
            href={r.href}
            icon={r.icon}
            title={r.title}
            subtitle={r.desc}
          />
        ))}
      </SieraList>
    </section>
  );
}

/** Pengaturan per role: standar lengkap + menu sesuai peran. Tanpa backend baru. */
export default async function PengaturanPage() {
  const current = await requireRole("/akun/pengaturan", "student", "tenant", "admin");

  const akun: Row[] = [
    { href: "/profil", icon: UserRound, title: "Profil", desc: "Nama dan info akun" },
    {
      href: "/akun/keamanan",
      icon: ShieldCheck,
      title: "Keamanan",
      desc: "Email dan metode login",
    },
    {
      href: "/akun/notifikasi",
      icon: Bell,
      title: "Notifikasi",
      desc: "Bunyi kabar pesanan",
    },
    {
      href: "/akun/privasi",
      icon: Database,
      title: "Privasi & data",
      desc: "Unduh data kamu (JSON)",
    },
  ];

  const peran: Row[] =
    current.role === "tenant"
      ? [
          {
            href: "/tenant/profil",
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
    <div className="mx-auto grid w-full max-w-[430px] flex-1 grid-cols-1 content-start gap-6 px-4 py-6 sm:max-w-none md:max-w-3xl md:grid-cols-2 md:px-6">
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

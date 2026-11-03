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
import { AppHeader } from "@/components/app-header";
import { InstallPwa } from "@/components/install-pwa";
import { SieraList, SieraRowLink, SieraSectionTitle } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

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
  const current = await requireRole(ROUTES.profilPengaturan, "student", "tenant", "admin");

  const akun: Row[] = [
    { href: ROUTES.profil, icon: UserRound, title: "Profil", desc: "Ubah nama dan info akunmu" },
    {
      href: ROUTES.profilKeamanan,
      icon: ShieldCheck,
      title: "Keamanan",
      desc: "Ubah sandi dan keluar perangkat",
    },
    {
      href: ROUTES.profilNotifikasi,
      icon: Bell,
      title: "Notifikasi",
      desc: "Bunyi untuk kabar pesanan",
    },
    {
      href: ROUTES.profilPrivasi,
      icon: Database,
      title: "Privasi & data",
      desc: "Ambil data kamu (JSON)",
    },
  ];

  const peran: Row[] =
    current.role === "tenant"
      ? [
          {
            href: ROUTES.tenantProfil,
            icon: Store,
            title: "Profil kantin",
            desc: "Nama gerai dan lokasimu",
          },
          {
            href: ROUTES.tenantOperasional,
            icon: ReceiptText,
            title: "Operasional",
            desc: "Jam posting dan ringkasan hari ini",
          },
        ]
      : [
          {
            href: ROUTES.profilBantuan,
            icon: CircleHelp,
            title: "Bantuan & lapor",
            desc: "Jawaban cepat dan lapor masalah",
          },
        ];

  const pintas: Row[] =
    current.role === "admin"
      ? [
          {
            href: ROUTES.adminTenant,
            icon: Store,
            title: "Persetujuan tenant",
            desc: "Pendaftar yang menunggu verifikasi",
          },
          {
            href: ROUTES.admin,
            icon: ReceiptText,
            title: "Kebijakan jendela jual",
            desc: "120 sampai 240 menit setelah masak",
          },
        ]
      : [];

  return (
    <>
      <AppHeader
        title="Pengaturan"
        trail={[{ label: "Profil", href: ROUTES.profil }, { label: "Pengaturan" }]}
      />
      <div className="grid w-full min-w-0 flex-1 grid-cols-1 content-start gap-6 px-4 py-6 md:grid-cols-2 md:px-8">
        <div className="flex flex-col gap-1 md:col-span-2">
          <h1 className="text-[18px] leading-[1.3] font-extrabold">Pengaturan</h1>
          <p className="text-[13px] text-[#64746B]">Kelola akun dan pilihan notifikasimu.</p>
        </div>

        <Group heading="Akun & preferensi" label="Akun dan preferensi" rows={akun} />
        {peran.length > 0 && (
          <Group heading="Khusus peran kamu" label="Menu khusus peran" rows={peran} />
        )}
        {pintas.length > 0 && <Group heading="Pintas peran" label="Pintas peran" rows={pintas} />}
        <div className="md:col-span-2">
          <InstallPwa />
        </div>

        <div className="md:col-span-2">
          <SignOutButton />
        </div>

        <p className="pb-4 text-center text-[11px] font-semibold text-[#64746B] md:col-span-2">
          Seporsi Terakhir v0.1.0
        </p>
      </div>
    </>
  );
}

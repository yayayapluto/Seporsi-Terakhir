import {
  History,
  Leaf,
  Map as MapIcon,
  PackageCheck,
  Settings,
  Store,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { requireRole } from "@/lib/auth";
import { portionsSaved } from "@/lib/domain/metrics";
import { formatDateTimeWIB, formatIDR, namaToInitials } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { parseTourParams } from "@/lib/tour-journey";
import { AvatarImage } from "./avatar-image";
import { DaftarTenantButton } from "./daftar-tenant-button";

/** Profil student: identitas, aplikasi tenant, dampak dari pesanan picked_up. */

interface ProfileData {
  fullName: string;
  email: string | null;
  role: string | null;
  avatarPath: string | null;
  tenantName: string | null;
  tenantApproved: boolean | null;
  savedPortions: number;
  moneySavedIdr: number;
  wasteKg: number | null;
  lastPickup: string | null;
  loadFailed: boolean;
}

async function loadProfile(userId: string, includeOrders: boolean): Promise<ProfileData> {
  const supabase = await createClient();
  const [{ data: profile }, { data: tenant }, { data: orders, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, role, avatar_url")
      .eq("id", userId)
      .single(),
    supabase.from("tenants").select("name, is_approved").eq("owner_id", userId).maybeSingle(),
    includeOrders
      ? supabase.rpc("my_orders")
      : Promise.resolve({ data: [], error: null } as unknown as {
          data: null;
          error: null;
        }),
  ]);
  let savedPortions = 0;
  let moneySavedIdr = 0;
  let wasteGrams = 0;
  let hasWeight = false;
  let lastPickup: string | null = null;
  if (!error && orders) {
    for (const o of orders) {
      if (o.status !== "picked_up") continue;
      savedPortions += o.quantity;
      moneySavedIdr +=
        o.quantity * Math.max(0, o.normal_price_snapshot - o.discount_price_snapshot);
      if (o.avg_weight_snapshot != null) {
        wasteGrams += o.quantity * o.avg_weight_snapshot;
        hasWeight = true;
      }
      if (!lastPickup || o.picked_up_at > lastPickup) lastPickup = o.picked_up_at;
    }
  }
  return {
    fullName:
      (profile?.full_name as string | null) ??
      (profile?.email as string | null)?.split("@")[0] ??
      "Pengguna",
    email: (profile?.email as string | null) ?? null,
    avatarPath: (profile?.avatar_url as string | null) ?? null,
    role: (profile?.role as string | null) ?? null,
    tenantName: (tenant?.name as string | undefined) ?? null,
    tenantApproved: (tenant?.is_approved as boolean | undefined) ?? null,
    savedPortions: portionsSaved(savedPortions),
    moneySavedIdr,
    wasteKg: hasWeight ? wasteGrams / 1000 : null,
    lastPickup,
    loadFailed: error != null,
  };
}

import {
  SieraAlert,
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  SieraSectionTitle,
  SieraTile,
  sieraCardClass,
} from "@/components/siera";

function roleLabel(p: ProfileData): string | null {
  if (p.role == null) return null;
  if (p.role === "admin") return "Admin";
  if (p.tenantName != null) return p.tenantApproved ? "Tenant aktif" : "Menunggu persetujuan";
  if (p.role === "tenant") return "Tenant";
  return "Mahasiswa";
}

export default async function ProfilPage({
  searchParams,
}: {
  searchParams?: Promise<{
    mode?: string;
    tour?: string;
    panduan?: string;
    langkah?: string;
    fresh?: string;
  }>;
}) {
  const current = await requireRole("/profil", "student", "tenant", "admin");
  const { user } = current;
  const isStudent = current.role === "student";
  const isTenant = current.role === "tenant";
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  const p = await loadProfile(user.id, isStudent);
  const label = roleLabel(p);
  const tenantStatus =
    p.tenantName == null ? null : p.tenantApproved ? "tenant aktif" : "menunggu persetujuan";
  const initials = namaToInitials(p.fullName);

  return (
    <>
      <AppHeader title="Profil" trail={[{ label: "Profil" }]} />
      <SieraRailPage
        asideLabel="Pelengkap profil"
        main={
          <>
            {/* Identitas — avatar + nama read-only, edit di Pengaturan > Profil */}
            <section aria-label="Identitas" className={`${sieraCardClass} p-3`}>
              <div className="flex items-center gap-3">
                {p.avatarPath ? (
                  <AvatarImage avatarPath={p.avatarPath} fullName={p.fullName} />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#DCEBE0] text-base font-extrabold text-[#1E5A36]"
                  >
                    {initials || "•"}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate text-[16px] leading-[1.3] font-extrabold">
                    {p.fullName}
                  </h1>
                  {p.email && <p className="truncate text-[13px] text-[#64746B]">{p.email}</p>}
                  {label && (
                    <p className="mt-1 inline-flex rounded-full bg-[#DCEBE0] px-2.5 py-1 text-[11px] font-bold text-[#1E5A36]">
                      {label}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Dampak — khusus student */}
            {isStudent && (
              <section aria-labelledby="dampak-heading" className="flex min-w-0 flex-col gap-2">
                <div className="flex min-h-11 items-center">
                  <SieraSectionTitle id="dampak-heading">Dampakmu</SieraSectionTitle>
                </div>
                {p.loadFailed && (
                  <SieraAlert variant="error">
                    Gagal memuat data dampak. Angka di bawah mungkin tidak akurat.{" "}
                    <Link
                      href={ROUTES.profil}
                      className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                    >
                      Coba lagi
                    </Link>
                  </SieraAlert>
                )}
                <dl
                  className={`${sieraCardClass} grid grid-cols-3 divide-x divide-dashed divide-line overflow-hidden`}
                >
                  <div className="flex min-w-0 flex-col items-center gap-1 px-2 py-3 text-center">
                    <SieraTile>
                      <PackageCheck className="size-5" />
                    </SieraTile>
                    <dd className="text-[16px] font-extrabold">{p.savedPortions}</dd>
                    <dt className="text-[12px] font-semibold text-[#64746B]">Porsi selamat</dt>
                  </div>
                  <div className="flex min-w-0 flex-col items-center gap-1 px-2 py-3 text-center">
                    <SieraTile>
                      <Wallet className="size-5" />
                    </SieraTile>
                    <dd className="truncate text-[16px] font-extrabold">
                      {formatIDR(p.moneySavedIdr)}
                    </dd>
                    <dt className="text-[12px] font-semibold text-[#64746B]">Uang hemat</dt>
                  </div>
                  <div
                    className="flex min-w-0 flex-col items-center gap-1 px-2 py-3 text-center"
                    title="Berat = estimasi sampling tenant"
                  >
                    <SieraTile>
                      <Leaf className="size-5" />
                    </SieraTile>
                    <dd className="text-[16px] font-extrabold">
                      {p.wasteKg == null ? (
                        <span className="text-sm font-normal text-[#64746B]">Belum ada</span>
                      ) : (
                        `${p.wasteKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg`
                      )}
                    </dd>
                    <dt className="text-[12px] font-semibold text-[#64746B]">Sampah cegah*</dt>
                  </div>
                </dl>
                <p
                  className="px-1 text-[11px] leading-relaxed text-[#64746B]"
                  title="Berat = estimasi sampling tenant"
                >
                  *estimasi. Pickup:{" "}
                  {p.lastPickup ? `${formatDateTimeWIB(new Date(p.lastPickup))} WIB` : "belum ada"}.
                </p>
              </section>
            )}

            {/* Navigasi akun — khusus tenant */}
            {isTenant && (
              <SieraSection id="akun-heading" label="Pengaturan">
                <SieraList aria-label="Pengaturan">
                  <SieraRowLink
                    href={ROUTES.tenantProfil}
                    icon={Store}
                    title="Profil kantin"
                    subtitle="Nama gerai dan lokasi"
                  />
                  <SieraRowLink
                    href={ROUTES.profilPengaturan}
                    icon={Settings}
                    title="Pengaturan"
                    subtitle="Keamanan, notifikasi, privasi"
                  />
                </SieraList>
              </SieraSection>
            )}

            {/* Kelola platform — khusus admin */}
            {!isStudent && !isTenant && (
              <SieraSection id="kelola-heading" label="Kelola platform">
                <SieraList aria-label="Kelola platform">
                  {(
                    [
                      {
                        href: ROUTES.adminTenant,
                        icon: Store,
                        title: "Persetujuan tenant",
                        desc: "Daftar menunggu verifikasi",
                      },
                      {
                        href: ROUTES.admin,
                        icon: Leaf,
                        title: "Dampak",
                        desc: "Angka rescue & unduhan",
                      },
                    ] as const
                  ).map((r) => (
                    <SieraRowLink
                      key={r.href}
                      href={r.href}
                      icon={r.icon}
                      title={r.title}
                      subtitle={r.desc}
                    />
                  ))}
                </SieraList>
              </SieraSection>
            )}

            {/* Navigasi — Grouped List Card */}
            <SieraSection
              id="riwayat-heading"
              label={isStudent ? "Pesanan & pengaturan" : "Pengaturan"}
            >
              <SieraList aria-label={isStudent ? "Pesanan dan katalog" : "Pengaturan"}>
                {isStudent && (
                  <SieraRowLink
                    href={ROUTES.pesanan}
                    icon={History}
                    title="Riwayat pesanan"
                    subtitle="Lihat QR pickup atau cek riwayat lengkap"
                  />
                )}
                {isStudent && !p.loadFailed && p.savedPortions === 0 && (
                  <SieraRowLink
                    href={ROUTES.katalog}
                    icon={UtensilsCrossed}
                    title="Cari porsi sore ini"
                    subtitle="Katalog rescue hari ini"
                  />
                )}
                <SieraRowLink
                  href={ROUTES.profilPengaturan}
                  icon={Settings}
                  title="Pengaturan"
                  subtitle="Keamanan, notifikasi, privasi"
                />
              </SieraList>
            </SieraSection>
          </>
        }
        aside={
          <>
            {isStudent && (
              <SieraSection id="tenant-heading" label="Aplikasi tenant">
                {tenantStatus == null ? (
                  <div className={`${sieraCardClass} border-dashed p-3 text-center`}>
                    <p className="text-sm font-bold">Belum mendaftar sebagai tenant</p>
                    <p className="mt-1 text-[13px] text-[#64746B]">
                      Jual sisa masakanmu, gratis untuk saat ini.
                    </p>
                    <DaftarTenantButton />
                  </div>
                ) : (
                  <SieraList>
                    <SieraRowLink
                      href={p.tenantApproved ? ROUTES.tenant : ROUTES.tenantMenunggu}
                      icon={Store}
                      title={p.tenantName ?? "Kantinmu"}
                      subtitle={tenantStatus}
                    />
                  </SieraList>
                )}
              </SieraSection>
            )}
            {/* Bantuan — panduan sesuai peran */}
            <section aria-labelledby="bantuan-heading" className="flex min-w-0 flex-col gap-2">
              <div className="flex min-h-11 items-center">
                <SieraSectionTitle id="bantuan-heading">Bantuan</SieraSectionTitle>
              </div>
              <SieraList aria-label="Bantuan">
                <SieraRowLink
                  href={
                    isTenant
                      ? `${ROUTES.tenant}?panduan=rantai&fresh=1`
                      : isStudent
                        ? `${ROUTES.beranda}?panduan=rantai&fresh=1`
                        : ROUTES.caraKerja
                  }
                  icon={MapIcon}
                  title={isTenant ? "Panduan kelola" : isStudent ? "Panduan beranda" : "Cara kerja"}
                  subtitle={
                    isTenant
                      ? "Tur singkat dasbor sampai scan"
                      : isStudent
                        ? "Lihat lagi cara membaca Beranda dan memesan porsi"
                        : "Alur rescue & keamanan pangan"
                  }
                />
              </SieraList>
            </section>
          </>
        }
      />
      {isStudent && (
        <GuidedTour
          tourKey="profil"
          forced={tourForced}
          auto={false}
          journey={tourJourney}
          userId={user.id}
          fresh={sp.fresh === "1"}
          entryStep={tourEntry}
          next={tourJourney ? ROUTES.katalog : undefined}
          journeyLabel="Bagian 4 dari 4 · Profil"
          finishLabel={tourJourney ? "Lihat porsi sore ini" : undefined}
          intro={{
            title: "Ada apa di akun?",
            body: "Dampakmu, jalan jadi tenant, dan semua pengaturan, sekilas saja.",
          }}
          steps={[
            {
              target: '[aria-label="Identitas"]',
              title: "Kamu siapa di sini",
              body: "Nama, email, dan peranmu: mahasiswa, atau tenant yang sudah disetujui.",
            },
            {
              target: '[aria-labelledby="dampak-heading"]',
              title: "Jejak rescue-mu",
              body: "Porsi terselamatkan, uang hemat, dan sampah dicegah dari setiap pickup.",
            },
            {
              target: '[aria-labelledby="bantuan-heading"]',
              title: "Butuh panduan lagi",
              body: "Putar ulang panduan beranda kapan saja dari sini.",
            },
          ]}
        />
      )}
    </>
  );
}

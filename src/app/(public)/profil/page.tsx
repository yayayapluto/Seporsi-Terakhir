import {
  Clock3,
  History,
  Leaf,
  Map as MapIcon,
  PackageCheck,
  Settings,
  Store,
  TriangleAlert,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { portionsSaved } from "@/lib/domain/metrics";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { parseTourParams } from "@/lib/tour-journey";

/** Profil student: identitas, aplikasi tenant, dampak dari pesanan picked_up. */

interface ProfileData {
  fullName: string;
  email: string | null;
  role: string | null;
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
    supabase.from("profiles").select("full_name, email, role").eq("id", userId).single(),
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
  SieraList,
  SieraRowLink,
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
  const initials = p.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <>
      <AppHeader title="Akun" />
      <div className="mx-auto grid w-full max-w-[430px] flex-1 grid-cols-1 content-start gap-6 px-4 py-6 sm:max-w-none md:max-w-3xl md:grid-cols-2 md:px-8 md:pb-12">
        {/* Identitas — avatar + nama dalam card */}
        <section aria-label="Identitas" className={`${sieraCardClass} p-4 md:col-span-2`}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#DCEBE0] text-lg font-extrabold text-[#1E5A36]"
            >
              {initials || "•"}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[18px] leading-[1.3] font-extrabold">{p.fullName}</h1>
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
          <section aria-labelledby="dampak-heading" className="flex flex-col gap-3">
            <SieraSectionTitle id="dampak-heading">Dampak kamu sejauh ini</SieraSectionTitle>
            {p.loadFailed && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-2xl bg-[#FEE2E2] p-4 text-sm font-semibold text-[#BA1A1A]"
              >
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span>
                  Gagal memuat data dampak. Angka di bawah mungkin tidak akurat.{" "}
                  <Link
                    href="/profil"
                    className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                  >
                    Coba lagi
                  </Link>
                </span>
              </p>
            )}
            <dl className={`${sieraCardClass} divide-y divide-line overflow-hidden`}>
              <div className="flex min-h-16 items-center gap-3 px-4 py-3.5">
                <SieraTile>
                  <PackageCheck className="size-5" />
                </SieraTile>
                <div className="min-w-0 flex-1">
                  <dt className="text-[12px] font-semibold text-[#64746B]">Porsi terselamatkan</dt>
                  <dd className="text-[16px] font-extrabold">{p.savedPortions}</dd>
                </div>
              </div>
              <div className="flex min-h-16 items-center gap-3 px-4 py-3.5">
                <SieraTile>
                  <Wallet className="size-5" />
                </SieraTile>
                <div className="min-w-0 flex-1">
                  <dt className="text-[12px] font-semibold text-[#64746B]">Uang hemat</dt>
                  <dd className="text-[16px] font-extrabold">{formatIDR(p.moneySavedIdr)}</dd>
                </div>
              </div>
              <div className="flex min-h-16 items-center gap-3 px-4 py-3.5">
                <SieraTile>
                  <Leaf className="size-5" />
                </SieraTile>
                <div className="min-w-0 flex-1">
                  <dt className="text-[12px] font-semibold text-[#64746B]">
                    Sampah makanan dicegah
                  </dt>
                  <dd className="text-[16px] font-extrabold">
                    {p.wasteKg == null ? (
                      <span className="text-sm font-normal text-[#64746B]">
                        Belum ada data berat
                      </span>
                    ) : (
                      `${p.wasteKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg`
                    )}
                  </dd>
                </div>
              </div>
            </dl>
            <p className="flex items-center gap-1.5 px-1 text-[12px] text-[#64746B]">
              <Clock3 className="size-3.5 shrink-0" aria-hidden />
              <span>
                Berat = estimasi sampling tenant. Terakhir pickup:{" "}
                {p.lastPickup ? `${formatDateTimeWIB(new Date(p.lastPickup))} WIB` : "belum ada"}.
              </span>
            </p>
          </section>
        )}

        {/* Aplikasi tenant — khusus student */}
        {isStudent && (
          <section aria-labelledby="tenant-heading" className="flex flex-col gap-3">
            <SieraSectionTitle id="tenant-heading">Aplikasi tenant</SieraSectionTitle>
            {tenantStatus == null ? (
              <div className={`${sieraCardClass} border-dashed p-4 text-center`}>
                <p className="text-sm font-bold">Belum mendaftar sebagai tenant</p>
                <p className="mt-1 text-[13px] text-[#64746B]">
                  Jual sisa masakanmu lewat Seporsi Terakhir — gratis untuk saat ini.
                </p>
                <Link
                  href="/tenant/pendaftaran"
                  className={`${buttonVariants()} mt-4 min-h-12 w-full`}
                >
                  Daftar jadi tenant
                </Link>
              </div>
            ) : (
              <SieraList>
                <SieraRowLink
                  href={p.tenantApproved ? "/tenant" : "/tenant/menunggu-persetujuan"}
                  icon={Store}
                  title={p.tenantName ?? "Kantinmu"}
                  subtitle={tenantStatus}
                />
              </SieraList>
            )}
          </section>
        )}

        {/* Navigasi akun — khusus tenant */}
        {isTenant && (
          <section aria-labelledby="akun-heading" className="flex flex-col gap-3">
            <SieraSectionTitle id="akun-heading">Pengaturan</SieraSectionTitle>
            <SieraList aria-label="Pengaturan">
              <SieraRowLink
                href="/tenant/profil"
                icon={Store}
                title="Profil kantin"
                subtitle="Nama gerai dan lokasi"
              />
              <SieraRowLink
                href="/akun/pengaturan"
                icon={Settings}
                title="Pengaturan"
                subtitle="Keamanan, notifikasi, privasi"
              />
            </SieraList>
          </section>
        )}

        {/* Kelola platform — khusus admin */}
        {!isStudent && !isTenant && (
          <section aria-labelledby="kelola-heading" className="flex flex-col gap-3">
            <SieraSectionTitle id="kelola-heading">Kelola platform</SieraSectionTitle>
            <SieraList aria-label="Kelola platform">
              {(
                [
                  {
                    href: "/admin/tenant",
                    icon: Store,
                    title: "Persetujuan tenant",
                    desc: "Daftar menunggu verifikasi",
                  },
                  { href: "/admin", icon: Leaf, title: "Dampak", desc: "Angka rescue & unduhan" },
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
          </section>
        )}

        {/* Navigasi — Grouped List Card */}
        <section aria-labelledby="riwayat-heading" className="flex flex-col gap-3">
          <SieraSectionTitle id="riwayat-heading">
            {isStudent ? "Pesanan, katalog & pengaturan" : "Pengaturan"}
          </SieraSectionTitle>
          <SieraList aria-label={isStudent ? "Pesanan dan katalog" : "Pengaturan"}>
            {isStudent && (
              <SieraRowLink
                href="/pesanan"
                icon={History}
                title="Riwayat pesanan"
                subtitle="Lihat QR pickup atau cek riwayat lengkap"
              />
            )}
            {isStudent && !p.loadFailed && p.savedPortions === 0 && (
              <SieraRowLink
                href="/katalog"
                icon={UtensilsCrossed}
                title="Cari porsi sore ini"
                subtitle="Katalog rescue hari ini"
              />
            )}
            <SieraRowLink
              href="/akun/pengaturan"
              icon={Settings}
              title="Pengaturan"
              subtitle="Keamanan, notifikasi, privasi"
            />
          </SieraList>
        </section>

        {/* Bantuan — panduan sesuai peran */}
        <section aria-labelledby="bantuan-heading" className="flex flex-col gap-3">
          <SieraSectionTitle id="bantuan-heading">Bantuan</SieraSectionTitle>
          <SieraList aria-label="Bantuan">
            <SieraRowLink
              href={
                isTenant
                  ? "/tenant?panduan=rantai&fresh=1"
                  : isStudent
                    ? "/beranda?panduan=rantai&fresh=1"
                    : "/cara-kerja"
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

        <p className="pb-4 text-center text-[11px] font-semibold text-[#64746B] md:col-span-2">
          Seporsi Terakhir v0.1.0
        </p>
      </div>
      {isStudent && (
        <GuidedTour
          tourKey="profil"
          forced={tourForced}
          auto={false}
          journey={tourJourney}
          userId={user.id}
          fresh={sp.fresh === "1"}
          entryStep={tourEntry}
          next={tourJourney ? "/katalog" : undefined}
          journeyLabel="Bagian 4 dari 4 · Akun"
          finishLabel={tourJourney ? "Lihat porsi sore ini" : undefined}
          intro={{
            title: "Ada apa di akun?",
            body: "Dampakmu, jalan jadi tenant, dan semua pengaturan — sekilas saja.",
          }}
          steps={[
            {
              target: '[aria-label="Identitas"]',
              title: "Kamu siapa di sini",
              body: "Nama, email, dan peranmu — mahasiswa, atau tenant yang sudah disetujui.",
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

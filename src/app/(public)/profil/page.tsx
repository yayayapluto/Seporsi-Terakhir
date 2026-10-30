import {
  ChevronRight,
  Clock3,
  History,
  Leaf,
  PackageCheck,
  Settings,
  Store,
  TriangleAlert,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { portionsSaved } from "@/lib/domain/metrics";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

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

async function loadProfile(userId: string): Promise<ProfileData> {
  const supabase = await createClient();
  const [{ data: profile }, { data: tenant }, { data: orders, error }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, role").eq("id", userId).single(),
    supabase.from("tenants").select("name, is_approved").eq("owner_id", userId).maybeSingle(),
    supabase.rpc("my_orders"),
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

const CARD =
  "rounded-[20px] border border-[#E8ECE9] bg-card p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]";
const ROW_TILE =
  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F2] text-primary";

function roleLabel(p: ProfileData): string | null {
  if (p.role == null) return null;
  if (p.role === "admin") return "Admin";
  if (p.tenantName != null) return p.tenantApproved ? "Tenant aktif" : "Menunggu persetujuan";
  if (p.role === "tenant") return "Tenant";
  return "Mahasiswa";
}

export default async function ProfilPage() {
  const { user } = await requireRole("/profil", "student");
  const p = await loadProfile(user.id);
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
      <div className="mx-auto grid w-full max-w-[430px] flex-1 grid-cols-1 content-start gap-6 px-4 py-6 pb-28 md:max-w-3xl md:grid-cols-2 md:px-8 md:pb-12">
        {/* Identitas — avatar + nama dalam card */}
        <section aria-label="Identitas" className={`${CARD} md:col-span-2`}>
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

        {/* Dampak — Field Card rows */}
        <section aria-labelledby="dampak-heading" className="flex flex-col gap-3">
          <h2
            id="dampak-heading"
            className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]"
          >
            Dampak kamu sejauh ini
          </h2>
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
          <dl className={`${CARD} divide-y divide-dashed divide-[#E8ECE9] !p-0`}>
            <div className="flex min-h-11 items-center gap-3 p-4">
              <span aria-hidden className={ROW_TILE}>
                <PackageCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[12px] font-semibold text-[#64746B]">Porsi terselamatkan</dt>
                <dd className="text-[16px] font-extrabold">{p.savedPortions}</dd>
              </div>
            </div>
            <div className="flex min-h-11 items-center gap-3 p-4">
              <span aria-hidden className={ROW_TILE}>
                <Wallet className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[12px] font-semibold text-[#64746B]">Uang hemat</dt>
                <dd className="text-[16px] font-extrabold">{formatIDR(p.moneySavedIdr)}</dd>
              </div>
            </div>
            <div className="flex min-h-11 items-center gap-3 p-4">
              <span aria-hidden className={ROW_TILE}>
                <Leaf className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[12px] font-semibold text-[#64746B]">Sampah makanan dicegah</dt>
                <dd className="text-[16px] font-extrabold">
                  {p.wasteKg == null ? (
                    <span className="text-sm font-normal text-[#64746B]">Belum ada data berat</span>
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

        {/* Tenant — Settings/Empty Card */}
        <section aria-labelledby="tenant-heading" className="flex flex-col gap-3">
          <h2
            id="tenant-heading"
            className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]"
          >
            Aplikasi tenant
          </h2>
          {tenantStatus == null ? (
            <div className={`${CARD} border-dashed text-center`}>
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
            <div className={CARD}>
              <Link
                href={p.tenantApproved ? "/tenant" : "/tenant/menunggu-persetujuan"}
                className="flex min-h-11 items-center gap-3"
              >
                <span aria-hidden className={ROW_TILE}>
                  <Store className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.tenantName}</span>
                  <span className="block text-[13px] text-[#64746B]">{tenantStatus}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
              </Link>
            </div>
          )}
        </section>

        {/* Navigasi — Grouped List Card */}
        <section aria-labelledby="riwayat-heading" className="flex flex-col gap-3">
          <h2
            id="riwayat-heading"
            className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]"
          >
            Pesanan, katalog & pengaturan
          </h2>
          <nav
            aria-label="Pesanan dan katalog"
            className={`${CARD} divide-y divide-dashed divide-[#E8ECE9] !p-0`}
          >
            <Link href="/pesanan" className="flex min-h-11 items-center gap-3 p-4">
              <span aria-hidden className={ROW_TILE}>
                <History className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">Riwayat pesanan</span>
                <span className="block text-[12px] text-[#64746B]">
                  Lihat QR pickup atau cek riwayat lengkap
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
            </Link>
            {!p.loadFailed && p.savedPortions === 0 && (
              <Link href="/katalog" className="flex min-h-11 items-center gap-3 p-4">
                <span aria-hidden className={ROW_TILE}>
                  <UtensilsCrossed className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">Cari porsi sore ini</span>
                  <span className="block text-[12px] text-[#64746B]">Katalog rescue hari ini</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
              </Link>
            )}
            <Link href="/akun/pengaturan" className="flex min-h-11 items-center gap-3 p-4">
              <span aria-hidden className={ROW_TILE}>
                <Settings className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">Pengaturan</span>
                <span className="block text-[12px] text-[#64746B]">
                  Keamanan, notifikasi, privasi
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
            </Link>
          </nav>
        </section>

        <p className="pb-4 text-center text-[11px] font-semibold text-[#64746B] md:col-span-2">
          Seporsi Terakhir v0.1.0
        </p>
      </div>
    </>
  );
}

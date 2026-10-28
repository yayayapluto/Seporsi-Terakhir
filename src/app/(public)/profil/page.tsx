import { Clock3, History, Leaf, PackageCheck, Store, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { portionsSaved } from "@/lib/domain/metrics";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

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

export default async function ProfilPage() {
  const { user } = await requireRole("/profil", "student");
  const p = await loadProfile(user.id);
  const tenantStatus =
    p.tenantName == null ? null : p.tenantApproved ? "tenant aktif" : "menunggu persetujuan";
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <UserRound className="size-7 shrink-0 text-primary" aria-hidden />
          {p.fullName}
        </h1>
        {p.email && <p className="text-muted-foreground">{p.email}</p>}
        {p.role != null && (
          <p className="text-sm font-semibold text-muted-foreground">
            {p.role === "admin"
              ? "Admin"
              : p.tenantName != null
                ? p.tenantApproved
                  ? "Tenant aktif"
                  : "Menunggu persetujuan"
                : p.role === "tenant"
                  ? "Tenant"
                  : "Mahasiswa"}
          </p>
        )}
      </div>

      <section aria-labelledby="dampak-heading" className="border-b pb-8">
        <h2 id="dampak-heading" className="text-lg font-bold">
          Dampak kamu sejauh ini
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dihitung dari pesanan yang sudah diambil (status selesai): porsi yang sudah dikonfirmasi
          tenant lewat QR saat serah terima.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <PackageCheck className="size-4 shrink-0 text-primary" aria-hidden />
              Porsi terselamatkan
            </dt>
            <dd className="mt-1 text-2xl font-bold">{p.savedPortions}</dd>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Wallet className="size-4 shrink-0 text-primary" aria-hidden />
              Uang hemat
            </dt>
            <dd className="mt-1 text-2xl font-bold">{formatIDR(p.moneySavedIdr)}</dd>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Leaf className="size-4 shrink-0 text-primary" aria-hidden />
              Sampah makanan dicegah
            </dt>
            <dd className="mt-1 text-2xl font-bold">
              {p.wasteKg == null ? (
                <span className="text-sm font-normal text-muted-foreground">
                  Belum ada data berat
                </span>
              ) : (
                `${p.wasteKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg`
              )}
            </dd>
          </div>
        </dl>
        {p.loadFailed && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Gagal memuat data dampak. Angka di bawah mungkin tidak akurat.{" "}
            <Link
              href="/profil"
              className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
            >
              Coba lagi
            </Link>
          </p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3.5 shrink-0" aria-hidden />
          <span>
            Berat = estimasi sampling tenant. Terakhir pickup:{" "}
            {p.lastPickup ? `${formatDateTimeWIB(new Date(p.lastPickup))} WIB` : "belum ada"}.
          </span>
        </p>
      </section>

      <section aria-labelledby="tenant-heading" className="border-b pb-8">
        <h2 id="tenant-heading" className="text-lg font-bold">
          Aplikasi tenant
        </h2>
        {tenantStatus == null ? (
          <EmptyState
            title="Belum mendaftar sebagai tenant"
            hint="Jual sisa masakanmu lewat Porsi Terakhir — gratis untuk saat ini."
            ctaHref="/tenant/pendaftaran"
            ctaLabel="Daftar jadi tenant"
          />
        ) : (
          <p className="flex items-center gap-1.5 text-sm">
            <Store className="size-4 shrink-0 text-primary" aria-hidden />
            {p.tenantName} · {tenantStatus}
          </p>
        )}
      </section>

      <section aria-labelledby="riwayat-heading">
        <h2 id="riwayat-heading" className="text-lg font-bold">
          Riwayat pesanan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lihat QR pickup, batalkan pesanan aktif, atau cek riwayat lengkap.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/pesanan" className={buttonVariants()}>
            <History className="mr-2 size-4 shrink-0" aria-hidden />
            Lihat riwayat pesanan
          </Link>
          {!p.loadFailed && p.savedPortions === 0 && (
            <Link href="/katalog" className={buttonVariants({ variant: "outline" })}>
              Cari porsi sore ini
            </Link>
          )}
        </div>
      </section>

      <div className="border-t pt-6">
        <SignOutButton />
      </div>
    </div>
  );
}

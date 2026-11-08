import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { SieraAlert, SieraCard, SieraRailPage, SieraSection } from "@/components/siera";
import { GenericPageSkeleton } from "@/components/ui/skeleton-blocks";
import { requireRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { ApproveList } from "./approve-list";
import { ListedList, type ListedTenant } from "./listed-list";

export const metadata: Metadata = { title: "Dasbor Admin" };

async function loadListed(): Promise<{ tenants: ListedTenant[] }> {
  const supabase = await createClient();
  await connection();
  const { data } = await supabase
    .from("tenants")
    .select("id, name, location_note, is_listed")
    .eq("is_approved", true)
    .order("name", { ascending: true });
  return {
    tenants: (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      locationNote: t.location_note,
      isListed: t.is_listed,
    })),
  };
}

export interface PendingTenant {
  id: string;
  name: string;
  locationNote: string | null;
  createdAt: string;
}

async function loadPending(): Promise<{ tenants: PendingTenant[]; error: string | null }> {
  const supabase = await createClient();
  await connection();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, location_note, created_at")
    .eq("is_approved", false)
    .order("created_at", { ascending: true });
  if (error) return { tenants: [], error: "Gagal memuat pendaftaran. Coba lagi." };
  if (!data) return { tenants: [], error: null };
  return {
    tenants: data.map((t) => ({
      id: t.id,
      name: t.name,
      locationNote: t.location_note,
      createdAt: t.created_at,
    })),
    error: null,
  };
}

export default function AdminTenantPage() {
  return (
    <>
      <AppHeader
        title="Persetujuan Tenant"
        trail={[{ label: "Dampak", href: ROUTES.admin }, { label: "Persetujuan Tenant" }]}
      />
      <Suspense fallback={<GenericPageSkeleton />}>
        <TenantRail />
      </Suspense>
    </>
  );
}

async function TenantRail() {
  await requireRole("/admin/tenant", "admin");
  const [pending, listed] = await Promise.all([loadPending(), loadListed()]);
  const queueCount = pending.error ? 0 : pending.tenants.length;
  return (
    <SieraRailPage
      asideLabel={`Antrean (${queueCount})`}
      main={
        <>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold tracking-widest text-primary">KELOLA MITRA</p>
            <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl font-bold">
              Mitra kantin
            </h1>
            <p className="text-muted-foreground">
              Setujui pendaftar baru dan atur siapa yang tampil di katalog.
            </p>
          </div>
          <section aria-labelledby="antrean-heading" className="flex flex-col gap-3">
            <h2 id="antrean-heading" className="text-xl font-bold">
              Menunggu persetujuan
            </h2>
            {pending.error ? (
              <SieraAlert variant="error">{pending.error}</SieraAlert>
            ) : (
              <ApproveList tenants={pending.tenants} />
            )}
          </section>
          <section aria-labelledby="visibilitas-heading" className="flex flex-col gap-3">
            <h2 id="visibilitas-heading" className="text-xl font-bold">
              Visibilitas di katalog
            </h2>
            <p className="text-sm text-muted-foreground">
              Sembunyikan gerai bermasalah dari katalog tanpa menghapus datanya. Porsi yang sudah
              dipesan tetap bisa diambil.
            </p>
            <ListedList tenants={listed.tenants} />
          </section>
        </>
      }
      aside={
        <div className="hidden min-w-0 flex-col gap-4 lg:gap-5 xl:flex">
          <SieraSection label={`Antrean (${queueCount})`}>
            <SieraCard className="flex flex-col gap-3 p-4">
              {pending.error ? (
                <p className="text-sm text-muted-foreground">
                  Antrean gagal dimuat. Coba muat ulang.
                </p>
              ) : queueCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Antrean kosong. Pendaftar baru muncul di sini.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {pending.tenants.slice(0, 5).map((t) => (
                    <li
                      key={t.id}
                      className="flex min-h-11 items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate max-md:whitespace-normal max-md:[overflow-wrap:anywhere] font-bold text-[#1C2826]">
                        {t.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SieraCard>
          </SieraSection>
          <SieraSection label="Kriteria persetujuan">
            <SieraCard className="flex flex-col gap-2 p-4">
              <ul className="flex list-none flex-col gap-2 text-sm">
                <li className="flex gap-2">
                  <span aria-hidden="true">1.</span>
                  <span>Nama gerai jelas, minimal 3 karakter.</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">2.</span>
                  <span>Lokasi dicantumkan bila ada, maksimal 200 karakter.</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">3.</span>
                  <span>Setuju tampil untuk disembunyikan tanpa hapus data.</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Menyetujui mengaktifkan akun tenant. Menolak menghapus baris, pendaftar bisa ajukan
                ulang.
              </p>
            </SieraCard>
          </SieraSection>
        </div>
      }
    />
  );
}

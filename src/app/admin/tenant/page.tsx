import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ApproveList } from "./approve-list";
import { ListedList, type ListedTenant } from "./listed-list";

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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">PANEL ADMIN</p>
        <h1 className="text-3xl font-bold">Persetujuan mitra kantin</h1>
        <p className="text-muted-foreground">
          Periksa pendaftaran, lalu setujui. Tenant baru bisa posting porsi setelah disetujui.
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <PendingBody />
      </Suspense>
      <section aria-labelledby="visibilitas-heading" className="flex flex-col gap-3">
        <h2 id="visibilitas-heading" className="text-xl font-bold">
          Visibilitas di katalog
        </h2>
        <p className="text-sm text-muted-foreground">
          Sembunyikan gerai bermasalah dari katalog tanpa menghapus datanya. Porsi yang sudah
          dipesan tetap bisa diambil.
        </p>
        <Suspense fallback={<LoadingSkeleton />}>
          <ListedBody />
        </Suspense>
      </section>
    </div>
  );
}

async function PendingBody() {
  await requireRole("/admin/tenant", "admin");
  const { tenants, error } = await loadPending();
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    );
  }
  return <ApproveList tenants={tenants} />;
}

async function ListedBody() {
  await requireRole("/admin/tenant", "admin");
  const { tenants } = await loadListed();
  return <ListedList tenants={tenants} />;
}

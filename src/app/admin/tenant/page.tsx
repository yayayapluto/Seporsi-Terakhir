import { connection } from "next/server";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ApproveList } from "./approve-list";

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
      <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat pendaftaran…</p>}>
        <PendingBody />
      </Suspense>
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

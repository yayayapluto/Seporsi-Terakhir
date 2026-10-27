import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { KatalogList } from "./katalog-list";

/** Auth + live stock: per-request data, streamed inside Suspense. */

export interface CatalogPortion {
  id: string;
  menuName: string;
  tenantName: string;
  tenantLocation: string | null;
  discountPrice: number;
  normalPrice: number;
  quantityRemaining: number;
  cookedAt: string;
  expiresAt: string;
  releaseAt: string;
}

async function loadCatalog(): Promise<{ portions: CatalogPortion[]; tenants: string[] }> {
  const supabase = await createClient();
  await connection();
  const now = new Date();
  const { data, error } = await supabase
    .from("portions")
    .select(
      "id, quantity_remaining, cooked_at, expires_at, release_at, discount_price, menu_items!inner(name, normal_price), tenants!inner(name, location_note)",
    )
    .gt("quantity_remaining", 0)
    .gt("expires_at", now.toISOString())
    .lte("release_at", now.toISOString())
    .order("expires_at", { ascending: true })
    .limit(60);
  if (error || !data) return { portions: [], tenants: [] };
  const portions: CatalogPortion[] = [];
  const tenantSet = new Set<string>();
  for (const row of data) {
    const menu = row.menu_items as unknown as { name: string; normal_price: number };
    const tenant = row.tenants as unknown as { name: string; location_note: string | null };
    tenantSet.add(tenant.name);
    portions.push({
      id: row.id,
      menuName: menu.name,
      tenantName: tenant.name,
      tenantLocation: tenant.location_note,
      discountPrice: row.discount_price,
      normalPrice: menu.normal_price,
      quantityRemaining: row.quantity_remaining,
      cookedAt: row.cooked_at,
      expiresAt: row.expires_at,
      releaseAt: row.release_at,
    });
  }
  return { portions, tenants: [...tenantSet].sort() };
}

export default function KatalogPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">KATALOG PORSI TERAKHIR</p>
        <h1 className="text-3xl font-bold">Porsi hari ini</h1>
        <p className="text-muted-foreground">
          Menu sisa yang masih layak, jam masak transparan, bayar di tempat. Maksimal 2 porsi per
          mahasiswa per hari.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat porsi…</p>}>
        <CatalogBody />
      </Suspense>
    </div>
  );
}

async function CatalogBody() {
  const { portions, tenants } = await loadCatalog();
  return <KatalogList portions={portions} tenants={tenants} />;
}

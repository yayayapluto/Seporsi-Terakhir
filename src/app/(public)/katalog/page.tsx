import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { SieraHero } from "@/components/siera";
import { publicMenuImageUrl } from "@/lib/menu-image";
import { createClient } from "@/lib/supabase/server";
import { KatalogList } from "./katalog-list";

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
  imageUrl?: string | null;
}

async function loadCatalog(): Promise<{
  portions: CatalogPortion[];
  tenants: string[];
  dayTotal: number;
}> {
  const supabase = await createClient();
  await connection();
  const now = new Date();
  const { data, error } = await supabase
    .from("portions")
    .select(
      "id, quantity_remaining, cooked_at, expires_at, release_at, discount_price, menu_items!inner(name, normal_price, image_path), tenants!inner(name, location_note)",
    )
    .gt("expires_at", now.toISOString())
    .lte("release_at", now.toISOString())
    .order("expires_at", { ascending: true })
    .limit(60);
  // Batas hari ini Asia/Jakarta → UTC (pola sama kayak dasbor tenant).
  const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayLocal = `${nowWib.getFullYear()}-${pad(nowWib.getMonth() + 1)}-${pad(nowWib.getDate())}`;
  const dayStartUtc = new Date(`${todayLocal}T00:00:00+07:00`).toISOString();
  const dayEndIso = new Date(
    new Date(`${todayLocal}T00:00:00+07:00`).getTime() + 86400000,
  ).toISOString();
  let dayTotal = 0;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: orders } = await supabase
      .from("orders")
      .select("quantity")
      .eq("student_id", user.id)
      .neq("status", "cancelled")
      .gte("created_at", dayStartUtc)
      .lt("created_at", dayEndIso);
    dayTotal = ((orders ?? []) as { quantity: number }[]).reduce((s, o) => s + o.quantity, 0);
  }
  if (error || !data) return { portions: [], tenants: [], dayTotal };
  const portions: CatalogPortion[] = [];
  const tenantSet = new Set<string>();
  for (const row of data) {
    const menu = row.menu_items as unknown as {
      name: string;
      normal_price: number;
      image_path: string | null;
    };
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
      imageUrl: menu.image_path ? publicMenuImageUrl(menu.image_path) : null,
    });
  }
  return { portions, tenants: [...tenantSet].sort(), dayTotal };
}

export default function KatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  return KatalogPageBody(searchParams);
}

async function KatalogPageBody(searchParams?: Promise<{ mode?: string }>) {
  const sp = (await searchParams) ?? {};
  const tourForced = sp.mode === "onboarding";
  return (
    <>
      <AppHeader title="Katalog" />
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-6 px-4 py-6 lg:max-w-6xl lg:px-8">
        <SieraHero eyebrow="Katalog sore ini" title="Porsi hari ini">
          Sisa dagangan yang masih layak makan. Jam masaknya tertulis jelas, bayar langsung di
          tempat. Maksimal 2 porsi per hari.
        </SieraHero>
        <Suspense fallback={<LoadingSkeleton variant="catalog-list" />}>
          <CatalogBody tourForced={tourForced} />
        </Suspense>
      </div>
    </>
  );
}

async function CatalogBody({ tourForced }: { tourForced: boolean }) {
  const { portions, tenants, dayTotal } = await loadCatalog();
  return (
    <KatalogList
      portions={portions}
      tenants={tenants}
      dayTotal={dayTotal}
      tourForced={tourForced}
    />
  );
}

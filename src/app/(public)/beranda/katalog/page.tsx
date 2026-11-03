import { Clock3 } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import {
  SieraEmpty,
  SieraHero,
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
} from "@/components/siera";
import { wibTodayRange } from "@/lib/format";
import { publicMenuImageUrl } from "@/lib/menu-image";
import { katalogDetail, ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { parseTourParams } from "@/lib/tour-journey";
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
  const t0 = Date.now();
  const { data, error } = await supabase
    .from("portions")
    .select(
      "id, quantity_remaining, cooked_at, expires_at, release_at, discount_price, menu_items!inner(name, normal_price, image_path), tenants!inner(name, location_note, is_listed)",
    )
    .eq("tenants.is_listed", true)
    .gt("expires_at", now.toISOString())
    .lte("release_at", now.toISOString())
    .order("expires_at", { ascending: true })
    .limit(60);
  // ponytail: log sementara Fase 1 ukur ms query; hapus sebelum Fase 2.
  console.log(`[ukur] katalog.portions ${Date.now() - t0}ms`);
  // Batas hari ini Asia/Jakarta → UTC (pola sama kayak dasbor tenant).
  const { dayStartUtc, dayEndIso } = wibTodayRange();
  let dayTotal = 0;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const t1 = Date.now();
    const { data: orders } = await supabase
      .from("orders")
      .select("quantity")
      .eq("student_id", user.id)
      .neq("status", "cancelled")
      .gte("created_at", dayStartUtc)
      .lt("created_at", dayEndIso);
    // ponytail: log sementara Fase 1 ukur ms query; hapus sebelum Fase 2.
    console.log(`[ukur] katalog.dayTotal ${Date.now() - t1}ms`);
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
  searchParams?: Promise<{ mode?: string; tour?: string; panduan?: string; langkah?: string }>;
}) {
  return KatalogPageBody(searchParams);
}

async function KatalogPageBody(
  searchParams?: Promise<{ mode?: string; tour?: string; panduan?: string; langkah?: string }>,
) {
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  const { portions, tenants, dayTotal } = await loadCatalog();
  const nowMs = Date.now();
  const urgent = portions
    .filter((p) => p.quantityRemaining > 0 && +new Date(p.expiresAt) - nowMs <= 60 * 60_000)
    .sort((a, b) => +new Date(a.expiresAt) - +new Date(b.expiresAt))
    .slice(0, 3);
  const urgentLabel = (expiresAt: string) => {
    const leftMin = Math.max(0, Math.floor((+new Date(expiresAt) - nowMs) / 60_000));
    return leftMin <= 5 ? "Segera ambil" : `Sisa ${leftMin} mnt`;
  };
  return (
    <>
      <AppHeader
        title="Katalog"
        trail={[{ label: "Beranda", href: ROUTES.beranda }, { label: "Katalog" }]}
      />
      <SieraRailPage
        asideLabel="Segera habis"
        main={
          <>
            <SieraHero eyebrow="Katalog sore ini" title="Porsi hari ini">
              Sisa dagangan yang masih layak makan. Jam masaknya tertulis jelas, bayar langsung di
              tempat. Maksimal 2 porsi per hari.
            </SieraHero>
            <Suspense fallback={<LoadingSkeleton variant="catalog-list" />}>
              <KatalogList
                portions={portions}
                tenants={tenants}
                dayTotal={dayTotal}
                tourForced={tourForced}
                tourJourney={tourJourney}
                tourEntry={tourEntry}
              />
            </Suspense>
          </>
        }
        aside={
          <div className="hidden min-w-0 flex-col gap-4 lg:gap-5 xl:flex">
            <SieraSection label="Segera habis">
              {urgent.length === 0 ? (
                <SieraEmpty
                  compact
                  title="Belum ada yang mepet."
                  hint="Semua porsi masih di atas 60 menit."
                />
              ) : (
                <SieraList aria-label="Porsi segera habis">
                  {urgent.map((p) => (
                    <SieraRowLink
                      key={p.id}
                      href={katalogDetail(p.id)}
                      icon={Clock3}
                      title={p.menuName}
                      subtitle={`${p.tenantName} · ${urgentLabel(p.expiresAt)}`}
                    />
                  ))}
                </SieraList>
              )}
            </SieraSection>
          </div>
        }
      />
    </>
  );
}

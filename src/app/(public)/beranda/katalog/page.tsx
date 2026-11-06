import { cn } from "cn";
import { Check, Clock3 } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  sieraCardClass,
} from "@/components/siera";
import { MAX_PORTIONS_PER_DAY } from "@/lib/domain/constants";
import { formatSisaMenit, wibTodayRange } from "@/lib/format";
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
    return leftMin <= 5 ? "Segera ambil" : `Sisa ${formatSisaMenit(leftMin)}`;
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
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#1C2826]">
                Porsi hari ini
              </h1>
              <p className="text-[15px] leading-normal text-[#64746B]">
                Sisa dagangan yang masih layak makan. Jam masaknya tertulis jelas, bayar langsung di
                tempat.
              </p>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
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
            {urgent.length === 0 ? (
              <div className={cn(sieraCardClass, "flex flex-col gap-2 p-6")}>
                <h2 className="text-xs font-bold tracking-[0.08em] text-[#64746B] uppercase">
                  Segera habis
                </h2>
                <p className="mt-1 text-base font-bold text-[#1C2826]">Belum ada yang mepet</p>
                <p className="text-sm leading-normal text-[#64746B]">
                  Semua porsi masih di atas 60 menit.
                </p>
              </div>
            ) : (
              <SieraSection label="Segera habis">
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
              </SieraSection>
            )}
            <div className="flex flex-col gap-3 rounded-[20px] border border-[#BFE3CF] bg-[#EAF5ED] p-6">
              <h2 className="text-xs font-bold tracking-[0.08em] text-[#1E5A36] uppercase">
                Aturan singkat
              </h2>
              {[
                `Maksimal ${MAX_PORTIONS_PER_DAY} porsi per hari.`,
                "Tunjukkan QR saat ambil, bayar di tempat.",
                "Jam masak tertulis di tiap porsi.",
              ].map((rule) => (
                <p
                  key={rule}
                  className="flex items-start gap-3 text-sm leading-normal text-[#2F4037]"
                >
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-[#2E7D4F]"
                    strokeWidth={1.9}
                    aria-hidden
                  />
                  <span>{rule}</span>
                </p>
              ))}
            </div>
          </div>
        }
      />
    </>
  );
}

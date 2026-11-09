import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { SieraList, SieraRailPage, SieraRowLink, SieraSection } from "@/components/siera";
import { MenuListSkeleton } from "@/components/ui/skeleton-blocks";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams } from "@/lib/tour-journey";
import { requireOwnTenant } from "../guard";
import { MenuManager } from "./menu-manager";

export const metadata: Metadata = { title: "Menu Saya" };

/** Daftar menu milik tenant + dialog tambah/edit via RPC upsert_menu_item. */

export interface MenuItemRow {
  id: string;
  name: string;
  normalPrice: number;
  avgWeightGrams: number | null;
  isActive: boolean;
  ingredients: string | null;
  allergenNote: string | null;
  imagePath: string | null;
  saleConditions: string | null;
  photoPath: string | null;
}

async function loadMenu(tenantId: string): Promise<MenuItemRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, name, normal_price, avg_weight_grams, is_active, ingredients, allergen_note, image_path, sale_conditions, photo_path",
    )
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });
  if (error || !data) return [];
  return data.map((m) => ({
    id: m.id,
    name: m.name,
    normalPrice: m.normal_price,
    avgWeightGrams: (m.avg_weight_grams as number | null) ?? null,
    isActive: m.is_active,
    ingredients: (m.ingredients as string | null) ?? null,
    allergenNote: (m.allergen_note as string | null) ?? null,
    imagePath: (m.image_path as string | null) ?? null,
    saleConditions: (m.sale_conditions as string | null) ?? null,
    photoPath: (m.photo_path as string | null) ?? null,
  }));
}

/** 1 query kecil: order 7 hari terakhir (pickup + reservasi), agregat di memori. */
async function loadMenuPerf(tenantId: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("status, quantity, portions!inner(tenant_id, menu_item_id)")
    .eq("portions.tenant_id", tenantId)
    .gte("created_at", since)
    .limit(200);
  const pickedByMenu: Record<string, number> = {};
  for (const o of (data ?? []) as unknown as Array<Record<string, unknown>>) {
    if (o.status !== "picked_up") continue;
    const portion = o.portions as { menu_item_id: string } | null;
    if (!portion) continue;
    const id = String(portion.menu_item_id);
    pickedByMenu[id] = (pickedByMenu[id] ?? 0) + Number(o.quantity);
  }
  return pickedByMenu;
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const tenant = await requireOwnTenant("/tenant/menu-saya");
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  return (
    <>
      <AppHeader
        title="Menu Kantin"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Menu Kantin" }]}
      />
      <Suspense fallback={<MenuListSkeleton />}>
        <MenuBody
          tenantId={tenant.id}
          tenantName={tenant.name}
          tourForced={tourForced}
          tourJourney={tourJourney}
          tourEntry={tourEntry}
        />
      </Suspense>
    </>
  );
}

async function MenuBody({
  tenantId,
  tenantName,
  tourForced,
  tourJourney,
  tourEntry,
}: {
  tenantId: string;
  tenantName: string;
  tourForced: boolean;
  tourJourney: boolean;
  tourEntry: number | null;
}) {
  const hour = new Date().getHours();
  const greet =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 19
          ? "Selamat sore"
          : "Selamat malam";
  const [items, pickedByMenu] = await Promise.all([loadMenu(tenantId), loadMenuPerf(tenantId)]);
  const ranked = items
    .map((m) => ({ ...m, picked: pickedByMenu[m.id] ?? 0 }))
    .sort((a, b) => b.picked - a.picked)
    .slice(0, 3)
    .filter((r) => r.picked > 0);
  return (
    <SieraRailPage
      asideLabel="Performa per menu"
      main={
        <>
          <div id="tour-hero" className="flex flex-col gap-2">
            <p className="text-[13px] font-bold text-[#2E7D4F]">MENU KANTIN</p>
            <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl leading-[1.2] font-extrabold tracking-[-0.02em] text-[#1C2826]">
              {greet}, {tenantName}
            </h1>
            <p className="text-[15px] leading-normal text-[#64746B]">
              Daftar menu yang bisa diposting sebagai porsi sisa. Harga diskon disarankan otomatis
              saat posting.
            </p>
          </div>
          <MenuManager items={items} />
          <GuidedTour
            tourKey="tenant-menu"
            forced={tourForced}
            journey={tourJourney}
            next={tourJourney ? (getJourneyNext("/tenant/menu-saya") ?? undefined) : undefined}
            journeyLabel="Bagian 1 dari 5 · Menu"
            entryStep={tourEntry}
            intro={{
              title: "Kelola menu?",
              body: "Daftarkan menu sekali, pakai berkali-kali tiap posting porsi.",
            }}
            steps={[
              {
                target: '[data-tour="tambah-menu"]',
                title: "Tambah menu",
                body: "Nama, harga normal, bahan, dan alergen. Harga diskon disarankan otomatis.",
              },
              {
                target: '[data-tour="menu-list"] li:first-child',
                title: "Daftar menumu",
                body: "Ketuk Edit buat ubah harga atau nonaktifkan menu yang lagi libur.",
              },
            ]}
          />
        </>
      }
      aside={
        <SieraSection id="menu-perf-heading" label="Performa 7 hari">
          {ranked.length === 0 ? (
            <p className="px-1 text-[13px] leading-relaxed text-[#64746B]">
              Belum ada pickup 7 hari terakhir. Posting porsi biar menu mulai jalan.
            </p>
          ) : (
            <SieraList>
              {ranked.map((r) => (
                <SieraRowLink
                  key={r.id}
                  href={ROUTES.tenantPorsiTambah}
                  icon={TrendingUp}
                  title={`${r.name} · ${r.picked} pickup`}
                  subtitle="Posting lagi dari menu ini"
                />
              ))}
            </SieraList>
          )}
        </SieraSection>
      }
    />
  );
}

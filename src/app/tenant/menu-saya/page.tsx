import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { SieraTenantHeader } from "@/components/siera";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../guard";
import { MenuManager } from "./menu-manager";

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
}

async function loadMenu(tenantId: string): Promise<MenuItemRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, name, normal_price, avg_weight_grams, is_active, ingredients, allergen_note, image_path",
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
  }));
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const tenant = await requireOwnTenant("/tenant/menu-saya");
  const sp = (await searchParams) ?? {};
  const tourForced = sp.mode === "onboarding";
  const items = await loadMenu(tenant.id);
  return (
    <>
      <AppHeader
        title="Menu Kantin"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Menu Kantin" }]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        <SieraTenantHeader kicker="MENU KANTIN" title="Menu saya">
          Daftar menu yang bisa diposting sebagai porsi sisa. Harga diskon disarankan otomatis saat
          posting.
        </SieraTenantHeader>
        <MenuManager items={items} tenantId={tenant.id} />
        <GuidedTour
          tourKey="tenant-menu"
          forced={tourForced}
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
      </div>
    </>
  );
}

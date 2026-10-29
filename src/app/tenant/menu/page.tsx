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

export default async function MenuPage() {
  const tenant = await requireOwnTenant("/tenant/menu");
  const items = await loadMenu(tenant.id);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">MENU KANTIN</p>
        <h1 className="text-3xl font-bold">Menu saya</h1>
        <p className="text-muted-foreground">
          Daftar menu yang bisa diposting sebagai porsi sisa. Harga diskon disarankan otomatis saat
          posting.
        </p>
      </div>
      <MenuManager items={items} tenantId={tenant.id} />
    </div>
  );
}

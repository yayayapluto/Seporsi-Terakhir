import { GuidedTour } from "@/components/guided-tour";
import { SieraTenantHeader } from "@/components/siera";
import { SELL_WINDOW_DEFAULT_MINUTES } from "@/lib/domain/constants";
import { suggestDiscountPrice } from "@/lib/domain/pricing";
import { nowInWib } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../guard";
import { PortionForm, type PortionFormMenu } from "./portion-form";

function defaultCookedLocal(): string {
  // Sekarang WIB, dibulatkan ke 5 menit; datetime-local tanpa offset (WIB).
  const now = nowInWib();
  now.setSeconds(0, 0);
  now.setMinutes(Math.floor(now.getMinutes() / 5) * 5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Isi FormSheet tambah porsi — load persis tambah/page.tsx:37-65. */
export default async function TambahSheet() {
  const tenant = await requireOwnTenant("/tenant/porsi/tambah");
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_items")
    .select("id, name, normal_price")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("name", { ascending: true });
  const menus: PortionFormMenu[] = (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    normalPrice: m.normal_price,
  }));
  const cookedAtLocal = defaultCookedLocal();
  const firstPrice = menus[0]?.normalPrice ?? 0;
  const { data: last } = await supabase
    .from("portions")
    .select("menu_item_id, quantity_posted, sell_window_minutes, discount_price")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const yesterday =
    last != null
      ? {
          menuItemId: last.menu_item_id,
          quantity: last.quantity_posted,
          sellWindowMinutes: last.sell_window_minutes,
          discountPrice: last.discount_price,
        }
      : null;
  return (
    <PortionForm
      tenantName={tenant.name}
      menus={menus}
      yesterday={yesterday}
      initial={{
        menuItemId: "",
        quantity: 1,
        cookedAtLocal,
        sellWindowMinutes: SELL_WINDOW_DEFAULT_MINUTES,
        releaseAtLocal: "",
        discountPrice: firstPrice > 1 ? (suggestDiscountPrice(firstPrice) ?? 0) : 0,
        normalPrice: firstPrice,
      }}
    />
  );
}

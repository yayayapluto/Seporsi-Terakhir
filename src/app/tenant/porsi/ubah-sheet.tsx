import { notFound } from "next/navigation";
import { SELL_WINDOW_DEFAULT_MINUTES } from "@/lib/domain/constants";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../guard";
import { PortionForm, type PortionFormMenu } from "./portion-form";

/** Isi FormSheet ubah porsi — load persis [portionId]/ubah/page.tsx. */
export default async function UbahSheet({ portionId }: { portionId: string }) {
  const tenant = await requireOwnTenant("/tenant/porsi/ubah");
  const supabase = await createClient();
  const { data } = await supabase
    .from("portions")
    .select(
      "id, menu_item_id, quantity_posted, quantity_remaining, cooked_at, sell_window_minutes, release_at, discount_price, menu_items!inner(normal_price, tenant_id)",
    )
    .eq("id", portionId)
    .single();
  const mi = data?.menu_items as unknown as { normal_price: number; tenant_id: string } | null;
  if (!data || !mi || mi.tenant_id !== tenant.id) notFound();
  const normalPrice = mi.normal_price;

  const menusRes = await supabase
    .from("menu_items")
    .select("id, name, normal_price, is_active")
    .eq("tenant_id", tenant.id)
    .or(`is_active.eq.true,id.eq.${data.menu_item_id}`)
    .order("name", { ascending: true });
  const menus: PortionFormMenu[] = (menusRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    normalPrice: m.normal_price,
    isActive: m.is_active,
  }));

  // datetime-local WIB butuh "YYYY-MM-DDTHH:MM"; sv-SE kasih spasi → ganti T, potong detik.
  const toLocalInput = (iso: string) =>
    new Date(iso)
      .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
      .replace(" ", "T")
      .slice(0, 16);
  const cookedAtLocal = toLocalInput(data.cooked_at);
  const releaseAtLocal = data.release_at ? toLocalInput(data.release_at) : "";

  return (
    <PortionForm
      tenantName={tenant.name}
      menus={menus}
      initial={{
        portionId: data.id,
        menuItemId: data.menu_item_id,
        quantity: data.quantity_posted,
        cookedAtLocal,
        sellWindowMinutes: data.sell_window_minutes ?? SELL_WINDOW_DEFAULT_MINUTES,
        releaseAtLocal,
        discountPrice: data.discount_price,
        normalPrice,
      }}
    />
  );
}

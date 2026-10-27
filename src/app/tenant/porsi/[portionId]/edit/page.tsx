import { notFound } from "next/navigation";
import { SELL_WINDOW_DEFAULT_MINUTES } from "@/lib/domain/constants";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../../../guard";
import { PortionForm, type PortionFormMenu } from "../../portion-form";

/** Edit porsi milik sendiri: jam masak, jendela jual, harga diskon, quantity. */

export default async function EditPorsiPage({
  params,
}: {
  params: Promise<{ portionId: string }>;
}) {
  const tenant = await requireOwnTenant("/tenant/porsi/edit");
  const { portionId } = await params;
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
    .select("id, name, normal_price")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("name", { ascending: true });
  const menus: PortionFormMenu[] = (menusRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    normalPrice: m.normal_price,
  }));

  // datetime-local WIB: tampilan = waktu Jakarta (kolom timestamptz → +07:00).
  const cookedAtLocal = new Date(data.cooked_at).toLocaleString("sv-SE", {
    timeZone: "Asia/Jakarta",
  });
  const releaseAtLocal = data.release_at
    ? new Date(data.release_at).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
    : "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">POSTING PORSI</p>
        <h1 className="text-3xl font-bold">Edit porsi</h1>
        <p className="text-muted-foreground">
          Sisa {data.quantity_remaining} dari {data.quantity_posted} porsi belum terpesan.
        </p>
      </div>
      <PortionForm
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
    </div>
  );
}

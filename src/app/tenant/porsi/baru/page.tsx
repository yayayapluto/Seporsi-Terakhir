import { SELL_WINDOW_DEFAULT_MINUTES } from "@/lib/domain/constants";
import { suggestDiscountPrice } from "@/lib/domain/pricing";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../../guard";
import { PortionForm, type PortionFormMenu } from "../portion-form";

/** Posting porsi baru: pilih menu, jam masak, jendela jual, harga diskon. */

function defaultCookedLocal(): string {
  // Sekarang WIB, dibulatkan ke 5 menit; datetime-local tanpa offset (WIB).
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  now.setSeconds(0, 0);
  now.setMinutes(Math.floor(now.getMinutes() / 5) * 5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default async function PorsiBaruPage() {
  const tenant = await requireOwnTenant("/tenant/porsi/baru");
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
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">POSTING PORSI</p>
        <h1 className="text-3xl font-bold">Tambah porsi</h1>
        <p className="text-muted-foreground">
          Unggah sisa masakan hari ini. Porsi kedaluwarsa otomatis keluar dari katalog.
        </p>
      </div>
      <PortionForm
        menus={menus}
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
    </div>
  );
}

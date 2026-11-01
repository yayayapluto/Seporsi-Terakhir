import { GuidedTour } from "@/components/guided-tour";
import { SieraTenantHeader } from "@/components/siera";
import { SELL_WINDOW_DEFAULT_MINUTES } from "@/lib/domain/constants";
import { suggestDiscountPrice } from "@/lib/domain/pricing";
import { nowInWib } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams } from "@/lib/tour-journey";
import { requireOwnTenant } from "../../guard";
import { PortionForm, type PortionFormMenu } from "../portion-form";

/** Posting porsi baru: pilih menu, jam masak, jendela jual, harga diskon. */

function defaultCookedLocal(): string {
  // Sekarang WIB, dibulatkan ke 5 menit; datetime-local tanpa offset (WIB).
  const now = nowInWib();
  now.setSeconds(0, 0);
  now.setMinutes(Math.floor(now.getMinutes() / 5) * 5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default async function PorsiBaruPage({
  searchParams,
}: {
  searchParams?: Promise<{
    mode?: string;
    tour?: string;
    panduan?: string;
    langkah?: string;
    fresh?: string;
  }>;
}) {
  const tenant = await requireOwnTenant("/tenant/porsi/baru");
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <SieraTenantHeader kicker="POSTING PORSI" title="Tambah porsi">
        Unggah sisa masakan hari ini. Porsi kedaluwarsa otomatis keluar dari katalog.
      </SieraTenantHeader>
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
      <GuidedTour
        tourKey="tenant-porsi"
        forced={tourForced}
        journey={tourJourney}
        next={tourJourney ? (getJourneyNext("/tenant/porsi/baru") ?? undefined) : undefined}
        journeyLabel="Bagian 3 dari 5 · Porsi"
        entryStep={tourEntry}
        fresh={sp.fresh === "1"}
        userId={tenant.id}
        intro={{
          title: "Posting porsi?",
          body: "Tiga langkah: pilih menu, isi jumlah dan jam masak, harga diskon tersugesti otomatis.",
        }}
        steps={[
          {
            target: "#portion-menu",
            title: "Pilih menu",
            body: "Dari daftar yang sudah kamu daftarkan. Belum ada? Daftarkan dulu di halaman Menu.",
          },
          {
            target: "#portion-qty",
            title: "Jumlah dan jam",
            body: "Berapa porsi sisa dan kapan dimasak — jendela jual dihitung dari jam ini.",
          },
          {
            target: 'button[type="submit"]',
            title: "Terbitkan",
            body: "Porsi tayang di katalog. Yang kedaluwarsa keluar sendiri, tanpa perlu dihapus.",
          },
        ]}
      />
    </div>
  );
}

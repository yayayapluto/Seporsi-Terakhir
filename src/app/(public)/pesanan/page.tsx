import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { SieraHero } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams } from "@/lib/tour-journey";
import { OrdersList } from "./pesanan-list";

export interface MyOrder {
  orderId: string;
  status: string;
  quantity: number;
  createdAt: string;
  pickedUpAt: string | null;
  normalPriceSnapshot: number;
  discountPriceSnapshot: number;
  menuName: string;
  tenantName: string;
  tenantLocation: string | null;
}

async function loadOrders(): Promise<{ orders: MyOrder[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("my_orders")) as {
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  };
  if (error) return { orders: [], error: "Gagal memuat pesanan. Coba lagi." };
  return {
    orders: (data ?? []).map((o) => ({
      orderId: String(o.order_id),
      status: String(o.status),
      quantity: Number(o.quantity),
      createdAt: String(o.created_at),
      pickedUpAt: (o.picked_up_at as string | null) ?? null,
      normalPriceSnapshot: Number(o.normal_price_snapshot),
      discountPriceSnapshot: Number(o.discount_price_snapshot),
      menuName: String(o.menu_name),
      tenantName: String(o.tenant_name),
      tenantLocation: (o.tenant_location as string | null) ?? null,
    })),
    error: null,
  };
}

export default async function PesananPage({
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
  const { user } = await requireRole("/pesanan", "student");
  const { orders, error } = await loadOrders();
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  return (
    <>
      <AppHeader title="Pesanan" />
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-6 px-4 py-6 lg:max-w-6xl lg:px-8">
        <SieraHero eyebrow="Riwayat & aktif" title="Pesanan saya">
          Porsi yang kamu kunci. Tunjukkan QR saat ambil, bayar di tempat.
        </SieraHero>
        <OrdersList orders={orders} loadError={error} />
      </div>
      <GuidedTour
        tourKey="pesanan"
        forced={tourForced}
        auto={false}
        journey={tourJourney}
        userId={user.id}
        fresh={sp.fresh === "1"}
        entryStep={tourEntry}
        next={tourJourney ? (getJourneyNext("/pesanan") ?? undefined) : undefined}
        journeyLabel="Bagian 3 dari 4 · Pesanan"
        intro={{
          title: "Lacak pesananmu?",
          body: "Semua porsi yang kamu kunci ada di sini. Saring status, buka QR, atau batalkan bila berubah pikiran.",
        }}
        steps={[
          {
            target: '[data-tour="order-filter"]',
            title: "Saring status",
            body: "Pisahkan yang menunggu pickup, sudah selesai, atau dibatalkan.",
          },
          {
            target: '[data-tour="order-list"] li:first-child',
            title: "Satu pesanan",
            body: "Buka QR pickup, lihat detail, atau batalkan selagi masih menunggu.",
          },
        ]}
      />
    </>
  );
}

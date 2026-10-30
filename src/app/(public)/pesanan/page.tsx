import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

export default async function PesananPage() {
  await requireRole("/pesanan", "student");
  const { orders, error } = await loadOrders();
  return (
    <>
      <AppHeader title="Pesanan" />
      <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:pb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-[#1C2826] md:text-2xl">
            Pesanan saya
          </h1>
          <p className="text-sm text-[#64746B]">
            Riwayat porsi yang kamu kunci. Tunjukkan QR saat pickup, bayar di tempat.
          </p>
        </div>
        <OrdersList orders={orders} loadError={error} />
      </div>
    </>
  );
}

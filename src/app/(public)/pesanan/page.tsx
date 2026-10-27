import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OrdersList } from "./pesanan-list";

/** Riwayat pesanan student via RPC my_orders (RLS portions_read menyembunyikan sebagian baris). */

export interface MyOrder {
  orderId: string;
  status: string;
  quantity: number;
  createdAt: string;
  slotStart: string | null;
  slotEnd: string | null;
  pickedUpAt: string | null;
  normalPriceSnapshot: number;
  discountPriceSnapshot: number;
  menuName: string;
  tenantName: string;
  tenantLocation: string | null;
}

async function loadOrders(): Promise<{ orders: MyOrder[]; error: string | null }> {
  const supabase = await createClient();
  const { data } = (await supabase.rpc("my_orders")) as {
    data: Array<Record<string, unknown>> | null;
  };
  return {
    orders: (data ?? []).map((o) => ({
      orderId: String(o.order_id),
      status: String(o.status),
      quantity: Number(o.quantity),
      createdAt: String(o.created_at),
      slotStart: (o.slot_start as string | null) ?? null,
      slotEnd: (o.slot_end as string | null) ?? null,
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">PESANANKU</p>
        <h1 className="text-3xl font-bold">Pesanan saya</h1>
        <p className="text-muted-foreground">
          Riwayat porsi yang kamu kunci. Tunjukkan QR saat pickup, bayar di tempat.
        </p>
      </div>
      <OrdersList orders={orders} loadError={error} />
    </div>
  );
}

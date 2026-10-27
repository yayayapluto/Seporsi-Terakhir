import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { QrPanel } from "./qr-panel";

/**
 * Detail satu pesanan student. my_orders tidak membawa pickup_token — token
 * diambil via select orders (RLS: hanya row milik sendiri), dirender hanya
 * sebagai QR value, tidak pernah sebagai teks/URL.
 */

export interface OrderDetail {
  orderId: string;
  status: string;
  quantity: number;
  createdAt: string;
  slotStart: string | null;
  slotEnd: string | null;
  pickedUpAt: string | null;
  normalPriceSnapshot: number;
  discountPriceSnapshot: number;
  avgWeightSnapshot: number | null;
  menuName: string;
  tenantName: string;
  tenantLocation: string | null;
  portionId: string;
}

async function loadOrder(orderId: string) {
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("my_orders")) as {
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  };
  if (error || !data) notFound();
  const row = data.find((o) => String(o.order_id) === orderId);
  if (!row) notFound();
  const order: OrderDetail = {
    orderId: String(row.order_id),
    status: String(row.status),
    quantity: Number(row.quantity),
    createdAt: String(row.created_at),
    slotStart: (row.slot_start as string | null) ?? null,
    slotEnd: (row.slot_end as string | null) ?? null,
    pickedUpAt: (row.picked_up_at as string | null) ?? null,
    normalPriceSnapshot: Number(row.normal_price_snapshot),
    discountPriceSnapshot: Number(row.discount_price_snapshot),
    avgWeightSnapshot: (row.avg_weight_snapshot as number | null) ?? null,
    menuName: String(row.menu_name),
    tenantName: String(row.tenant_name),
    tenantLocation: (row.tenant_location as string | null) ?? null,
    portionId: String(row.portion_id),
  };
  // Token hanya untuk pesanan aktif; select dibatasi row sendiri (RLS orders_read).
  let pickupToken: string | null = null;
  if (order.status === "reserved") {
    const { data: tokenRow } = await supabase
      .from("orders")
      .select("pickup_token")
      .eq("id", orderId)
      .single();
    pickupToken = (tokenRow?.pickup_token as string | undefined) ?? null;
  }
  return { order, pickupToken };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium">{children}</dd>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireRole("/pesanan", "student");
  const { orderId } = await params;
  if (!z.string().uuid().safeParse(orderId).success) notFound();
  const { order, pickupToken } = await loadOrder(orderId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">PESANANKU</p>
        <h1 className="text-3xl font-bold">
          {order.menuName} <span className="text-muted-foreground">× {order.quantity}</span>
        </h1>
        <p className="text-muted-foreground">
          {order.tenantName}
          {order.tenantLocation ? ` · ${order.tenantLocation}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <OrderStatusBadge status={order.status} />
        {order.pickedUpAt && (
          <span className="text-sm text-muted-foreground">
            Diambil {formatDateTimeWIB(new Date(order.pickedUpAt))} WIB
          </span>
        )}
      </div>

      {order.status === "reserved" && (
        <QrPanel
          menuName={order.menuName}
          slotStart={order.slotStart}
          slotEnd={order.slotEnd}
          pickupToken={pickupToken}
        />
      )}
      {order.status !== "reserved" && (
        <div className="rounded-lg border bg-muted/40 p-5 text-sm">
          {order.status === "picked_up" ? (
            <p>
              Pesanan selesai. Terima kasih sudah menyelamatkan porsi ini — total{" "}
              <span className="font-semibold">
                {formatIDR(order.discountPriceSnapshot * order.quantity)}
              </span>{" "}
              dibayar di tempat saat pickup.
            </p>
          ) : (
            <p>Pesanan dibatalkan. Stok porsi dikembalikan ke katalog.</p>
          )}
        </div>
      )}

      <dl className="divide-y divide-border border-b">
        <Row label="Waktu pesan">{formatDateTimeWIB(new Date(order.createdAt))} WIB</Row>
        {order.slotStart && order.slotEnd && (
          <Row label="Slot pickup">
            {formatDateTimeWIB(new Date(order.slotStart))} –{" "}
            {formatDateTimeWIB(new Date(order.slotEnd))} WIB
          </Row>
        )}
        <Row label="Harga normal">
          <s className="font-normal text-muted-foreground">
            {formatIDR(order.normalPriceSnapshot * order.quantity)}
          </s>
        </Row>
        <Row label="Total bayar di tempat">
          <span className="font-bold">
            {formatIDR(order.discountPriceSnapshot * order.quantity)}
          </span>
        </Row>
      </dl>

      <div className="flex flex-wrap gap-3">
        {order.status === "reserved" && (
          <Link
            href="/pesanan"
            className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
          >
            Semua pesanan
          </Link>
        )}
        {order.status !== "reserved" && (
          <Link
            href="/katalog"
            className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
          >
            Lihat katalog
          </Link>
        )}
      </div>
    </div>
  );
}

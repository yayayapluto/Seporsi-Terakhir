import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { OrderLiveStatus } from "../order-live-status";
import { CancelButton } from "./cancel-button";
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
  cookedAt: string | null;
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
    cookedAt: (row.cooked_at as string | null) ?? null,
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
    <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-sm font-semibold text-muted-foreground sm:w-40">{label}</dt>
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
      {order.status === "reserved" && <OrderLiveStatus orderIds={[order.orderId]} />}
      <Link
        href="/pesanan"
        className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Semua pesanan
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          {order.menuName} <span className="text-muted-foreground">× {order.quantity}</span>
        </h1>
        <p className="text-muted-foreground">
          {order.tenantName}
          {order.tenantLocation ? ` · ${order.tenantLocation}` : ""}
          {order.avgWeightSnapshot != null && ` · ±${order.avgWeightSnapshot} g/porsi`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <OrderStatusBadge status={order.status} />
        {order.pickedUpAt && (
          <span className="text-sm text-muted-foreground">
            Diambil {formatDateTimeWIB(new Date(order.pickedUpAt))} WIB · {order.quantity} porsi
            diselamatkan
          </span>
        )}
      </div>
      {order.status === "reserved" && (
        <QrPanel
          menuName={order.menuName}
          tenantName={order.tenantName}
          totalPrice={order.discountPriceSnapshot * order.quantity}
          tenantLocation={order.tenantLocation}
          pickupToken={pickupToken}
        />
      )}
      {order.status === "picked_up" && (
        <output className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
          >
            ✓
          </span>
          <div>
            <p className="font-bold">Pesanan selesai — selamat menikmati!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Total{" "}
              <span className="font-semibold text-foreground">
                {formatIDR(order.discountPriceSnapshot * order.quantity)}
              </span>{" "}
              dibayar tunai di tempat saat pickup.
            </p>
          </div>
        </output>
      )}
      {order.status === "cancelled" && (
        <div className="rounded-lg border bg-muted/40 p-5 text-sm">
          <p>
            Pesanan dibatalkan. Stok porsi dikembalikan ke katalog.{" "}
            <Link
              href="/katalog"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Cari porsi lain
            </Link>
            .
          </p>
        </div>
      )}

      <dl className="divide-y divide-border border-b">
        {order.cookedAt && (
          <Row label="Dimasak">{formatDateTimeWIB(new Date(order.cookedAt))} WIB</Row>
        )}
        <Row label="Harga normal">
          <del className="font-normal text-muted-foreground">
            <span className="sr-only">Harga awal: </span>
            {formatIDR(order.normalPriceSnapshot * order.quantity)}
          </del>
        </Row>
        <Row label="Total bayar di tempat">
          <span className="text-lg font-bold">
            {formatIDR(order.discountPriceSnapshot * order.quantity)}
          </span>
        </Row>
        <Row label="Waktu pesan">{formatDateTimeWIB(new Date(order.createdAt))} WIB</Row>
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        {order.status === "reserved" && (
          <>
            <Link href="/katalog" className={buttonVariants()}>
              Lihat katalog
            </Link>
            <CancelButton orderId={order.orderId} />
          </>
        )}
        {order.status === "picked_up" && (
          <>
            <Link href={`/katalog/${order.portionId}`} className={buttonVariants()}>
              Pesan lagi
            </Link>
            <Link href="/katalog" className={buttonVariants({ variant: "outline" })}>
              Lihat katalog
            </Link>
          </>
        )}
        {order.status === "cancelled" && (
          <Link href="/katalog" className={buttonVariants()}>
            Lihat katalog
          </Link>
        )}
      </div>
    </div>
  );
}

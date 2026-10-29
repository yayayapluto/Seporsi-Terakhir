import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../../guard";
import { TenantCancelButton } from "./cancel-button";

/** Detail satu pesanan milik tenant: isi order + siapa pemesan + riwayatnya. */

interface TenantOrderDetail {
  orderId: string;
  status: "reserved" | "picked_up" | "cancelled";
  quantity: number;
  createdAt: string;
  pickedUpAt: string | null;
  slotStart: string | null;
  slotEnd: string | null;
  cookedAt: string | null;
  normalPriceSnapshot: number;
  discountPriceSnapshot: number;
  menuName: string;
  buyerName: string;
  buyerPickups: number;
  buyerCancelled: number;
}

async function loadDetail(orderId: string): Promise<TenantOrderDetail> {
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("tenant_order_detail", {
    p_order_id: orderId,
  })) as { data: Record<string, unknown>[] | null; error: unknown };
  if (error || !data || data.length === 0) notFound();
  const [r] = data;
  if (!r) notFound();
  return {
    orderId: String(r.order_id),
    status: r.status as TenantOrderDetail["status"],
    quantity: Number(r.quantity),
    createdAt: String(r.created_at),
    pickedUpAt: r.picked_up_at == null ? null : String(r.picked_up_at),
    slotStart: r.slot_start == null ? null : String(r.slot_start),
    slotEnd: r.slot_end == null ? null : String(r.slot_end),
    cookedAt: r.cooked_at == null ? null : String(r.cooked_at),
    normalPriceSnapshot: Number(r.normal_price_snapshot),
    discountPriceSnapshot: Number(r.discount_price_snapshot),
    menuName: String(r.menu_name),
    buyerName: String(r.buyer_name),
    buyerPickups: Number(r.buyer_pickups),
    buyerCancelled: Number(r.buyer_cancelled),
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-semibold sm:max-w-[60%]">{children}</dd>
    </div>
  );
}

export default async function TenantOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwnTenant("/tenant/pesanan");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const o = await loadDetail(id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/tenant/pesanan"
        className="inline-flex min-h-11 w-fit items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Semua pesanan
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">RESERVASI</p>
        <h1 className="text-3xl font-bold">
          {o.menuName} <span className="text-muted-foreground">× {o.quantity}</span>
        </h1>
        <p className="text-muted-foreground">
          Dipesan {o.buyerName} · {formatDateTimeWIB(new Date(o.createdAt))} WIB
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <OrderStatusBadge status={o.status} />
        {o.status === "picked_up" && o.pickedUpAt && (
          <span className="text-sm text-muted-foreground">
            Diambil {formatDateTimeWIB(new Date(o.pickedUpAt))} WIB
          </span>
        )}
      </div>

      <section aria-labelledby="pemesan-heading" className="rounded-xl border bg-card p-5">
        <h2 id="pemesan-heading" className="text-lg font-bold">
          Pemesan: {o.buyerName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {o.buyerPickups === 0 && o.buyerCancelled === 0 ? (
            "Pemesan baru — belum ada riwayat."
          ) : (
            <>
              {o.buyerPickups} pickup selesai · {o.buyerCancelled} batal
              {o.buyerCancelled >= 2 &&
                " · sering membatalkan — konfirmasi ulang saat serah terima"}
            </>
          )}
        </p>
      </section>

      <dl className="divide-y divide-border border-b">
        {o.cookedAt && <Row label="Dimasak">{formatDateTimeWIB(new Date(o.cookedAt))} WIB</Row>}
        {o.slotStart && o.slotEnd && (
          <Row label="Slot pickup">
            {formatDateTimeWIB(new Date(o.slotStart))} – {formatDateTimeWIB(new Date(o.slotEnd))}{" "}
            WIB
          </Row>
        )}
        <Row label="Harga normal">
          <s className="font-normal text-muted-foreground">
            {formatIDR(o.normalPriceSnapshot * o.quantity)}
          </s>
        </Row>
        <Row label="Total bayar di tempat">
          <span className="text-lg font-bold">
            {formatIDR(o.discountPriceSnapshot * o.quantity)}
          </span>
        </Row>
      </dl>

      {o.status === "reserved" && (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/tenant/scan" className={buttonVariants({ className: "min-h-11" })}>
            Scan pickup
          </Link>
          <TenantCancelButton orderId={o.orderId} />
        </div>
      )}
      {o.status !== "reserved" && (
        <p className="text-sm text-muted-foreground">
          {o.status === "picked_up"
            ? "Pesanan selesai. Pembayaran sudah diterima di tempat."
            : "Pesanan dibatalkan. Stok porsi dikembalikan ke katalog."}
        </p>
      )}
    </div>
  );
}

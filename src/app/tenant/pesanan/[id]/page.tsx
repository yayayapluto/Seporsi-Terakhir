import { History, QrCode, Timer, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  SieraStat,
  SieraStatStrip,
  sieraCardClass,
} from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { TenantOrderDetailSkeleton } from "@/components/ui/skeleton-blocks";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../../guard";
import { TenantPickupCountdown } from "../tenant-pickup-countdown";
import { TenantCancelButton } from "./cancel-button";
import { CopyTokenButton } from "./copy-token-button";

/** Detail satu pesanan milik tenant: isi order + siapa pemesan + riwayatnya. */

interface TenantOrderDetail {
  orderId: string;
  status: "reserved" | "picked_up" | "cancelled" | "unpicked";
  quantity: number;
  createdAt: string;
  pickedUpAt: string | null;
  cookedAt: string | null;
  pickupDeadlineAt: string | null;
  normalPriceSnapshot: number;
  discountPriceSnapshot: number;
  menuName: string;
  buyerName: string;
  buyerPickups: number;
  buyerCancelled: number;
  pickupToken: string | null;
  pickupCode: string | null;
  expiresAt: string | null;
  saleConditions: string | null;
}

async function loadDetail(orderId: string): Promise<TenantOrderDetail> {
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("tenant_order_detail", {
    p_order_id: orderId,
  })) as { data: Record<string, unknown>[] | null; error: unknown };
  if (error || !data || data.length === 0) notFound();
  const [r] = data;
  if (!r) notFound();
  // Syarat penjualan dari menu via join (RLS: tenant baca porsi+menu miliknya).
  let saleConditions: string | null = null;
  const { data: ord } = await supabase
    .from("orders")
    .select("portion_id")
    .eq("id", orderId)
    .maybeSingle();
  const pid = (ord as { portion_id?: string } | null)?.portion_id;
  if (pid) {
    const { data: pd } = await supabase
      .from("portions")
      .select("menu_items!inner(sale_conditions)")
      .eq("id", pid)
      .maybeSingle();
    const menu = (pd as { menu_items?: { sale_conditions: string | null } } | null)?.menu_items;
    saleConditions = menu?.sale_conditions ?? null;
  }
  return {
    orderId: String(r.order_id),
    status: r.status as TenantOrderDetail["status"],
    quantity: Number(r.quantity),
    createdAt: String(r.created_at),
    pickedUpAt: r.picked_up_at == null ? null : String(r.picked_up_at),
    cookedAt: r.cooked_at == null ? null : String(r.cooked_at),
    pickupDeadlineAt: r.pickup_deadline_at == null ? null : String(r.pickup_deadline_at),
    normalPriceSnapshot: Number(r.normal_price_snapshot),
    discountPriceSnapshot: Number(r.discount_price_snapshot),
    menuName: String(r.menu_name),
    buyerName: String(r.buyer_name),
    buyerPickups: Number(r.buyer_pickups),
    buyerCancelled: Number(r.buyer_cancelled),
    pickupToken: r.pickup_token == null ? null : String(r.pickup_token),
    pickupCode: r.pickup_code == null ? null : String(r.pickup_code),
    expiresAt: r.expires_at == null ? null : String(r.expires_at),
    saleConditions,
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

export default function TenantOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<TenantOrderDetailSkeleton />}>
      <TenantOrderDetailBody params={params} />
    </Suspense>
  );
}

async function TenantOrderDetailBody({ params }: { params: Promise<{ id: string }> }) {
  await requireOwnTenant("/tenant/pesanan");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const o = await loadDetail(id);

  const main = (
    <>
      <div className={`${sieraCardClass} flex flex-col gap-1 p-4`}>
        <p className="text-xs font-bold tracking-wide text-[#1E5A36]">RESERVASI</p>
        <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-xl leading-snug font-extrabold tracking-tight text-[#1C2826] lg:text-2xl">
          {o.menuName} × {o.quantity}
        </h1>
        <p className="text-sm text-[#1E5A36]">
          Dipesan {o.buyerName} · {formatDateTimeWIB(new Date(o.createdAt))} WIB
        </p>
        <p className="mt-1">
          <OrderStatusBadge status={o.status} />
          {o.status === "picked_up" && o.pickedUpAt && (
            <span className="ml-2 text-sm text-muted-foreground">
              Diambil {formatDateTimeWIB(new Date(o.pickedUpAt))} WIB
            </span>
          )}
        </p>
      </div>
      {o.status === "reserved" && o.pickupDeadlineAt && (
        <section
          aria-label="Batas waktu ambil"
          className="flex items-center gap-3 rounded-2xl border border-[#B45309]/20 bg-[#FEF3C7] p-4"
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B45309]"
          >
            <Timer className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1C2826]">
              Pembeli harus ambil dalam{" "}
              <TenantPickupCountdown deadlineIso={o.pickupDeadlineAt} className="tabular-nums" />
            </p>
            <p className="mt-0.5 text-[13px] text-[#92400E]">
              Lewat batas ini pesanan ditandai telat diambil dan porsi kembali ke katalog.
            </p>
          </div>
        </section>
      )}
      {o.expiresAt && (
        <section
          aria-label="Batas ambil"
          className="flex items-center gap-3 rounded-2xl border border-[#B45309]/20 bg-[#FEF3C7] p-4"
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B45309]"
          >
            <Timer className="size-5" />
          </span>
          <p className="text-sm font-semibold text-[#1C2826]">
            Ambil sebelum {formatDateTimeWIB(new Date(o.expiresAt))} WIB
          </p>
        </section>
      )}
      <section aria-labelledby="pemesan-heading" className={`${sieraCardClass} p-5 text-center`}>
        <h2 id="pemesan-heading" className="text-2xl font-bold">
          {o.buyerName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {o.buyerPickups === 0 && o.buyerCancelled === 0 ? (
            "Pemesan baru, belum ada riwayat."
          ) : (
            <>
              {o.buyerPickups} pickup selesai · {o.buyerCancelled} batal
              {o.buyerCancelled >= 2 && " · sering membatalkan, konfirmasi ulang saat serah terima"}
            </>
          )}
        </p>
      </section>
      <dl className={`${sieraCardClass} divide-y divide-dashed divide-line px-5`}>
        {o.cookedAt && <Row label="Dimasak">{formatDateTimeWIB(new Date(o.cookedAt))} WIB</Row>}
        <Row label="Harga/porsi">
          <span>
            <s className="mr-2 font-normal text-muted-foreground">
              {formatIDR(o.normalPriceSnapshot)}
            </s>
            {formatIDR(o.discountPriceSnapshot)}
          </span>
        </Row>
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
        {o.saleConditions && <Row label="Syarat penjualan">{o.saleConditions}</Row>}
      </dl>
      {o.status === "reserved" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/tenant/scan"
            className={buttonVariants({ className: "min-h-12 w-full text-[15px]" })}
          >
            Scan pickup
          </Link>
          <TenantCancelButton
            orderId={o.orderId}
            menuName={o.menuName}
            quantity={o.quantity}
            buyerName={o.buyerName}
          />
        </div>
      )}
      {o.status !== "reserved" && (
        <p className="text-sm text-muted-foreground">
          {o.status === "picked_up"
            ? "Pesanan selesai. Pembayaran sudah diterima di tempat."
            : "Pesanan dibatalkan. Stok porsi dikembalikan ke katalog."}
        </p>
      )}
    </>
  );

  const aside = (
    <>
      {o.pickupCode && (
        <SieraSection id="pickup-heading" label="Kode pickup">
          <div className={`${sieraCardClass} flex flex-col items-center gap-1 p-5 text-center`}>
            <SieraStat
              icon={QrCode}
              value={o.pickupCode}
              label="Ketik di Scan pickup bila kamera gagal"
            />
            <CopyTokenButton token={o.pickupCode} />
          </div>
        </SieraSection>
      )}
      <SieraSection id="riwayat-heading" label="Riwayat pemesan">
        <SieraStatStrip>
          <SieraStat icon={History} value={String(o.buyerPickups)} label="Selesai" />
          <SieraStat icon={UserRound} value={String(o.buyerCancelled)} label="Batal" />
          <SieraStat
            icon={Timer}
            value={`${o.quantity}×`}
            label={o.status === "reserved" ? "Menunggu" : "Porsi"}
          />
        </SieraStatStrip>
      </SieraSection>
      {o.status === "reserved" && (
        <SieraSection id="lanjut-heading" label="Langkah lanjut">
          <SieraList aria-label="Langkah lanjut">
            <SieraRowLink
              href="/tenant/scan"
              icon={QrCode}
              title="Scan pickup"
              subtitle="Konfirmasi serah terima di kasir"
            />
            <SieraRowLink
              href="/tenant/pesanan"
              icon={History}
              title="Kembali ke pesanan"
              subtitle="Lihat antrean pickup"
            />
          </SieraList>
        </SieraSection>
      )}
    </>
  );

  return (
    <>
      <AppHeader
        title={`${o.menuName} x ${o.quantity}`}
        trail={[
          { label: "Kantin", href: ROUTES.tenant },
          { label: "Pesanan", href: ROUTES.tenantPesanan },
          { label: `Detail ${o.menuName}` },
        ]}
      />
      <SieraRailPage main={main} asideLabel="Pelengkap detail pesanan" aside={aside} />
    </>
  );
}

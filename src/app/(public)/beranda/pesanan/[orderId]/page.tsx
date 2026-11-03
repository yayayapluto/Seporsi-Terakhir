import { cn } from "cn";
import { CalendarClock, Check, Clock3, Store, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  SieraField,
  SieraRailPage,
  SieraSection,
  SieraSectionTitle,
  SieraTile,
  sieraCardClass,
} from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { katalogDetail, ROUTES } from "@/lib/routes";
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

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  await requireRole(ROUTES.pesanan, "student");
  const { orderId } = await params;
  const sp = (await searchParams) ?? {};
  const tourForced = sp.mode === "onboarding";
  if (!z.string().uuid().safeParse(orderId).success) notFound();
  const { order, pickupToken } = await loadOrder(orderId);

  const totalPrice = order.discountPriceSnapshot * order.quantity;
  const normalTotal = order.normalPriceSnapshot * order.quantity;
  const isPickedUp = order.status === "picked_up";
  const isCancelled = order.status === "cancelled";
  const timeline: { title: string; sub: string; state: "done" | "now" | "todo" }[] = isCancelled
    ? [
        {
          title: "Dipesan",
          sub: `${formatDateTimeWIB(new Date(order.createdAt))} WIB`,
          state: "done",
        },
        { title: "Dibatalkan", sub: "Stok kembali ke katalog", state: "now" },
      ]
    : [
        {
          title: "Dipesan",
          sub: `${formatDateTimeWIB(new Date(order.createdAt))} WIB`,
          state: "done",
        },
        {
          title: "Tunjukkan QR",
          sub: isPickedUp ? "Sudah dipindai tenant" : "Siap dipindai saat pickup",
          state: isPickedUp ? "done" : "now",
        },
        {
          title: "Diambil",
          sub:
            isPickedUp && order.pickedUpAt
              ? `${formatDateTimeWIB(new Date(order.pickedUpAt))} WIB`
              : "Bayar tunai di tempat",
          state: isPickedUp ? "done" : "todo",
        },
      ];

  return (
    <>
      <AppHeader
        title={`${order.menuName} x ${order.quantity}`}
        trail={[
          { label: "Beranda", href: ROUTES.beranda },
          { label: "Pesanan", href: ROUTES.pesanan },
          { label: `Detail ${order.menuName}` },
        ]}
      />
      <SieraRailPage
        asideLabel="Status dan kantin"
        main={
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-5">
            <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
              {order.status === "reserved" && <OrderLiveStatus orderIds={[order.orderId]} />}
              <section
                aria-label="Ringkasan pesanan"
                className={cn(sieraCardClass, "flex flex-col gap-3 p-5")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  {order.pickedUpAt && (
                    <span className="text-[13px] text-[#64746B]">
                      Diambil {formatDateTimeWIB(new Date(order.pickedUpAt))} WIB · {order.quantity}{" "}
                      porsi diselamatkan
                    </span>
                  )}
                </div>
                <h1 className="text-balance text-2xl font-extrabold tracking-tight text-[#1C2826]">
                  {order.menuName} <span className="text-[#64746B]">× {order.quantity}</span>
                </h1>
                <p className="text-sm text-[#64746B]">
                  {order.tenantName}
                  {order.tenantLocation ? ` · ${order.tenantLocation}` : ""}
                  {order.avgWeightSnapshot != null && ` · ±${order.avgWeightSnapshot} g/porsi`}
                </p>
              </section>
              {order.status === "reserved" && (
                <QrPanel
                  menuName={order.menuName}
                  tenantName={order.tenantName}
                  totalPrice={totalPrice}
                  tenantLocation={order.tenantLocation}
                  pickupToken={pickupToken}
                />
              )}
              {order.status === "picked_up" && (
                <output className="flex items-start gap-3 rounded-[20px] bg-[#E6F4EA] p-4">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2E7D4F] text-white"
                  >
                    <Check className="size-5" strokeWidth={2.5} aria-hidden />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#1C2826]">
                      Pesanan selesai, selamat menikmati!
                    </p>
                    <p className="mt-0.5 text-sm text-[#1E5A36]">
                      Total {formatIDR(totalPrice)} dibayar tunai di tempat saat pickup.
                    </p>
                  </div>
                </output>
              )}
              {order.status === "cancelled" && (
                <div className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-line bg-white px-4 py-8 text-center">
                  <p className="text-sm font-bold text-[#1C2826]">Pesanan dibatalkan</p>
                  <p className="text-sm text-[#64746B]">
                    Stok porsi sudah dikembalikan ke katalog.
                  </p>
                  <Link
                    href={ROUTES.katalog}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
                    )}
                  >
                    Cari porsi lain
                  </Link>
                </div>
              )}
            </div>
            <div className="min-h-0 lg:sticky lg:top-[76px]">
              <section aria-label="Detail pesanan" className="flex min-w-0 flex-col gap-2">
                <SieraSectionTitle>Detail pesanan</SieraSectionTitle>
                <dl
                  className={cn(
                    sieraCardClass,
                    "flex flex-col divide-y divide-dashed divide-line px-4",
                  )}
                >
                  {order.cookedAt && (
                    <SieraField icon={Clock3} label="Dimasak">
                      {formatDateTimeWIB(new Date(order.cookedAt))} WIB
                    </SieraField>
                  )}
                  <SieraField icon={Tag} label="Harga normal">
                    <del className="font-normal text-[#64746B]">
                      <span className="sr-only">Harga awal: </span>
                      {formatIDR(normalTotal)}
                    </del>
                  </SieraField>
                  <SieraField icon={CalendarClock} label="Waktu pesan">
                    {formatDateTimeWIB(new Date(order.createdAt))} WIB
                  </SieraField>
                </dl>
              </section>
            </div>
          </div>
        }
        aside={
          <>
            <SieraSection id="alur-heading" label="Alur pickup">
              <ol className={cn(sieraCardClass, "flex flex-col gap-0 p-4")}>
                {timeline.map((t, i) => (
                  <li key={t.title} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < timeline.length - 1 && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-9 left-[17px] h-[calc(100%-24px)] w-0.5",
                          t.state === "done" ? "bg-[#2E7D4F]" : "bg-[#E8ECE9]",
                        )}
                      />
                    )}
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                        t.state === "done" && "bg-[#2E7D4F] text-white",
                        t.state === "now" && "bg-[#DCEBE0] text-[#1E5A36]",
                        t.state === "todo" && "bg-[#F1F5F2] text-[#64746B]",
                      )}
                    >
                      {t.state === "done" ? (
                        <Check className="size-4" strokeWidth={3} aria-hidden />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-[14px] font-bold text-[#1C2826]">{t.title}</span>
                      <span className="block text-[13px] text-[#64746B]">{t.sub}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </SieraSection>
            <SieraSection id="kantin-heading" label="Info kantin">
              <div className={cn(sieraCardClass, "flex items-center gap-3 p-4")}>
                <SieraTile>
                  <Store className="size-5" strokeWidth={1.75} aria-hidden />
                </SieraTile>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-[#1C2826]">
                    {order.tenantName}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#64746B]">
                    {order.tenantLocation ?? "Lihat lokasi di detail pesanan"}
                  </p>
                </div>
              </div>
            </SieraSection>
            <SieraSection
              id="bayar-heading"
              label={order.status === "cancelled" ? "Mau coba lagi?" : "Ringkasan bayar"}
            >
              {order.status === "cancelled" ? (
                <div className={cn(sieraCardClass, "flex flex-col gap-3 p-4 text-center")}>
                  <p className="text-sm text-[#64746B]">
                    Porsi lain masih menunggu diselamatkan sore ini.
                  </p>
                  <Link
                    href={ROUTES.katalog}
                    className={cn(
                      buttonVariants(),
                      "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
                    )}
                  >
                    Lihat katalog
                  </Link>
                </div>
              ) : (
                <div className={cn(sieraCardClass, "flex flex-col gap-3 p-4")}>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                    <del className="text-xs text-[#64746B]">
                      <span className="sr-only">Harga awal: </span>
                      {formatIDR(normalTotal)}
                    </del>
                    <strong className="text-2xl font-extrabold text-accent-strong">
                      {formatIDR(totalPrice)}
                    </strong>
                  </p>
                  <p className="mt-1 text-[13px] text-[#64746B]">
                    {order.status === "picked_up"
                      ? "Dibayar tunai di tempat saat pickup."
                      : "Bayar tunai di tempat saat pickup."}
                  </p>
                  <span aria-hidden className="my-3 block border-t border-dashed border-line" />
                  <div className="flex flex-col gap-2">
                    {order.status === "reserved" && (
                      <>
                        <Link
                          href={ROUTES.katalog}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
                          )}
                        >
                          Lihat katalog
                        </Link>
                        <CancelButton orderId={order.orderId} />
                      </>
                    )}
                    {order.status === "picked_up" && (
                      <>
                        <Link
                          href={katalogDetail(order.portionId)}
                          className={cn(
                            buttonVariants(),
                            "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
                          )}
                        >
                          Pesan lagi
                        </Link>
                        <Link
                          href={ROUTES.katalog}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
                          )}
                        >
                          Lihat katalog
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </SieraSection>
          </>
        }
      />
      <GuidedTour
        tourKey="pesanan-detail"
        forced={tourForced}
        intro={{
          title: "Halaman pickup?",
          body: "Tunjukkan QR ke tenant, bayar di tempat, selesai. Detail pesananmu ada di sini.",
        }}
        steps={[
          {
            target: '[aria-label="Ringkasan pesanan"]',
            title: "Status pesananmu",
            body: "Menu, jumlah, tenant, dan status: menunggu, selesai, atau dibatalkan.",
          },
          {
            target: '[aria-labelledby="qr-heading"]',
            title: "QR pickup",
            body: "Tunjukkan kode ini ke tenant saat ambil. Tokennya hanya muncul di layar ini.",
          },
          {
            target: '[aria-label="Ringkasan bayar"]',
            title: "Bayar di tempat",
            body: "Total yang dibayar tunai ke tenant. Batalkan dari sini bila berubah pikiran.",
          },
          {
            target: '[aria-label="Detail pesanan"]',
            title: "Rincian",
            body: "Jam masak, harga normal, dan waktu pesan buat arsipmu.",
          },
        ]}
      />
    </>
  );
}

import { cn } from "cn";
import { QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SieraRailPage, sieraCardClass } from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatIDR } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams } from "@/lib/tour-journey";
import { OrdersList } from "./pesanan-list";
import { QrModal } from "./qr-modal";

export const metadata: Metadata = { title: "Pesanan" };

export interface MyOrder {
  orderId: string;
  status: string;
  quantity: number;
  createdAt: string;
  pickedUpAt: string | null;
  pickupDeadlineAt: string | null;
  normalPriceSnapshot: number;
  discountPriceSnapshot: number;
  menuName: string;
  tenantName: string;
  tenantLocation: string | null;
}

async function loadOrders(): Promise<{ orders: MyOrder[]; error: string | null }> {
  const supabase = await createClient();
  const t0 = Date.now();
  const { data, error } = (await supabase.rpc("my_orders")) as {
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  };
  console.log(`[ukur] pesanan.my_orders ${Date.now() - t0}ms`);
  if (error) return { orders: [], error: "Gagal memuat pesanan. Coba lagi." };
  return {
    orders: (data ?? []).map((o) => ({
      orderId: String(o.order_id),
      status: String(o.status),
      quantity: Number(o.quantity),
      createdAt: String(o.created_at),
      pickedUpAt: (o.picked_up_at as string | null) ?? null,
      pickupDeadlineAt: (o.pickup_deadline_at as string | null) ?? null,
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
  const { user } = await requireRole(ROUTES.pesanan, "student");
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  return (
    <>
      <AppHeader
        title="Pesanan"
        trail={[{ label: "Beranda", href: ROUTES.beranda }, { label: "Pesanan" }]}
      />
      <div className="mx-auto w-full max-w-[430px] md:max-w-none max-md:mx-0 max-md:w-full max-md:max-w-full">
        <Suspense fallback={<LoadingSpinner />}>
          <PesananBody />
        </Suspense>
        <GuidedTour
          tourKey="pesanan"
          forced={tourForced}
          auto={false}
          journey={tourJourney}
          userId={user.id}
          fresh={sp.fresh === "1"}
          entryStep={tourEntry}
          next={tourJourney ? (getJourneyNext(ROUTES.pesanan) ?? undefined) : undefined}
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
      </div>
    </>
  );
}

async function PesananBody() {
  const { orders, error } = await loadOrders();
  const nextActive = orders.find((o) => o.status === "reserved") ?? null;
  return (
    <SieraRailPage
      asideLabel="QR pickup aktif"
      main={
        <div className="flex min-w-0 flex-col gap-6 lg:gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#1C2826]">
              Pesanan saya
            </h1>
            <p className="text-[15px] leading-normal text-[#64746B]">
              Porsi yang kamu kunci. Tunjukkan QR saat ambil, bayar di tempat.
            </p>
          </div>
          <OrdersList orders={orders} loadError={error} />
        </div>
      }
      aside={
        nextActive ? (
          <div id="qr-aktif-heading" className={cn(sieraCardClass, "flex flex-col gap-3 p-6")}>
            <h2 className="text-xs font-bold tracking-[0.08em] text-[#64746B] uppercase">
              QR pickup aktif
            </h2>
            <div className="min-w-0">
              <p className="truncate max-md:whitespace-normal max-md:[overflow-wrap:anywhere] text-[15px] font-bold text-[#1C2826]">
                {nextActive.menuName} <span className="font-semibold">× {nextActive.quantity}</span>
              </p>
              <p className="mt-0.5 truncate text-[13px] text-[#64746B] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                {nextActive.tenantName}
                {nextActive.tenantLocation ? ` · ${nextActive.tenantLocation}` : ""}
              </p>
              <p className="mt-1 text-base font-extrabold text-[#1E5A36]">
                {formatIDR(nextActive.discountPriceSnapshot * nextActive.quantity)}
              </p>
            </div>
            <QrModal order={nextActive} />
          </div>
        ) : (
          <div
            id="qr-aktif-heading"
            className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-6 text-center"
          >
            <h2 className="self-start text-xs font-bold tracking-[0.08em] text-[#64746B] uppercase">
              QR pickup aktif
            </h2>
            <div
              aria-hidden
              className="mx-auto mt-1 flex size-40 items-center justify-center rounded-2xl border-2 border-dashed border-line text-[#5B8A70]"
            >
              <QrCode className="size-14" strokeWidth={1.6} />
            </div>
            <p className="text-base font-bold text-[#1C2826]">Belum ada pickup aktif</p>
            <p className="text-sm leading-normal text-[#64746B]">
              Kunci satu porsi dulu, QR-nya akan muncul di sini.
            </p>
            <Link
              href={ROUTES.katalog}
              className={buttonVariants({
                className:
                  "mt-1.5 flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-bold",
              })}
            >
              Cari porsi di Katalog
            </Link>
          </div>
        )
      }
    />
  );
}

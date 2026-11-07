import { cn } from "cn";
import { ChevronRight, History, PackageCheck, ReceiptText, Timer, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { GuidedTour } from "@/components/guided-tour";
import { LoadingSpinner } from "@/components/loading-spinner";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { EmptyLine } from "@/components/shared/empty-line";
import {
  SieraAlert,
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  SieraStat,
  SieraStatStrip,
  SieraTile,
  sieraRowLayoutClass,
} from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimeWIB, formatIDR, wibTodayRange } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams } from "@/lib/tour-journey";
import { requireOwnTenant } from "../guard";
import { TenantPickupCountdown } from "./tenant-pickup-countdown";

export const metadata: Metadata = { title: "Pesanan Masuk" };

/** Daftar reservasi porsi tenant: menunggu pickup → selesai. Tanpa token. */

interface TenantOrderRow {
  id: string;
  status: "reserved" | "picked_up" | "cancelled" | "unpicked";
  quantity: number;
  createdAt: string;
  pickedUpAt: string | null;
  pickupDeadlineAt: string | null;
  discountPrice: number;
  menuName: string;
  buyerName: string;
}

/** Bentuk mentah join supabase (buyer + portion nested). */
interface RawTenantOrder {
  id: string;
  status: string;
  quantity: number;
  created_at: string;
  picked_up_at: string | null;
  pickup_deadline_at: string | null;
  discount_price_snapshot: number;
  buyer?: { full_name?: string | null; email?: string | null } | null;
  portions?: { menu_items?: { name: string } | { name: string }[] | null } | null;
}

async function loadOrders(): Promise<{ orders: TenantOrderRow[]; failed: boolean }> {
  const tenant = await requireOwnTenant("/tenant/pesanan");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, quantity, created_at, picked_up_at, pickup_deadline_at, discount_price_snapshot, buyer:profiles!orders_student_id_fkey(full_name, email), portions!inner(menu_item_id, menu_items!inner(name), tenant_id)",
    )
    .eq("portions.tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return { orders: [], failed: true };
  return {
    orders: (data as unknown as RawTenantOrder[]).map((o) => {
      const menu = Array.isArray(o.portions?.menu_items)
        ? o.portions.menu_items[0]
        : o.portions?.menu_items;
      return {
        id: o.id,
        status: o.status as TenantOrderRow["status"],
        quantity: o.quantity,
        createdAt: o.created_at,
        pickedUpAt: o.picked_up_at ?? null,
        pickupDeadlineAt: o.pickup_deadline_at ?? null,
        discountPrice: o.discount_price_snapshot,
        menuName: menu?.name ?? "Menu",
        buyerName: o.buyer?.full_name?.trim() || o.buyer?.email?.split("@")[0] || "Mahasiswa",
      };
    }),
    failed: false,
  };
}

export default function TenantPesananPage({
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
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TenantPesananBody searchParams={searchParams} />
    </Suspense>
  );
}

async function TenantPesananBody({
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
  const { orders, failed } = await loadOrders();
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  const waiting = orders.filter((o) => o.status === "reserved");
  const done = orders.filter((o) => o.status !== "reserved");
  const { dayStartUtc, dayEndIso } = wibTodayRange();
  const todayPicked = orders.filter(
    (o) =>
      o.status === "picked_up" &&
      o.pickedUpAt != null &&
      o.pickedUpAt >= dayStartUtc &&
      o.pickedUpAt < dayEndIso,
  );
  const todayOmzet = todayPicked.reduce((sum, o) => sum + o.discountPrice * o.quantity, 0);
  const oldestWaiting = [...waiting]
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .slice(0, 3);

  function Row({ o, showBadge }: { o: TenantOrderRow; showBadge: boolean }) {
    return (
      <li>
        <div className={sieraRowLayoutClass}>
          <Link
            href={`/tenant/pesanan/${o.id}`}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
          >
            <SieraTile>
              {showBadge ? (
                <History className="size-5" strokeWidth={1.75} aria-hidden />
              ) : (
                <ReceiptText className="size-5" strokeWidth={1.75} aria-hidden />
              )}
            </SieraTile>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] leading-[1.3] font-semibold text-[#1C2826] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                {o.menuName} <span className="font-normal text-[#64746B]">×{o.quantity}</span>
              </span>
              <span className="block truncate text-[12px] leading-[1.4] text-[#64746B] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                {o.buyerName} · Dipesan {formatDateTimeWIB(new Date(o.createdAt))} WIB · Total{" "}
                {formatIDR(o.discountPrice * o.quantity)}
                {o.status === "picked_up" && o.pickedUpAt
                  ? ` · Diambil ${formatDateTimeWIB(new Date(o.pickedUpAt))} WIB`
                  : ""}
              </span>
              {o.status === "reserved" && o.pickupDeadlineAt && (
                <span className="block truncate text-[12px] leading-[1.4] font-bold text-[#B45309] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                  Ambil dalam{" "}
                  <TenantPickupCountdown
                    deadlineIso={o.pickupDeadlineAt}
                    className="tabular-nums"
                  />
                </span>
              )}
            </span>
            <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            {showBadge && <OrderStatusBadge status={o.status} />}
            {o.status === "reserved" && (
              <Link href="/tenant/scan" className={cn(buttonVariants({ size: "sm" }), "min-h-11")}>
                Scan pickup
              </Link>
            )}
          </div>
        </div>
      </li>
    );
  }

  const tenant = await requireOwnTenant("/tenant/pesanan");
  const hour = Number(
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  const greet =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 19
          ? "Selamat sore"
          : "Selamat malam";

  const hero = (
    <div id="tour-hero" className="flex flex-col gap-2">
      <p className="text-[13px] font-bold text-[#2E7D4F]">PESANAN</p>
      <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl leading-[1.2] font-extrabold tracking-[-0.02em] text-[#1C2826]">
        {greet}, {tenant.name}
      </h1>
      <p className="text-[15px] leading-normal text-[#64746B]">
        Layani reservasi masuk, lalu scan saat serah terima.
      </p>
    </div>
  );

  const main = (
    <>
      {hero}
      {failed ? (
        <SieraAlert variant="error">
          Gagal memuat pesanan. Muat ulang halaman untuk mencoba lagi.
        </SieraAlert>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          hint="Posting porsi dulu supaya mahasiswa bisa memesan."
          ctaHref={ROUTES.tenantPorsiTambah}
          ctaLabel="Tambah porsi"
        />
      ) : (
        <>
          <section aria-labelledby="menunggu-heading" className="flex flex-col gap-3">
            {/* Outer keeps tour anchor; inner renders header row. */}
            <SieraSection
              id="menunggu-heading"
              label={`Menunggu pickup${waiting.length > 0 ? ` (${waiting.length})` : ""}`}
            >
              {waiting.length === 0 ? (
                <EmptyLine>Tidak ada reservasi aktif saat ini.</EmptyLine>
              ) : (
                <SieraList>
                  {waiting.map((o) => (
                    <Row key={o.id} o={o} showBadge={false} />
                  ))}
                </SieraList>
              )}
            </SieraSection>
          </section>
          <section aria-labelledby="selesai-heading" className="flex flex-col gap-3">
            {/* Outer keeps tour anchor; inner renders header row. */}
            <SieraSection id="selesai-heading" label="Selesai & dibatalkan">
              {done.length === 0 ? (
                <EmptyLine>Belum ada riwayat.</EmptyLine>
              ) : (
                <SieraList>
                  {done.map((o) => (
                    <Row key={o.id} o={o} showBadge />
                  ))}
                </SieraList>
              )}
            </SieraSection>
          </section>
        </>
      )}
    </>
  );

  const aside = (
    <>
      <SieraSection id="hari-ini-heading" label="Hari ini">
        <SieraStatStrip>
          <SieraStat icon={PackageCheck} value={String(todayPicked.length)} label="Pickup" />
          <SieraStat icon={Wallet} value={formatIDR(todayOmzet)} label="Omzet" />
          <SieraStat icon={Timer} value={String(waiting.length)} label="Menunggu" />
        </SieraStatStrip>
      </SieraSection>
      <SieraSection
        id="penunggu-heading"
        label="Penunggu terlama"
        action={
          <Link
            href="/tenant/scan"
            className="text-[13px] font-bold text-[#1E5A36] underline underline-offset-4"
          >
            Scan
          </Link>
        }
      >
        {oldestWaiting.length === 0 ? (
          <EmptyLine>Antrean kosong.</EmptyLine>
        ) : (
          <SieraList aria-label="Penunggu terlama">
            {oldestWaiting.map((o) => (
              <SieraRowLink
                key={o.id}
                href={`/tenant/pesanan/${o.id}`}
                icon={Timer}
                title={`${o.menuName} ×${o.quantity}`}
                subtitle={`${o.buyerName} · ${formatDateTimeWIB(new Date(o.createdAt))} WIB`}
              />
            ))}
          </SieraList>
        )}
      </SieraSection>
    </>
  );

  return (
    <>
      <AppHeader
        title="Pesanan"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Pesanan" }]}
      />
      <SieraRailPage main={main} asideLabel="Ringkasan pesanan" aside={aside} />
      <GuidedTour
        tourKey="tenant-pesanan"
        forced={tourForced}
        journey={tourJourney}
        next={tourJourney ? (getJourneyNext("/tenant/pesanan") ?? undefined) : undefined}
        journeyLabel="Bagian 4 dari 5 · Pesanan"
        entryStep={tourEntry}
        fresh={sp.fresh === "1"}
        intro={{
          title: "Pesanan masuk?",
          body: "Reservasi mahasiswa yang menunggu pickup dan riwayatnya, semua di sini.",
        }}
        steps={[
          {
            target: '[aria-labelledby="menunggu-heading"]',
            title: "Menunggu pickup",
            body: "Yang harus kamu layani. Arahkan mereka ke scanner saat serah terima.",
          },
          {
            target: '[aria-labelledby="selesai-heading"]',
            title: "Riwayat",
            body: "Yang sudah selesai dan dibatalkan, buat arsip.",
          },
        ]}
      />
    </>
  );
}

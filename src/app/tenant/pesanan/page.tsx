import { cn } from "cn";
import { ChevronRight, History, ReceiptText } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { GuidedTour } from "@/components/guided-tour";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { EmptyLine } from "@/components/shared/empty-line";
import { SieraAlert, SieraList, SieraSection, SieraTile, sieraRowLayoutClass } from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams } from "@/lib/tour-journey";
import { requireOwnTenant } from "../guard";

/** Daftar reservasi porsi tenant: menunggu pickup → selesai. Tanpa token. */

interface TenantOrderRow {
  id: string;
  status: "reserved" | "picked_up" | "cancelled";
  quantity: number;
  createdAt: string;
  pickedUpAt: string | null;
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
      "id, status, quantity, created_at, picked_up_at, discount_price_snapshot, buyer:profiles!orders_student_id_fkey(full_name, email), portions!inner(menu_item_id, menu_items!inner(name), tenant_id)",
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
        discountPrice: o.discount_price_snapshot,
        menuName: menu?.name ?? "Menu",
        buyerName: o.buyer?.full_name?.trim() || o.buyer?.email?.split("@")[0] || "Mahasiswa",
      };
    }),
    failed: false,
  };
}

export default async function TenantPesananPage({
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
              <span className="block truncate text-[15px] leading-[1.3] font-semibold text-[#1C2826]">
                {o.menuName} <span className="font-normal text-[#64746B]">×{o.quantity}</span>
              </span>
              <span className="block truncate text-[12px] leading-[1.4] text-[#64746B]">
                {o.buyerName} · Dipesan {formatDateTimeWIB(new Date(o.createdAt))} WIB · Total{" "}
                {formatIDR(o.discountPrice * o.quantity)}
                {o.status === "picked_up" && o.pickedUpAt
                  ? ` · Diambil ${formatDateTimeWIB(new Date(o.pickedUpAt))} WIB`
                  : ""}
              </span>
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

  return (
    <>
      <AppHeader
        title="Pesanan"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Pesanan" }]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        {failed ? (
          <SieraAlert variant="error">
            Gagal memuat pesanan. Koneksi bermasalah. Muat ulang halaman untuk mencoba lagi —
            jangan posting ulang porsi.
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
            body: "Reservasi mahasiswa yang menunggu pickup dan riwayatnya — semua di sini.",
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
      </div>
    </>
  );
}

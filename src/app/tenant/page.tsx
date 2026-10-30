import { ChevronRight, CircleHelp, Package, ReceiptText, ScanLine, Wallet } from "lucide-react";
import Link from "next/link";
import { SieraCard, SieraSectionTitle, SieraTenantHeader, SieraTile } from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams, shouldAutoChain } from "@/lib/tour-journey";
import { requireOwnTenant } from "./guard";
import { TenantTour } from "./tenant-tour";

/** Dashboard tenant: porsi aktif, reservasi, pickup & omzet hari ini (WIB). */

interface ActivePortion {
  id: string;
  menuName: string;
  quantityPosted: number;
  quantityRemaining: number;
  discountPrice: number;
  expiresAt: string;
}

interface Reservation {
  id: string;
  menuName: string;
  quantity: number;
  createdAt: string;
}

async function loadData() {
  const tenant = await requireOwnTenant("/tenant");
  const supabase = await createClient();

  // Batas hari ini Asia/Jakarta → UTC untuk filter picked_up_at.
  const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayLocal = `${nowWib.getFullYear()}-${pad(nowWib.getMonth() + 1)}-${pad(nowWib.getDate())}`;
  const dayStartUtc = new Date(`${todayLocal}T00:00:00+07:00`).toISOString();
  const dayEndUtc = new Date(`${todayLocal}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000;
  const dayEndIso = new Date(dayEndUtc).toISOString();

  const nowIso = new Date().toISOString();
  const hourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [portionsRes, ordersRes, expiredRes, menuCountRes] = await Promise.all([
    supabase
      .from("portions")
      .select(
        "id, quantity_posted, quantity_remaining, discount_price, expires_at, menu_items!inner(name), tenant_id",
      )
      .eq("tenant_id", tenant.id)
      .gt("expires_at", nowIso)
      .order("expires_at", { ascending: true })
      .limit(20),
    supabase
      .from("orders")
      .select(
        "id, status, quantity, created_at, picked_up_at, discount_price_snapshot, portions!inner(tenant_id, menu_items!inner(name))",
      )
      .eq("portions.tenant_id", tenant.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("portions")
      .select("id, expires_at, menu_items!inner(name)")
      .eq("tenant_id", tenant.id)
      .gte("expires_at", hourAgoIso)
      .lt("expires_at", nowIso)
      .order("expires_at", { ascending: false })
      .limit(5),
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id),
  ]);

  const activePortions: ActivePortion[] = (
    (portionsRes.data ?? []) as unknown as Array<Record<string, unknown>>
  ).map((p) => {
    const mi = p.menu_items as { name: string } | { name: string }[] | null;
    const menu = Array.isArray(mi) ? mi[0] : mi;
    return {
      id: String(p.id),
      menuName: menu?.name ?? "Menu",
      quantityPosted: Number(p.quantity_posted),
      quantityRemaining: Number(p.quantity_remaining),
      discountPrice: Number(p.discount_price),
      expiresAt: String(p.expires_at),
    };
  });

  const reservations: Reservation[] = [];
  let pickupsToday = 0;
  let revenueToday = 0;
  for (const o of (ordersRes.data ?? []) as unknown as Array<Record<string, unknown>>) {
    const portion = o.portions as { menu_items: { name: string } | { name: string }[] } | null;
    const menu = Array.isArray(portion?.menu_items) ? portion.menu_items[0] : portion?.menu_items;
    if (o.status === "reserved") {
      reservations.push({
        id: String(o.id),
        menuName: menu?.name ?? "Menu",
        quantity: Number(o.quantity),
        createdAt: String(o.created_at),
      });
    }
    if (o.status === "picked_up" && o.picked_up_at) {
      const at = new Date(String(o.picked_up_at)).getTime();
      if (at >= new Date(dayStartUtc).getTime() && at < new Date(dayEndIso).getTime()) {
        pickupsToday += Number(o.quantity);
        revenueToday += Number(o.quantity) * Number(o.discount_price_snapshot);
      }
    }
  }

  const justExpired: { menuName: string; expiresAt: string }[] = (
    (expiredRes.data ?? []) as unknown as Array<Record<string, unknown>>
  ).map((p) => {
    const mi = p.menu_items as { name: string } | { name: string }[] | null;
    const menu = Array.isArray(mi) ? mi[0] : mi;
    return { menuName: menu?.name ?? "Menu", expiresAt: String(p.expires_at) };
  });

  return {
    activePortions,
    reservations,
    pickupsToday,
    revenueToday,
    todayLocal,
    justExpired,
    tenantId: tenant.id,
    menuCount: menuCountRes.count ?? 0,
  };
}

export default async function TenantDashboardPage({
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
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  const {
    activePortions,
    reservations,
    pickupsToday,
    revenueToday,
    justExpired,
    tenantId,
    menuCount,
  } = await loadData();
  // Pintu masuk rantai tenant: belum punya menu + URL bersih.
  const autoChain = shouldAutoChain(menuCount === 0, tourForced || tourJourney);
  const totalRemaining = activePortions.reduce((sum, p) => sum + p.quantityRemaining, 0);
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <SieraTenantHeader kicker="DASBOR TENANT" title="Kantinmu hari ini">
        <p className="text-sm">
          {totalRemaining} porsi aktif · {pickupsToday} pickup · {formatIDR(revenueToday)} omzet
          hari ini
        </p>
      </SieraTenantHeader>

      <SieraCard className="grid grid-cols-3 divide-x divide-dashed divide-[#E8ECE9] p-4">
        <div className="flex items-center gap-3 pr-2">
          <SieraTile>
            <Package className="size-5" strokeWidth={1.75} aria-hidden />
          </SieraTile>
          <div className="min-w-0">
            <p className="text-lg leading-none font-extrabold">{totalRemaining}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#64746B]">Porsi aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4">
          <SieraTile>
            <ScanLine className="size-5" strokeWidth={1.75} aria-hidden />
          </SieraTile>
          <div className="min-w-0">
            <p className="text-lg leading-none font-extrabold">{pickupsToday}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#64746B]">Pickup</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pl-4">
          <SieraTile>
            <Wallet className="size-5" strokeWidth={1.75} aria-hidden />
          </SieraTile>
          <div className="min-w-0">
            <p className="truncate text-lg leading-none font-extrabold">
              {formatIDR(revenueToday)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#64746B]">Omzet</p>
          </div>
        </div>
      </SieraCard>

      <Link
        href="/tenant/scan"
        data-tour="scan"
        className={buttonVariants({ className: "min-h-12 w-full text-[15px]" })}
      >
        Scan pickup
      </Link>

      <section
        aria-labelledby="reservasi-heading"
        data-tour="reservasi"
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <SieraSectionTitle id="reservasi-heading">
            Menunggu pickup{reservations.length > 0 ? ` (${reservations.length})` : ""}
          </SieraSectionTitle>
          {reservations.length > 5 && (
            <Link
              href="/tenant/pesanan"
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-[#1E5A36] hover:underline"
            >
              Lihat Semua
            </Link>
          )}
        </div>
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#E8ECE9] bg-white p-6 text-center">
            <p className="text-sm text-[#64746B]">Tidak ada reservasi aktif.</p>
            <Link
              href="/tenant/scan"
              className={buttonVariants({ variant: "outline", className: "min-h-11" })}
            >
              Buka scanner
            </Link>
          </div>
        ) : (
          <SieraCard>
            <ul className="divide-y divide-dashed divide-[#E8ECE9]">
              {reservations.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/tenant/pesanan/${r.id}`}
                    className="flex min-h-11 items-center gap-3 py-3"
                  >
                    <SieraTile>
                      <ReceiptText className="size-5" strokeWidth={1.75} aria-hidden />
                    </SieraTile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">
                        {r.menuName}{" "}
                        <span className="font-normal text-[#64746B]">×{r.quantity}</span>
                      </span>
                      <span className="block text-[12px] text-[#64746B]">
                        Dipesan {formatDateTimeWIB(new Date(r.createdAt))} WIB
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </SieraCard>
        )}
      </section>

      <section aria-labelledby="porsi-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SieraSectionTitle id="porsi-heading">Porsi aktif</SieraSectionTitle>
          <Link
            href="/tenant/porsi/baru"
            data-tour="tambah-porsi"
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-[#1E5A36] hover:underline"
          >
            + Tambah
          </Link>
        </div>
        {activePortions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#E8ECE9] bg-white p-6 text-center">
            <p className="text-sm text-[#64746B]">
              Belum ada porsi aktif. Posting sisa masakan hari ini.
            </p>
            <Link
              href="/tenant/porsi/baru"
              className={buttonVariants({ variant: "outline", className: "min-h-11" })}
            >
              + Tambah porsi
            </Link>
          </div>
        ) : (
          <SieraCard>
            <ul className="divide-y divide-dashed divide-[#E8ECE9]">
              {activePortions.map((p) => {
                const minutesLeft = Math.max(
                  0,
                  Math.round((new Date(p.expiresAt).getTime() - Date.now()) / 60000),
                );
                const nearExpiry = minutesLeft < 60;
                return (
                  <li
                    key={p.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-bold leading-snug">
                        {p.menuName}{" "}
                        <span className="font-normal text-[#64746B]">
                          sisa {p.quantityRemaining}/{p.quantityPosted}
                        </span>
                      </h3>
                      <p className="mt-0.5 text-xs text-[#64746B]">
                        <strong className="text-sm font-bold text-primary">
                          {formatIDR(p.discountPrice)}
                        </strong>{" "}
                        · Habis {formatDateTimeWIB(new Date(p.expiresAt))} WIB
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {nearExpiry && (
                        <span className="inline-flex items-center rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#B45309]">
                          Batas ambil {minutesLeft} mnt lagi
                        </span>
                      )}
                      <Link
                        href={`/tenant/porsi/${p.id}/edit`}
                        className={buttonVariants({ variant: "outline", className: "min-h-11" })}
                      >
                        Edit
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
            {justExpired.length > 0 && (
              <p className="border-t border-dashed border-[#E8ECE9] pt-3 text-xs text-muted-foreground">
                Baru saja kedaluwarsa (≤1 jam):{" "}
                {justExpired
                  .map((j) => `${j.menuName} (${formatDateTimeWIB(new Date(j.expiresAt))})`)
                  .join(" · ")}{" "}
                — posting ulang bila masih layak.
              </p>
            )}
          </SieraCard>
        )}
      </section>

      <section aria-labelledby="bantuan-heading" className="flex flex-col gap-3">
        <SieraSectionTitle id="bantuan-heading">Bantuan</SieraSectionTitle>
        <SieraCard>
          <nav aria-label="Bantuan">
            <Link
              href="/tenant?panduan=rantai&fresh=1"
              className="flex min-h-11 items-center gap-3 py-1"
            >
              <SieraTile>
                <CircleHelp className="size-5" strokeWidth={1.75} aria-hidden />
              </SieraTile>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">Panduan kelola</span>
                <span className="block text-[12px] text-[#64746B]">
                  Tur singkat dasbor sampai scan
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
            </Link>
          </nav>
        </SieraCard>
      </section>

      <TenantTour
        forced={tourForced}
        auto={autoChain}
        userId={tenantId}
        journey={tourJourney || autoChain}
        next={tourJourney || autoChain ? (getJourneyNext("/tenant") ?? undefined) : undefined}
        journeyLabel="Bagian 1 dari 5 · Dasbor"
        entryStep={tourEntry}
        fresh={sp.fresh === "1"}
      />
    </div>
  );
}

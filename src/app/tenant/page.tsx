import {
  CircleCheck,
  CircleHelp,
  Hourglass,
  Package,
  Plus,
  ReceiptText,
  ScanLine,
  Timer,
  TriangleAlert,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { Photo } from "@/components/photo";
import { SaleConditions } from "@/components/sale-conditions";
import {
  SieraEmpty,
  SieraList,
  SieraRailPage,
  SieraRowLink,
  SieraSection,
  SieraStat,
  SieraStatStrip,
} from "@/components/siera";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress, ProgressTrack } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonListItem, SkeletonStat, SkeletonText } from "@/components/ui/skeleton-blocks";
import { formatDateTimeWIB, formatIDR, formatSisaMenit, wibTodayRange } from "@/lib/format";
import { ROUTES, tenantPorsiUbah } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams, shouldAutoChain } from "@/lib/tour-journey";
import { requireOwnTenant } from "./guard";
import { TenantPickupCountdown } from "./pesanan/tenant-pickup-countdown";
import { TambahPorsiButton } from "./porsi/sheet-buttons";
import TambahSheet from "./porsi/tambah-sheet";
import { TenantTour } from "./tenant-tour";

export const metadata: Metadata = { title: "Dasbor Tenant" };

/** Dashboard tenant: porsi aktif, reservasi, pickup & omzet hari ini (WIB). */

interface ActivePortion {
  id: string;
  menuName: string;
  quantityPosted: number;
  quantityRemaining: number;
  discountPrice: number;
  expiresAt: string;
  saleConditions: string | null;
}

interface Reservation {
  id: string;
  menuName: string;
  quantity: number;
  createdAt: string;
  pickupDeadlineAt: string | null;
}

async function loadData() {
  const tenant = await requireOwnTenant("/tenant");
  const supabase = await createClient();

  // Batas hari ini Asia/Jakarta → UTC untuk filter picked_up_at.
  const { todayLocal, dayStartUtc, dayEndIso } = wibTodayRange();

  const nowIso = new Date().toISOString();
  const hourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [portionsRes, ordersRes, expiredRes, menusRes] = await Promise.all([
    supabase
      .from("portions")
      .select(
        "id, quantity_posted, quantity_remaining, discount_price, expires_at, menu_items!inner(name, sale_conditions), tenant_id",
      )
      .eq("tenant_id", tenant.id)
      .gt("expires_at", nowIso)
      .order("expires_at", { ascending: true })
      .limit(20),
    supabase
      .from("orders")
      .select(
        "id, status, quantity, created_at, picked_up_at, pickup_deadline_at, discount_price_snapshot, portions!inner(tenant_id, menu_items!inner(name))",
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
    supabase.from("menu_items").select("id,is_active").eq("tenant_id", tenant.id).limit(200),
  ]);

  const activePortions: ActivePortion[] = (
    (portionsRes.data ?? []) as unknown as Array<Record<string, unknown>>
  ).map((p) => {
    const mi = p.menu_items as
      | { name: string; sale_conditions: string | null }
      | { name: string; sale_conditions: string | null }[]
      | null;
    const m = Array.isArray(mi) ? mi[0] : mi;
    return {
      id: String(p.id),
      menuName: m?.name ?? "Menu",
      quantityPosted: Number(p.quantity_posted),
      quantityRemaining: Number(p.quantity_remaining),
      discountPrice: Number(p.discount_price),
      expiresAt: String(p.expires_at),
      saleConditions: m?.sale_conditions ?? null,
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
        pickupDeadlineAt: (o.pickup_deadline_at as string | null) ?? null,
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

  const menuRows = (menusRes.data ?? []) as unknown as Array<{ is_active: boolean }>;
  return {
    activePortions,
    reservations,
    pickupsToday,
    revenueToday,
    todayLocal,
    justExpired,
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantLogoPath: tenant.logo_path,
    menuTotal: menuRows.length,
    menuInactive: menuRows.filter((m) => !m.is_active).length,
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
  return (
    <Suspense
      fallback={
        <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
          <output className="sr-only">Memuat</output>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <SkeletonText lines={2} />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-3">
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <SkeletonListItem withButton />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        </div>
      }
    >
      <DashboardBody
        tourForced={tourForced}
        tourJourney={tourJourney}
        tourEntry={tourEntry}
        fresh={sp.fresh === "1"}
      />
    </Suspense>
  );
}

async function DashboardBody({
  tourForced,
  tourJourney,
  tourEntry,
  fresh,
}: {
  tourForced: boolean;
  tourJourney: boolean;
  tourEntry: number | null;
  fresh: boolean;
}) {
  const {
    activePortions,
    reservations,
    pickupsToday,
    revenueToday,
    justExpired,
    tenantName,
    tenantId,
    tenantLogoPath,
    menuTotal,
    menuInactive,
  } = await loadData();
  // Pintu masuk rantai tenant: belum punya menu + URL bersih.
  const autoChain = shouldAutoChain(menuTotal === 0, tourForced || tourJourney);
  const totalRemaining = activePortions.reduce((sum, p) => sum + p.quantityRemaining, 0);

  // Rel "Perlu perhatian": 1 item = porsi tercepat kedaluwarsa + reservasi terlama + menu nonaktif.
  const attention: { icon: typeof Timer; title: string; subtitle: string; href: string }[] = [];
  const soonest = activePortions[0];
  if (soonest) {
    const mins = Math.max(
      0,
      Math.round((new Date(soonest.expiresAt).getTime() - Date.now()) / 60000),
    );
    attention.push({
      icon: Timer,
      title: `${soonest.menuName} · sisa ${soonest.quantityRemaining}`,
      subtitle: `Habis ±${formatSisaMenit(mins)} lagi`,
      href: tenantPorsiUbah(soonest.id),
    });
  }
  const oldest = reservations.length > 0 ? reservations[reservations.length - 1] : null;
  if (oldest) {
    attention.push({
      icon: Hourglass,
      title: `${oldest.menuName} ×${oldest.quantity}`,
      subtitle: `Antre sejak ${formatDateTimeWIB(new Date(oldest.createdAt))}`,
      href: `/tenant/pesanan/${oldest.id}`,
    });
  }
  if (menuInactive > 0) {
    attention.push({
      icon: UtensilsCrossed,
      title: `${menuInactive} menu nonaktif`,
      subtitle: "Aktifkan di Menu saya",
      href: ROUTES.tenantMenu,
    });
  }

  return (
    <>
      <AppHeader title="Dasbor" trail={[{ label: "Dasbor" }]} />
      <SieraRailPage
        asideLabel="Perlu perhatian"
        main={
          <>
            <div id="tour-hero" className="flex flex-col gap-2">
              <p className="text-[13px] font-bold text-[#2E7D4F]">DASBOR TENANT</p>
              <h1 className="flex items-center gap-2.5 max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl leading-[1.2] font-extrabold tracking-[-0.02em] text-[#1C2826]">
                <Photo
                  bucket="tenant-logos"
                  path={tenantLogoPath}
                  alt={`Logo ${tenantName}`}
                  placeholder="store"
                  sizes="28px"
                  className="size-7 shrink-0 rounded-md"
                />
                <span className="min-w-0">{tenantName}</span>
              </h1>
              <p className="text-[15px] leading-normal text-[#64746B]">
                Pantau reservasi, scan pickup, dan posting sisa masakan hari ini.
              </p>
            </div>

            <SieraStatStrip>
              <SieraStat icon={Package} value={totalRemaining} label="Porsi aktif" />
              <SieraStat icon={ScanLine} value={pickupsToday} label="Pickup" />
              <SieraStat icon={Wallet} value={formatIDR(revenueToday)} label="Omzet" />
            </SieraStatStrip>

            <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1 max-md:gap-2">
              <Link
                href="/tenant/scan"
                data-tour="scan"
                className={buttonVariants({
                  className: "min-h-11 w-full text-[15px] max-md:min-h-12",
                })}
              >
                <ScanLine className="size-5" aria-hidden />
                Scan pickup
              </Link>
              <TambahPorsiButton sheet={<TambahSheet />} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div data-tour="reservasi">
                <SieraSection
                  id="reservasi-heading"
                  label={`Menunggu pickup${reservations.length > 0 ? ` (${reservations.length})` : ""}`}
                  action={
                    reservations.length > 5 ? (
                      <Link
                        href="/tenant/pesanan"
                        className={buttonVariants({ size: "sm", className: "shrink-0" })}
                      >
                        Lihat Semua
                      </Link>
                    ) : undefined
                  }
                >
                  {reservations.length === 0 ? (
                    <SieraEmpty
                      title="Tidak ada reservasi aktif."
                      action={
                        <Link
                          href="/tenant/scan"
                          className={buttonVariants({ variant: "outline", className: "min-h-11" })}
                        >
                          Buka scanner
                        </Link>
                      }
                    />
                  ) : (
                    <SieraList>
                      {reservations.slice(0, 5).map((r) => (
                        <SieraRowLink
                          key={r.id}
                          href={`/tenant/pesanan/${r.id}`}
                          icon={ReceiptText}
                          title={
                            <>
                              {r.menuName}{" "}
                              <span className="font-normal text-[#64746B]">×{r.quantity}</span>
                            </>
                          }
                          subtitle={
                            <>
                              Dipesan {formatDateTimeWIB(new Date(r.createdAt))} WIB
                              {r.pickupDeadlineAt && (
                                <>
                                  {" · ambil dalam "}
                                  <TenantPickupCountdown
                                    deadlineIso={r.pickupDeadlineAt}
                                    className="font-bold text-[#B45309] tabular-nums"
                                  />
                                </>
                              )}
                            </>
                          }
                        />
                      ))}
                    </SieraList>
                  )}
                </SieraSection>
              </div>

              <SieraSection
                id="porsi-heading"
                label="Porsi aktif"
                action={
                  <Link
                    href={ROUTES.tenantPorsiTambah}
                    data-tour="tambah-porsi"
                    className={buttonVariants({
                      size: "sm",
                      className: "shrink-0 max-md:min-h-11 max-md:min-w-11",
                    })}
                  >
                    <Plus className="size-4" aria-hidden />
                    Tambah
                  </Link>
                }
              >
                {activePortions.length === 0 ? (
                  <SieraEmpty
                    title="Belum ada porsi aktif. Posting sisa masakan hari ini."
                    action={
                      <Link
                        href={ROUTES.tenantPorsiTambah}
                        className={buttonVariants({ variant: "outline", className: "min-h-11" })}
                      >
                        + Tambah porsi
                      </Link>
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <SieraList className="max-md:divide-y-0 max-md:border-0 max-md:bg-transparent max-md:shadow-none">
                      {activePortions.map((p) => {
                        const minutesLeft = Math.max(
                          0,
                          Math.round((new Date(p.expiresAt).getTime() - Date.now()) / 60000),
                        );
                        const nearExpiry = minutesLeft < 60;
                        const stockRatio =
                          p.quantityPosted > 0 ? p.quantityRemaining / p.quantityPosted : 0;
                        return (
                          <li
                            key={p.id}
                            className="flex min-h-16 flex-col justify-center gap-2 px-4 py-3.5 max-md:items-start sm:flex-row sm:items-center sm:justify-between sm:gap-4 max-md:mb-3 max-md:rounded-2xl max-md:border max-md:border-[#e3e9e5] max-md:bg-white max-md:px-4 max-md:py-3.5"
                          >
                            <div className="min-w-0">
                              <h3 className="font-bold leading-snug max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                                {p.menuName}{" "}
                                <span className="font-normal text-[#64746B] max-md:hidden">
                                  sisa {p.quantityRemaining}/{p.quantityPosted}
                                </span>
                              </h3>
                              <p className="mt-0.5 text-xs text-[#64746B] max-md:hidden">
                                <strong className="text-sm font-bold text-primary">
                                  {formatIDR(p.discountPrice)}
                                </strong>{" "}
                                · Habis {formatDateTimeWIB(new Date(p.expiresAt))} WIB
                              </p>
                              <p className="mt-1 text-sm font-semibold text-primary max-md:block hidden">
                                {formatIDR(p.discountPrice)}
                              </p>
                              <div className="mt-2 hidden flex-wrap items-center gap-2 max-md:flex">
                                <Badge
                                  className={
                                    p.quantityRemaining === 0
                                      ? "bg-[#FDECEC] text-[#BA1A1A]"
                                      : stockRatio < 0.5
                                        ? "bg-[#FEF3C7] text-[#92400E]"
                                        : "bg-[#DCEBE0] text-[#1E5A36]"
                                  }
                                >
                                  Sisa {p.quantityRemaining}/{p.quantityPosted}
                                </Badge>
                                <span className="inline-flex items-center gap-1 text-xs text-[#64746B]">
                                  <Timer className="size-3.5" aria-hidden />
                                  Habis {formatDateTimeWIB(new Date(p.expiresAt))} WIB
                                </span>
                              </div>
                              <Progress
                                value={Math.round(stockRatio * 100)}
                                aria-label={`Stok ${p.menuName}`}
                                className="mt-2 hidden max-md:block"
                              >
                                <ProgressTrack />
                              </Progress>
                              <SaleConditions conditions={p.saleConditions} className="mt-2" />
                            </div>
                            <div className="flex shrink-0 items-center gap-3 max-md:order-first max-md:self-end">
                              {nearExpiry && (
                                <span className="inline-flex items-center rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#B45309]">
                                  Batas ambil {formatSisaMenit(minutesLeft)} lagi
                                </span>
                              )}
                              <Link
                                href={tenantPorsiUbah(p.id)}
                                className={buttonVariants({
                                  variant: "outline",
                                  className: "min-h-11",
                                })}
                              >
                                Edit
                              </Link>
                            </div>
                          </li>
                        );
                      })}
                    </SieraList>
                    {justExpired.length > 0 && (
                      <output className="flex items-start gap-2 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] font-semibold text-[#92400E]">
                        <TriangleAlert className="size-5 shrink-0" aria-hidden />
                        <span>
                          Baru saja kedaluwarsa (≤1 jam):{" "}
                          {justExpired
                            .map(
                              (j) => `${j.menuName} (${formatDateTimeWIB(new Date(j.expiresAt))})`,
                            )
                            .join(" · ")}{" "}
                          · posting ulang bila masih layak.
                        </span>
                      </output>
                    )}
                  </div>
                )}
              </SieraSection>
            </div>

            <SieraSection id="bantuan-heading" label="Bantuan">
              <SieraList>
                <SieraRowLink
                  href="/tenant?panduan=rantai&fresh=1"
                  icon={CircleHelp}
                  title="Panduan kelola"
                  subtitle="Tur singkat dasbor sampai scan"
                />
              </SieraList>
            </SieraSection>

            <TenantTour
              forced={tourForced}
              auto={autoChain}
              userId={tenantId}
              journey={tourJourney || autoChain}
              next={tourJourney || autoChain ? (getJourneyNext("/tenant") ?? undefined) : undefined}
              journeyLabel="Bagian 1 dari 4 · Dasbor"
              entryStep={tourEntry}
              fresh={fresh}
            />
          </>
        }
        aside={
          <SieraSection id="perhatian-heading" label="Perlu perhatian">
            {attention.length === 0 ? (
              <SieraEmpty title="Semua aman." hint="Tak ada porsi/reservasi mendesak." compact />
            ) : (
              <SieraList>
                {attention.map((a) => (
                  <SieraRowLink
                    key={a.title}
                    href={a.href}
                    icon={a.icon}
                    title={a.title}
                    subtitle={a.subtitle}
                  />
                ))}
              </SieraList>
            )}
            {justExpired.length > 0 && (
              <p className="flex items-start gap-1.5 px-1 text-[12px] leading-relaxed text-[#64746B]">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#1E5A36]" aria-hidden />
                {justExpired.length} porsi kedaluwarsa ≤1 jam, posting ulang bila layak.
              </p>
            )}
          </SieraSection>
        }
      />
    </>
  );
}

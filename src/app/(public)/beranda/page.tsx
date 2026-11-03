import { cn } from "cn";
import { ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { GuidedTour } from "@/components/guided-tour";
import {
  SieraHero,
  SieraRailPage,
  SieraSection,
  SieraTile,
  sieraCardClass,
} from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { publicMenuImageUrl } from "@/lib/menu-image";
import { pesananDetail, ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams, shouldAutoChain } from "@/lib/tour-journey";
import { OnboardBanner } from "./onboard-banner";
import { SoonScroller } from "./soon-scroller";

export interface SoonPortion {
  id: string;
  menuName: string;
  tenantName: string;
  discountPrice: number;
  normalPrice: number;
  quantityRemaining: number;
  cookedAt: string;
  expiresAt: string;
  imageUrl: string | null;
}

interface ActiveOrder {
  orderId: string;
  menuName: string;
  tenantName: string;
  slotEnd: string | null;
}

async function loadSoon(): Promise<{ portions: SoonPortion[]; failed: boolean }> {
  const supabase = await createClient();
  const now = new Date();
  const { data, error } = await supabase
    .from("portions")
    .select(
      "id, quantity_remaining, cooked_at, expires_at, discount_price, menu_items!inner(name, normal_price, image_path), tenants!inner(name)",
    )
    .gt("expires_at", now.toISOString())
    .lte("release_at", now.toISOString())
    .order("expires_at", { ascending: true })
    .limit(6);
  if (error || !data) return { portions: [], failed: true };
  const out: SoonPortion[] = [];
  for (const row of data) {
    const menu = row.menu_items as unknown as {
      name: string;
      normal_price: number;
      image_path: string | null;
    };
    const tenant = row.tenants as unknown as { name: string };
    out.push({
      id: String(row.id),
      menuName: String(menu.name),
      tenantName: String(tenant.name),
      discountPrice: Number(row.discount_price),
      normalPrice: Number(menu.normal_price),
      quantityRemaining: Number(row.quantity_remaining),
      cookedAt: String(row.cooked_at),
      expiresAt: String(row.expires_at),
      imageUrl: menu.image_path ? publicMenuImageUrl(menu.image_path) : null,
    });
  }
  return { portions: out, failed: false };
}

async function loadActiveOrders(): Promise<ActiveOrder[]> {
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("my_orders")) as {
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  };
  if (error || !data) return [];
  return data
    .filter((o) => String(o.status) === "reserved")
    .map((o) => ({
      orderId: String(o.order_id),
      menuName: String(o.menu_name),
      tenantName: String(o.tenant_name),
      slotEnd: (o.slot_end as string | null) ?? null,
    }))
    .sort((a, b) => +new Date(a.slotEnd ?? 0) - +new Date(b.slotEnd ?? 0))
    .slice(0, 3);
}

export default async function BerandaPage({
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
  const { user } = await requireRole("/beranda", "student");
  const supabase = await createClient();
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const firstName = (profile?.full_name as string | null)?.trim().split(/\s+/)[0];
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user.id);
  const showOnboard = (count ?? 0) === 0;
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  // Pintu masuk 1: new user (belum pernah pesan) di URL bersih langsung masuk rantai.
  const autoChain = shouldAutoChain(showOnboard, tourForced || tourJourney);
  const [{ portions, failed: soonFailed }, activeOrders] = await Promise.all([
    loadSoon(),
    loadActiveOrders(),
  ]);
  return (
    <>
      <AppHeader title="Beranda" trail={[{ label: "Beranda" }]} />
      <div className="flex-1 bg-background">
        <SieraRailPage
          asideLabel="Ringkasan beranda"
          main={
            <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
              <div id="tour-hero">
                <SieraHero
                  eyebrow={firstName ? `${greet}, ${firstName}` : greet}
                  title="Kantin hampir tutup, masih ada yang enak."
                >
                  <p>
                    Sisa dagangan hari ini dijual miring. Ambil jam 16.30 sampai 18.30, bayar di
                    tempat.
                  </p>
                </SieraHero>
              </div>
              {showOnboard && <OnboardBanner />}
              <ActiveOrdersSection orders={activeOrders} />
              <SoonSection portions={portions} failed={soonFailed} />
            </div>
          }
          aside={
            <div className="hidden min-w-0 flex-col gap-4 lg:gap-5 xl:flex">
              <SieraSection id="ambil-heading" label="Jam ambil">
                <div
                  className={cn(
                    sieraCardClass,
                    "flex flex-col gap-1 p-4 text-[13px] text-[#64746B]",
                  )}
                >
                  <p className="text-sm font-bold text-[#1C2826]">16.30 sampai 18.30 WIB</p>
                  <p>Tunjukkan QR saat ambil, bayar tunai di tempat.</p>
                </div>
              </SieraSection>
            </div>
          }
        />
        <GuidedTour
          tourKey="beranda"
          forced={tourForced}
          auto={autoChain}
          journey={tourJourney || autoChain}
          userId={user.id}
          fresh={sp.fresh === "1"}
          entryStep={tourEntry}
          next={
            tourJourney || autoChain ? (getJourneyNext(ROUTES.beranda) ?? undefined) : undefined
          }
          journeyLabel="Bagian 1 dari 4 · Beranda"
          intro={{
            title: "Mau lihat panduan singkat beranda?",
            body: "Kami tunjukkan bagian yang penting buat kamu. Lewati atau ulangi kapan saja.",
          }}
          steps={[
            {
              target: "#tour-hero",
              title: "Mulai dari sini",
              body: "Sapaan dan info pengambilan hari ini ada di kartu ini. Jam ambil dan cara bayar selalu tertulis di sini.",
            },
            {
              target: "#tour-orders",
              title: "Pesananmu yang aktif",
              body: "Semua pesanan yang menunggu diambil kumpul di sini. Buka salah satu buat lihat QR dan detailnya.",
            },
            {
              target: "#tour-catalog",
              title: "Katalog sore ini",
              body: "Porsi yang dijual hari ini muncul di sini. Lihat semuanya, lalu buka kartunya buat pesan.",
            },
          ]}
        />
      </div>
    </>
  );
}

function ActiveOrderList({ orders }: { orders: ActiveOrder[] }) {
  const now = Date.now();
  return (
    <ul className={cn(sieraCardClass, "flex flex-col divide-y divide-dashed divide-line px-4")}>
      {orders.map((o) => {
        const left = o.slotEnd
          ? Math.max(0, Math.floor((+new Date(o.slotEnd) - now) / 60_000))
          : null;
        return (
          <li key={o.orderId}>
            <Link href={pesananDetail(o.orderId)} className="flex min-h-11 items-center gap-3 py-3">
              <SieraTile>
                <Store className="size-5" strokeWidth={1.75} aria-hidden />
              </SieraTile>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-bold text-[#1C2826]">{o.menuName}</span>
                <span className="truncate text-xs text-[#64746B]">
                  {o.tenantName}
                  {o.slotEnd ? ` · Ambil sampai ${formatDateTimeWIB(new Date(o.slotEnd))}` : ""}
                </span>
              </span>
              {left !== null && left < 60 && (
                <span className="shrink-0 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
                  {left <= 5 ? "Segera ambil" : `Sisa ${left} mnt`}
                </span>
              )}
              <ChevronRight
                className="size-5 shrink-0 text-[#64746B]"
                strokeWidth={1.75}
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveOrdersSection({ orders }: { orders: ActiveOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <div id="tour-orders">
      <SieraSection
        label={`Pesanan aktif (${orders.length})`}
        action={
          <Link
            href={ROUTES.pesanan}
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-[#1E5A36]"
          >
            Lihat Semua
          </Link>
        }
      >
        <ActiveOrderList orders={orders} />
      </SieraSection>
    </div>
  );
}

function SoonSection({ portions, failed }: { portions: SoonPortion[]; failed: boolean }) {
  if (failed) {
    return (
      <EmptyState
        id="tour-catalog"
        compact
        title="Katalog gagal dimuat."
        hint="Koneksi bermasalah. Muat ulang buat coba lagi."
        ctaHref="/beranda"
        ctaLabel="Muat ulang"
      />
    );
  }
  if (portions.length === 0) {
    return (
      <EmptyState
        id="tour-catalog"
        compact
        title="Belum ada porsi sore ini."
        hint="Biasanya kantin mulai posting sekitar 15.30 sampai 16.30. Cek lagi nanti sore."
        ctaHref={ROUTES.katalog}
        ctaLabel="Buka katalog"
      />
    );
  }
  return (
    <div id="tour-catalog">
      <SieraSection
        label={`Katalog sore ini (${portions.length})`}
        action={
          <Link
            href={ROUTES.katalog}
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-[#1E5A36]"
          >
            Lihat Semua
          </Link>
        }
      >
        <div className="flex flex-col gap-2">
          <SoonScroller portions={portions} />
          <Link
            href={ROUTES.katalog}
            className={buttonVariants({
              className:
                "mt-3 flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
            })}
          >
            Lihat katalog
          </Link>
        </div>
      </SieraSection>
    </div>
  );
}

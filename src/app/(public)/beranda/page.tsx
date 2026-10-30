import { cn } from "cn";
import { ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { sieraCardClass } from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { publicMenuImageUrl } from "@/lib/menu-image";
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
  return (
    <>
      <AppHeader title="Beranda" />
      <div className="flex-1 bg-background">
        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-6 px-4 py-6 lg:max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-x-8 lg:px-8">
          <section
            className="flex w-full flex-col gap-1 rounded-[20px] border border-[#E8ECE9] bg-gradient-to-b from-[#EAF5ED] to-white p-5 lg:col-span-2 lg:p-6"
            id="tour-hero"
          >
            <p className="text-xs font-bold tracking-wide text-[#1E5A36]">
              {greet}
              {firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826] lg:text-2xl">
              Kantin hampir tutup, masih ada yang enak.
            </h1>
            <p className="text-sm text-[#1E5A36]">
              Sisa dagangan hari ini dijual miring. Ambil jam 16.30–18.30, bayar di tempat.
            </p>
          </section>
          {showOnboard && <OnboardBanner />}
          <Suspense fallback={<LoadingSkeleton variant="grouped-list" />}>
            <ActiveOrdersBody />
          </Suspense>
          <Suspense fallback={<LoadingSkeleton variant="entity-row" />}>
            <SoonBody />
          </Suspense>
          <GuidedTour
            tourKey="beranda"
            forced={tourForced}
            auto={autoChain}
            journey={tourJourney || autoChain}
            userId={user.id}
            fresh={sp.fresh === "1"}
            entryStep={tourEntry}
            next={tourJourney || autoChain ? (getJourneyNext("/beranda") ?? undefined) : undefined}
            journeyLabel="Bagian 1 dari 4 · Beranda"
            intro={{
              title: "Mau lihat panduan singkat beranda?",
              body: "Kami tunjukkan bagian yang penting buat kamu. Bisa dilewati, dan diulang kapan saja.",
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
      </div>
    </>
  );
}

async function ActiveOrdersBody() {
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("my_orders")) as {
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  };
  if (error || !data) return null;
  const orders = data
    .filter((o) => String(o.status) === "reserved")
    .map((o) => ({
      orderId: String(o.order_id),
      menuName: String(o.menu_name),
      tenantName: String(o.tenant_name),
      slotEnd: (o.slot_end as string | null) ?? null,
    }))
    .sort((a, b) => +new Date(a.slotEnd ?? 0) - +new Date(b.slotEnd ?? 0))
    .slice(0, 3);
  if (orders.length === 0) return null;
  const now = Date.now();
  return (
    <section
      aria-label="Pesanan aktif"
      id="tour-orders"
      className="flex flex-col gap-2 lg:sticky lg:top-[76px] lg:col-start-2 lg:row-span-2 lg:row-start-2 lg:self-start"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]">
          Pesanan aktif ({orders.length})
        </h2>
        <Link
          href="/pesanan"
          className="min-h-11 content-center text-sm font-bold text-[#2E7D4F] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
        >
          Lihat Semua
        </Link>
      </div>
      <ul
        className={cn(sieraCardClass, "flex flex-col divide-y divide-dashed divide-[#E8ECE9] px-4")}
      >
        {orders.map((o) => {
          const left = o.slotEnd
            ? Math.max(0, Math.floor((+new Date(o.slotEnd) - now) / 60_000))
            : null;
          return (
            <li key={o.orderId}>
              <Link
                href={`/pesanan/${o.orderId}`}
                className="flex min-h-11 items-center gap-3 py-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#DCEBE0] text-[#1E5A36]">
                  <Store className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
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
    </section>
  );
}

async function SoonBody() {
  const { portions, failed } = await loadSoon();
  if (failed) {
    return (
      <div
        id="tour-catalog"
        className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-[#E8ECE9] bg-white px-4 py-8 text-center"
      >
        <p className="text-sm font-bold text-[#1C2826]">Katalog gagal dimuat.</p>
        <p className="text-sm text-[#64746B]">Koneksi bermasalah. Muat ulang buat coba lagi.</p>
        <Link
          href="/beranda"
          className={buttonVariants({
            className:
              "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
          })}
        >
          Muat ulang
        </Link>
      </div>
    );
  }
  if (portions.length === 0) {
    return (
      <div
        id="tour-catalog"
        className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-[#E8ECE9] bg-white px-4 py-8 text-center"
      >
        <p className="text-sm font-bold text-[#1C2826]">Belum ada porsi sore ini.</p>
        <p className="text-sm text-[#64746B]">
          Biasanya kantin mulai posting sekitar 15.30–16.30. Cek lagi nanti sore.
        </p>
        <Link
          href="/katalog"
          className={buttonVariants({
            className:
              "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
          })}
        >
          Buka katalog
        </Link>
      </div>
    );
  }
  return (
    <section aria-label="Katalog sore ini" className="flex flex-col gap-2" id="tour-catalog">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]">
          Katalog sore ini ({portions.length})
        </h2>
        <Link
          href="/katalog"
          className="min-h-11 content-center text-sm font-bold text-[#2E7D4F] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
        >
          Lihat Semua
        </Link>
      </div>
      <SoonScroller portions={portions} />
      <Link
        href="/katalog"
        className={buttonVariants({
          className:
            "mt-3 flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
        })}
      >
        Lihat katalog
      </Link>
    </section>
  );
}

import { ChevronRight, Clock3, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { publicMenuImageUrl } from "@/lib/menu-image";
import { createClient } from "@/lib/supabase/server";
import { OnboardBanner } from "./onboard-banner";

interface SoonPortion {
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

async function loadSoon(): Promise<SoonPortion[]> {
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
  if (error || !data) return [];
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
  return out;
}

export default async function BerandaPage() {
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
    .eq("buyer_id", user.id);
  const showOnboard = (count ?? 0) === 0;
  return (
    <>
      <AppHeader title="Beranda" />
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-6 px-4 pt-6 pb-28">
        <section className="flex flex-col gap-1 rounded-[20px] border border-[#E8ECE9] bg-gradient-to-b from-[#EAF5ED] to-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
          <p className="text-xs font-semibold text-muted-foreground">
            {greet}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <h1 className="text-[22px] leading-[1.3] font-extrabold">
            Kantin mau tutup. Masih ada yang enak.
          </h1>
          <p className="text-sm text-muted-foreground">
            Sisa hari ini, harga miring. Ambil 16.30-18.30, bayar di tempat.
          </p>
        </section>
        {showOnboard && <OnboardBanner />}
        <Suspense fallback={<LoadingSkeleton variant="cards" />}>
          <ActiveOrdersBody />
        </Suspense>
        <Suspense fallback={<LoadingSkeleton variant="cards" />}>
          <SoonBody />
        </Suspense>
        <Link
          href="/katalog"
          className={buttonVariants({ size: "lg", className: "h-12 w-full rounded-2xl" })}
        >
          Lihat katalog
        </Link>
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
    <section aria-label="Pesanan aktif" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground">
          Pesanan aktif ({orders.length})
        </h2>
        <Link href="/pesanan" className="text-sm font-bold text-primary">
          Lihat Semua
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-dashed divide-[#E8ECE9] rounded-[20px] border border-[#E8ECE9] bg-card shadow-[0_1px_2px_rgba(16,24,40,.04)]">
        {orders.map((o) => {
          const left = o.slotEnd
            ? Math.max(0, Math.floor((+new Date(o.slotEnd) - now) / 60_000))
            : null;
          return (
            <li key={o.orderId}>
              <Link
                href={`/pesanan/${o.orderId}`}
                className="flex min-h-11 items-center gap-3 px-4 py-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F2] text-primary">
                  <Store className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{o.menuName}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    {o.tenantName}
                    {o.slotEnd ? ` • Pickup sampai ${formatDateTimeWIB(new Date(o.slotEnd))}` : ""}
                  </span>
                </span>
                {left !== null && left < 60 && (
                  <span className="shrink-0 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#B45309]">
                    Sisa {left} mnt
                  </span>
                )}
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground"
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
  const portions = await loadSoon();
  if (portions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-[#E8ECE9] px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Kantin belum posting porsi sore ini. Cek lagi nanti.
        </p>
        <Link href="/katalog" className={buttonVariants({ className: "w-fit rounded-2xl" })}>
          Buka katalog
        </Link>
      </div>
    );
  }
  const now = Date.now();
  return (
    <section aria-label="Katalog sore ini" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground">
          Katalog sore ini ({portions.length})
        </h2>
        <Link href="/katalog" className="text-sm font-bold text-primary">
          Lihat Semua
        </Link>
      </div>
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {portions.map((p) => {
          const leftMin = Math.max(0, Math.floor((+new Date(p.expiresAt) - now) / 60_000));
          return (
            <li
              key={p.id}
              className="w-[240px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-[#E8ECE9] bg-card shadow-[0_1px_2px_rgba(16,24,40,.04)]"
            >
              <Link href={`/katalog/${p.id}`} className="flex min-h-11 flex-col">
                <span className="relative block h-28 w-full shrink-0 overflow-hidden bg-[#F1F5F2]">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.menuName}
                      fill
                      sizes="240px"
                      className="object-cover"
                    />
                  ) : (
                    <Skeleton
                      className="size-full rounded-none"
                      aria-label="Foto porsi belum tersedia"
                    />
                  )}
                </span>
                <span className="flex flex-col gap-0.5 p-4 pb-3">
                  <span className="truncate text-[15px] font-bold">{p.menuName}</span>
                  <span className="truncate text-[13px] text-muted-foreground">{p.tenantName}</span>
                </span>
                <span aria-hidden className="mx-4 border-t border-dashed border-[#E8ECE9]" />
                <span className="flex flex-col gap-1 p-4 pt-3">
                  <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Clock3 className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                    Dimasak {formatDateTimeWIB(new Date(p.cookedAt))} • Sisa {p.quantityRemaining}
                  </span>
                  <span className="flex flex-wrap items-baseline gap-x-1.5">
                    <del className="text-xs text-muted-foreground">{formatIDR(p.normalPrice)}</del>
                    <strong className="text-base font-extrabold text-[#F28C28]">
                      {formatIDR(p.discountPrice)}
                    </strong>
                  </span>
                  {leftMin < 60 && (
                    <span className="w-fit rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#B45309]">
                      Kedaluwarsa {leftMin} mnt
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import Link from "next/link";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "./guard";

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

  const [portionsRes, ordersRes] = await Promise.all([
    supabase
      .from("portions")
      .select(
        "id, quantity_posted, quantity_remaining, discount_price, expires_at, menu_items!inner(name), tenant_id",
      )
      .eq("tenant_id", tenant.id)
      .gt("expires_at", new Date().toISOString())
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

  return { activePortions, reservations, pickupsToday, revenueToday, todayLocal };
}

export default async function TenantDashboardPage() {
  const { activePortions, reservations, pickupsToday, revenueToday } = await loadData();
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">DASBOR TENANT</p>
        <h1 className="text-3xl font-bold">Kantinmu hari ini</h1>
        <p className="text-sm text-muted-foreground">
          {activePortions.reduce((sum, p) => sum + p.quantityRemaining, 0)} porsi aktif ·{" "}
          {pickupsToday} pickup · {formatIDR(revenueToday)} omzet hari ini
        </p>
      </div>

      <section aria-labelledby="reservasi-heading" className="border-b pb-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="reservasi-heading" className="text-lg font-bold">
            Reservasi menunggu pickup {reservations.length > 0 && `(${reservations.length})`}
          </h2>
          <div className="flex shrink-0 items-center gap-3">
            {reservations.length > 5 && (
              <Link
                href="/tenant/pesanan"
                className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary hover:underline"
              >
                Lihat semua
              </Link>
            )}
            <Link href="/tenant/scan" className={buttonVariants({ className: "min-h-11" })}>
              Scan pickup
            </Link>
          </div>
        </div>
        {reservations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Tidak ada reservasi aktif.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {reservations.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <h3 className="font-bold leading-snug">
                    {r.menuName}{" "}
                    <span className="font-normal text-muted-foreground">×{r.quantity}</span>
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Dipesan {formatDateTimeWIB(new Date(r.createdAt))} WIB
                  </p>
                </div>
                <OrderStatusBadge status="reserved" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="porsi-heading" className="border-b pb-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="porsi-heading" className="text-lg font-bold">
            Porsi aktif
          </h2>
          <Link href="/tenant/porsi/baru" className={buttonVariants({ className: "min-h-11" })}>
            + Tambah porsi
          </Link>
        </div>
        {activePortions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Belum ada porsi aktif. Posting sisa masakan hari ini.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-b">
            {activePortions.map((p) => {
              const minutesLeft = Math.round(
                (new Date(p.expiresAt).getTime() - Date.now()) / 60000,
              );
              const nearExpiry = minutesLeft < 60;
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold leading-snug">
                      {p.menuName}{" "}
                      <span className="font-normal text-muted-foreground">
                        sisa {p.quantityRemaining}/{p.quantityPosted}
                      </span>
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <strong className="text-sm font-bold text-primary">
                        {formatIDR(p.discountPrice)}
                      </strong>{" "}
                      · Habis {formatDateTimeWIB(new Date(p.expiresAt))} WIB
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {nearExpiry && (
                      <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-strong">
                        Kedaluwarsa {minutesLeft} mnt
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
        )}
      </section>

      <nav aria-label="Pintasan" className="flex flex-wrap gap-3 border-t pt-6">
        <ShortcutLink href="/tenant/menu" label="Kelola menu" />
        <ShortcutLink href="/tenant/pesanan" label="Pesanan masuk" />
        <ShortcutLink href="/tenant/scan" label="Scanner pickup" />
      </nav>
    </div>
  );
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonVariants({ variant: "outline", className: "min-h-11" })}>
      {label}
    </Link>
  );
}

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
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
  slotStart: string | null;
  slotEnd: string | null;
}

async function loadOrders(): Promise<TenantOrderRow[]> {
  const tenant = await requireOwnTenant("/tenant/pesanan");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, quantity, created_at, picked_up_at, discount_price_snapshot, slot_start, slot_end, portions!inner(menu_item_id, menu_items!inner(name), tenant_id)",
    )
    .eq("portions.tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map((o) => {
    const portion = o.portions as unknown as {
      menu_items: { name: string } | { name: string }[];
    } | null;
    const menu = Array.isArray(portion?.menu_items) ? portion.menu_items[0] : portion?.menu_items;
    return {
      id: o.id,
      status: o.status as TenantOrderRow["status"],
      quantity: o.quantity,
      createdAt: o.created_at,
      pickedUpAt: (o.picked_up_at as string | null) ?? null,
      discountPrice: o.discount_price_snapshot,
      menuName: menu?.name ?? "Menu",
      slotStart: (o.slot_start as string | null) ?? null,
      slotEnd: (o.slot_end as string | null) ?? null,
    };
  });
}

export default async function TenantPesananPage() {
  const orders = await loadOrders();
  const waiting = orders.filter((o) => o.status === "reserved");
  const done = orders.filter((o) => o.status !== "reserved");

  function Row({ o }: { o: TenantOrderRow }) {
    return (
      <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="font-bold leading-snug">
            {o.menuName} <span className="font-normal text-muted-foreground">×{o.quantity}</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dipesan {formatDateTimeWIB(new Date(o.createdAt))} WIB · Total{" "}
            {formatIDR(o.discountPrice * o.quantity)}
            {o.slotStart && o.slotEnd
              ? ` · Slot ${formatDateTimeWIB(new Date(o.slotStart))}–${new Date(o.slotEnd).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}`
              : ""}
            {o.status === "picked_up" && o.pickedUpAt
              ? ` · Diambil ${formatDateTimeWIB(new Date(o.pickedUpAt))} WIB`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <OrderStatusBadge status={o.status} />
          {o.status === "reserved" && (
            <Link
              href="/tenant/scan"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
            >
              Scan pickup
            </Link>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">RESERVASI</p>
        <h1 className="text-3xl font-bold">Pesanan masuk</h1>
        <p className="text-muted-foreground">
          Reservasi porsi dari mahasiswa. Konfirmasi pickup lewat scan QR di halaman scanner.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          hint="Posting porsi dulu supaya mahasiswa bisa memesan."
          ctaHref="/tenant/porsi/baru"
          ctaLabel="Tambah porsi"
        />
      ) : (
        <>
          <section aria-labelledby="menunggu-heading" className="border-b pb-6">
            <h2 id="menunggu-heading" className="text-lg font-bold">
              Menunggu pickup {waiting.length > 0 && `(${waiting.length})`}
            </h2>
            {waiting.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Tidak ada reservasi aktif saat ini.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {waiting.map((o) => (
                  <Row key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="selesai-heading">
            <h2 id="selesai-heading" className="text-lg font-bold">
              Selesai & dibatalkan
            </h2>
            {done.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada riwayat.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border border-b">
                {done.map((o) => (
                  <Row key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

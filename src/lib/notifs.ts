import { ROUTES } from "./routes";
import { createClient } from "@/lib/supabase/server";

export interface NotifItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  time: string;
}

async function studentNotifs(): Promise<NotifItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_orders");
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows
    .filter((o) => o.status === "picked_up" || o.status === "cancelled")
    .slice(0, 20)
    .map((o) => {
      const picked = o.status === "picked_up";
      return {
        id: String(o.order_id),
        title: picked ? "Pesanan selesai" : "Pesanan dibatalkan",
        desc: `${String(o.menu_name)} × ${Number(o.quantity)} — ${String(o.tenant_name)}`,
        href: ROUTES.pesanan,
        time: String(o.picked_up_at ?? o.created_at),
      };
    })
    .sort((a, b) => (a.time < b.time ? 1 : -1));
}

async function tenantNotifs(tenantId: string): Promise<NotifItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, quantity, created_at, portions!inner(tenant_id, menu_items!inner(name))")
    .eq("portions.tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    quantity: number;
    created_at: string;
    portions?: { menu_items?: { name: string } | { name: string }[] | null } | null;
  }>;
  return rows.map((o) => {
    const menu = Array.isArray(o.portions?.menu_items)
      ? o.portions.menu_items[0]
      : o.portions?.menu_items;
    const name = menu?.name ?? "Menu";
    return {
      id: o.id,
      title:
        o.status === "reserved"
          ? "Reservasi baru"
          : o.status === "picked_up"
            ? "Pickup selesai"
            : "Pesanan dibatalkan",
      desc: `${name} × ${o.quantity}`,
      href: "/tenant/pesanan",
      time: o.created_at,
    };
  });
}

async function adminNotifs(): Promise<NotifItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, name, created_at")
    .eq("is_approved", false)
    .order("created_at", { ascending: false })
    .limit(20);
  return ((data ?? []) as Array<{ id: string; name: string; created_at: string }>).map((t) => ({
    id: t.id,
    title: "Pendaftaran tenant baru",
    desc: t.name,
    href: "/admin/tenant",
    time: t.created_at,
  }));
}

export async function loadNotifs(
  role: string | null,
  tenantId: string | null,
): Promise<NotifItem[]> {
  if (role === "student") return studentNotifs();
  if (role === "tenant" && tenantId) return tenantNotifs(tenantId);
  if (role === "admin") return adminNotifs();
  return [];
}

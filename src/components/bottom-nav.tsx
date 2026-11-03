import { getCurrentUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { AppBottomNav } from "./app-bottomnav";
import { AppSidebar } from "./app-sidebar";
import type { NavTab } from "./nav-shared";

export async function unreadFor(role: string | null, userId: string | null): Promise<number> {
  if (!userId) return 0;
  const supabase = await createClient();
  try {
    if (role === "student") {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("student_id", userId)
        .eq("status", "reserved");
      return count ?? 0;
    }
    if (role === "tenant") {
      const { count } = await supabase
        .from("orders")
        .select("id, portions!inner(tenant_id, tenants!inner(owner_id))", {
          count: "exact",
          head: true,
        })
        .eq("portions.tenants.owner_id", userId)
        .eq("status", "reserved");
      return count ?? 0;
    }
    if (role === "admin") {
      const { count } = await supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", false);
      return count ?? 0;
    }
  } catch {
    return 0;
  }
  return 0;
}

function tabsFor(role: string | null, unread: number): NavTab[] {
  const badge = unread > 0 ? unread : undefined;
  if (role === "tenant")
    return [
      { href: ROUTES.tenant, label: "Dasbor", icon: "dashboard" },
      { href: ROUTES.tenantScan, label: "Pindai", icon: "scan" },
      { href: ROUTES.tenantPesanan, label: "Pesanan", icon: "orders", badge },
      { href: ROUTES.profil, label: "Profil", icon: "account" },
    ];
  if (role === "admin")
    return [
      { href: ROUTES.admin, label: "Dampak", icon: "dashboard" },
      { href: ROUTES.adminTenant, label: "Tenant", icon: "shield", badge },
      { href: ROUTES.katalog, label: "Katalog", icon: "store" },
      { href: ROUTES.profil, label: "Profil", icon: "account" },
    ];
  if (role === "student")
    return [
      { href: ROUTES.beranda, label: "Beranda", icon: "home" },
      { href: ROUTES.katalog, label: "Katalog", icon: "store" },
      { href: ROUTES.pesanan, label: "Pesanan", icon: "orders", badge },
      { href: ROUTES.profil, label: "Profil", icon: "account" },
    ];
  return [
    { href: ROUTES.beranda, label: "Beranda", icon: "home" },
    { href: ROUTES.katalog, label: "Katalog", icon: "store" },
    { href: ROUTES.masuk, label: "Masuk", icon: "account" },
  ];
}

/** BottomNav mobile floating + sidebar desktop. Role-aware. */
export async function BottomNav() {
  const current = await getCurrentUser();
  const unread = await unreadFor(current?.role ?? null, current?.user.id ?? null);
  const tabs = tabsFor(current?.role ?? null, unread);
  return (
    <>
      <AppBottomNav tabs={tabs} />
      <AppSidebar tabs={tabs} />
    </>
  );
}

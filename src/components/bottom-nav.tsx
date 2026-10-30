import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type NavTab, NavTabs } from "./nav-tabs";

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
  // ponytail: satu angka unread, satu lokasi badge per role. Header bell
  // tetap satu-satunya indikator global; tab Notifikasi tanpa badge agar
  // tidak ganda dengan tab Pesanan/Tenant.
  const badge = unread > 0 ? unread : undefined;
  if (role === "tenant")
    return [
      { href: "/tenant", label: "Dasbor", icon: "dashboard" },
      { href: "/tenant/scan", label: "Pindai", icon: "scan" },
      { href: "/tenant/pesanan", label: "Pesanan", icon: "orders", badge },
      { href: "/profil", label: "Akun", icon: "account" },
    ];
  if (role === "admin")
    return [
      { href: "/admin", label: "Dampak", icon: "dashboard" },
      { href: "/admin/tenant", label: "Tenant", icon: "shield", badge },
      { href: "/katalog", label: "Katalog", icon: "store" },
      { href: "/profil", label: "Akun", icon: "account" },
    ];
  if (role === "student")
    return [
      { href: "/beranda", label: "Beranda", icon: "home" },
      { href: "/katalog", label: "Katalog", icon: "store" },
      { href: "/pesanan", label: "Pesanan", icon: "orders", badge },
      { href: "/profil", label: "Akun", icon: "account" },
    ];
  return [
    { href: "/beranda", label: "Beranda", icon: "home" },
    { href: "/katalog", label: "Katalog", icon: "store" },
    { href: "/masuk", label: "Masuk", icon: "account" },
  ];
}

/** BottomNav mobile floating + sidebar desktop. Role-aware. */
export async function BottomNav() {
  const current = await getCurrentUser();
  const unread = await unreadFor(current?.role ?? null, current?.user.id ?? null);
  return <NavTabs tabs={tabsFor(current?.role ?? null, unread)} />;
}

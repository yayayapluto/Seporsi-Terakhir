import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { loadNotifs } from "@/lib/notifs";
import { getOwnTenant } from "@/lib/tenant";
import { unreadFor } from "./bottom-nav";
import { NotifDrawer } from "./notif-drawer";
import { NotifLive } from "./notif-live";

/** AppHeader Siera: logo + judul halaman + bell notifikasi. Khusus area login. */
export async function AppHeader({ title }: { title: string }) {
  const current = await getCurrentUser();
  const unread = await unreadFor(current?.role ?? null, current?.user.id ?? null);
  const role = current?.role ?? null;
  const tenantId = role === "tenant" ? ((await getOwnTenant())?.id ?? null) : null;
  const notifs = await loadNotifs(role, tenantId);
  const tables = (role === "admin" ? ["tenants"] : ["orders"]) as ("orders" | "tenants")[];
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-2 border-b border-line bg-white px-4 md:px-8">
      <span className="flex min-w-0 items-center gap-2">
        <Image
          src="/images/Logo_UPNVJ.png"
          alt="Logo UPN Veteran Jakarta"
          width={28}
          height={28}
          className="size-7 shrink-0 object-contain"
        />
        <span className="truncate text-lg font-extrabold text-[#2E7D4F]">{title}</span>
      </span>
      <NotifDrawer
        notifs={notifs}
        unread={unread}
        userKey={current?.user.id ?? "anon"}
        live={<NotifLive tables={tables} />}
      />
    </header>
  );
}

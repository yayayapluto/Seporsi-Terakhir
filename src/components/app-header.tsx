import { getCurrentUser } from "@/lib/auth";
import { loadNotifs } from "@/lib/notifs";
import { getOwnTenant } from "@/lib/tenant";
import { unreadFor } from "./bottom-nav";
import { HeaderCrumb } from "./header-crumb";
import { NotifDrawer } from "./notif-drawer";
import { NotifLive } from "./notif-live";

/** AppHeader Siera: breadcrumb + bell notifikasi. Khusus area login. */
export async function AppHeader({
  title,
  trail,
}: {
  title: string;
  trail?: { label: string; href?: string }[];
}) {
  const current = await getCurrentUser();
  const unread = await unreadFor(current?.role ?? null, current?.user.id ?? null);
  const role = current?.role ?? null;
  const tenantId = role === "tenant" ? ((await getOwnTenant())?.id ?? null) : null;
  const notifs = await loadNotifs(role, tenantId);
  const tables = (role === "admin" ? ["tenants"] : ["orders"]) as ("orders" | "tenants")[];
  const crumbs = trail ?? [{ label: title }];
  return (
    <header className="sticky top-0 z-30 h-[60px] w-full border-b border-line bg-white">
      <div className="flex h-full w-full items-center justify-between gap-2 px-4 md:px-8">
        <span className="flex min-w-0 flex-1 items-center">
          <HeaderCrumb trail={crumbs} />
        </span>
        <NotifDrawer
          notifs={notifs}
          unread={unread}
          userKey={current?.user.id ?? "anon"}
          live={<NotifLive tables={tables} />}
        />
      </div>
    </header>
  );
}

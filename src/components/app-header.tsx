import Link from "next/link";
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
  const isRoot = crumbs.length === 1 && !crumbs[0]?.href;
  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-line bg-white md:h-[60px]">
      <div className="flex h-full w-full items-center justify-between gap-2 px-4 md:px-8">
        {isRoot ? (
          <>
            <span className="flex min-w-0 flex-1 items-center max-md:hidden">
              <HeaderCrumb trail={crumbs} />
            </span>
            <Link
              href="/"
              aria-label="Seporsi Terakhir, beranda"
              className="flex min-w-0 flex-1 items-center font-heading text-lg font-extrabold text-[#286F3B] md:hidden"
            >
              <span className="truncate">Seporsi Terakhir</span>
            </Link>
          </>
        ) : (
          <span className="flex min-w-0 flex-1 items-center">
            <HeaderCrumb trail={crumbs} />
          </span>
        )}
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

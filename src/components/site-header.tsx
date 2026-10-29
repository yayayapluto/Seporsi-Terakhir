import { getCurrentUser } from "@/lib/auth";
import { unreadFor } from "./bottom-nav";
import { SiteHeaderClient } from "./site-header-client";

/** AppHeader Siera: brand + nama halaman, mail & bell. Unread reuse BottomNav counter. */
export async function SiteHeader() {
  const current = await getCurrentUser();
  const unread = await unreadFor(current?.role ?? null, current?.user.id ?? null);
  return <SiteHeaderClient signedIn={!!current} unread={unread} />;
}

import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { NotifLive } from "@/components/notif-live";
import { NotifRow } from "@/components/notif-row";
import { requireRole } from "@/lib/auth";
import { loadNotifs } from "@/lib/notifs";
import { getOwnTenant } from "@/lib/tenant";

/** Notifikasi per role dari tabel yang sudah ada: student = status pesanannya, tenant = reservasi masuk, admin = pendaftaran menunggu. */

export default async function NotifikasiPage() {
  const current = await requireRole("/notifikasi", "student", "tenant", "admin");

  let tenantId: string | null = null;
  if (current.role === "tenant") tenantId = (await getOwnTenant())?.id ?? null;
  // Admin tanpa tenant row: skip getOwnTenant agar tidak redirect pendaftaran.
  const notifs = await loadNotifs(current.role, tenantId);

  const tables: ("orders" | "tenants")[] = current.role === "admin" ? ["tenants"] : ["orders"];

  return (
    <>
      <AppHeader title="Notifikasi" />
      <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:pb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-[#1C2826] md:text-2xl">
            Kabar terbaru
          </h1>
          <p className="text-sm text-[#64746B]">
            Perubahan status pesanan dan pendaftaran muncul di sini.
          </p>
        </div>
        <NotifLive tables={tables} />
        {notifs.length === 0 ? (
          <EmptyState
            title="Belum ada kabar"
            hint="Perubahan status pesanan dan pendaftaran akan muncul di sini."
            ctaHref="/katalog"
            ctaLabel="Lihat katalog"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {notifs.map((n) => (
              <li key={n.id}>
                <NotifRow n={n} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { requireRole } from "@/lib/auth";
import { formatDateTimeWIB } from "@/lib/format";
import { loadNotifs, type NotifItem } from "@/lib/notifs";
import { getOwnTenant } from "@/lib/tenant";
import { NotifLive } from "./notif-live";

/** Notifikasi per role dari tabel yang sudah ada: student = status pesanannya, tenant = reservasi masuk, admin = pendaftaran menunggu. */

function Row({ n }: { n: NotifItem }) {
  return (
    <Link
      href={n.href}
      className="flex min-h-11 flex-row items-center gap-3 rounded-[20px] border border-[#E8ECE9] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,.04)]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-sm font-bold text-[#166534]">
        {n.title.charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-bold text-[#1C2826]">{n.title}</span>
          <span className="shrink-0 text-xs whitespace-nowrap text-[#64746B]">
            {formatDateTimeWIB(new Date(n.time))}
          </span>
        </span>
        <span className="line-clamp-2 text-[13px] text-[#1C2826]">{n.desc}</span>
      </span>
    </Link>
  );
}

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
      <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:pb-12">
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
                <Row n={n} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

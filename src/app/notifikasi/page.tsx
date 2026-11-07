import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { NotifLive } from "@/components/notif-live";
import { NotifRow } from "@/components/notif-row";
import { SieraRailPage, SieraSection } from "@/components/siera";
import { requireRole } from "@/lib/auth";
import { loadNotifs } from "@/lib/notifs";
import { ROUTES } from "@/lib/routes";
import { getOwnTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Notifikasi" };

/** Notifikasi per role dari tabel yang sudah ada: student = status pesanannya, tenant = reservasi masuk, admin = pendaftaran menunggu. */

export default async function NotifikasiPage() {
  const current = await requireRole("/notifikasi", "student", "tenant", "admin");
  return (
    <>
      <AppHeader title="Notifikasi" trail={[{ label: "Notifikasi" }]} />
      <Suspense fallback={<LoadingSpinner />}>
        <NotifBody role={current.role} />
      </Suspense>
    </>
  );
}

async function NotifBody({ role }: { role: "student" | "tenant" | "admin" }) {
  let tenantId: string | null = null;
  if (role === "tenant") tenantId = (await getOwnTenant())?.id ?? null;
  // Admin tanpa tenant row: skip getOwnTenant agar tidak redirect pendaftaran.
  const notifs = await loadNotifs(role, tenantId);

  const tables: ("orders" | "tenants")[] = role === "admin" ? ["tenants"] : ["orders"];

  return (
    <SieraRailPage
      asideLabel="Ringkasan kabar"
      main={
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-[#1C2826] md:text-2xl">
              Kabar terbaru buat kamu
            </h1>
            <p className="text-sm text-[#64746B]">
              Perubahan status pesanan dan pendaftaran muncul di sini karena semua kabar dicatat di
              halaman ini.
            </p>
          </div>
          <NotifLive tables={tables} />
          {notifs.length === 0 ? (
            <EmptyState
              title="Belum ada kabar"
              hint="Perubahan status pesanan dan pendaftaran muncul di sini, jadi cek lagi nanti."
              ctaHref={ROUTES.katalog}
              ctaLabel="Buka katalog"
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
        </>
      }
      aside={
        <SieraSection
          id="ringkasan-heading"
          label={`Belum dibaca${notifs.length > 0 ? ` (${notifs.length})` : ""}`}
        >
          <ul className="flex flex-col gap-3">
            <li>
              <a
                href={ROUTES.notifikasi}
                className="inline-flex min-h-11 items-center text-sm font-bold text-[#1E5A36] hover:underline"
              >
                Kelola kabar
              </a>
            </li>
          </ul>
        </SieraSection>
      }
    />
  );
}

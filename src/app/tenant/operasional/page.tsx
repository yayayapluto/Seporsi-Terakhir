import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SieraCard, sieraCardClass } from "@/components/siera";
import { buttonVariants } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { requireOwnTenant } from "../guard";

export const metadata: Metadata = { title: "Operasional" };

/** Operasional tenant: ringkasan angka hari ini + aksi langsung. Tanpa tabel baru. */
export default function OperasionalPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OperasionalBody />
    </Suspense>
  );
}

async function OperasionalBody() {
  const tenant = await requireOwnTenant(ROUTES.tenantOperasional);
  const supabase = await createClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [portionsRes, ordersRes, menuRes] = await Promise.all([
    supabase
      .from("portions")
      .select("id, quantity_posted, quantity_remaining")
      .eq("tenant_id", tenant.id)
      .gte("created_at", dayStart.toISOString()),
    supabase
      .from("orders")
      .select("status, quantity, discount_price_snapshot, portions!inner(tenant_id)")
      .eq("portions.tenant_id", tenant.id)
      .gte("created_at", dayStart.toISOString()),
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("is_active", true),
  ]);

  const portions = (portionsRes.data ?? []) as Array<{
    quantity_posted: number;
    quantity_remaining: number;
  }>;
  const orders = (ordersRes.data ?? []) as Array<{
    status: string;
    quantity: number;
    discount_price_snapshot: number;
  }>;
  const posted = portions.reduce((n, p) => n + Number(p.quantity_posted), 0);
  const remaining = portions.reduce((n, p) => n + Number(p.quantity_remaining), 0);
  const waiting = orders
    .filter((o) => o.status === "reserved")
    .reduce((n, o) => n + Number(o.quantity), 0);
  const picked = orders
    .filter((o) => o.status === "picked_up")
    .reduce((n, o) => n + Number(o.quantity), 0);
  const revenue = orders
    .filter((o) => o.status === "picked_up")
    .reduce((n, o) => n + Number(o.quantity) * Number(o.discount_price_snapshot), 0);

  return (
    <>
      <AppHeader
        title="Operasional"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Operasional" }]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8 max-md:px-0 max-md:mx-0 max-md:py-4 max-md:pb-0">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-bold text-[#2E7D4F]">OPERASIONAL</p>
          <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl leading-[1.2] font-extrabold tracking-[-0.02em] text-[#1C2826]">
            Ringkasan hari ini
          </h1>
          <p className="text-[15px] leading-normal text-[#64746B]">
            Porsi diposting, menunggu pickup, dan omzet masuk, sekilas.
          </p>
        </div>
        <dl className={`${sieraCardClass} grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4`}>
          {[
            { label: "Porsi diposting", value: String(posted) },
            { label: "Sisa tersedia", value: String(remaining) },
            { label: "Menunggu pickup", value: String(waiting) },
            { label: "Diambil · omzet", value: `${picked} · ${formatIDR(revenue)}` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 bg-white p-4">
              <dt className="text-[11px] font-bold tracking-wide text-[#64746B] max-md:text-xs">
                {s.label}
              </dt>
              <dd className="text-xl font-extrabold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <SieraCard className="flex flex-col gap-2 p-4">
          <p className="text-sm font-bold">Menu aktif: {menuRes.count ?? 0}</p>
          <p className="text-[13px] text-[#64746B]">
            Tambah porsi dari menu aktif, atau buka scanner saat serah terima.
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Link
              href={ROUTES.tenantPorsiTambah}
              className={buttonVariants({ className: "min-h-11 flex-1" })}
            >
              Tambah porsi
            </Link>
            <Link
              href={ROUTES.tenantScan}
              className={buttonVariants({ variant: "outline", className: "min-h-11 flex-1" })}
            >
              Buka scanner
            </Link>
          </div>
        </SieraCard>
      </div>
    </>
  );
}

import { connection } from "next/server";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { percentSold } from "@/lib/domain/metrics";
import { createClient } from "@/lib/supabase/server";
import { ImpactClient } from "./impact-client";

export interface AdminReportRow {
  tenantName: string;
  portionsPosted: number;
  portionsPickedUp: number;
  revenue: number;
  moneySaved: number;
  wasteKg: number | null;
}

interface ImpactSummary {
  portionsSaved: number;
  wasteKg: number | null;
  moneySaved: number;
  revenue: number;
  percent: number;
}

/** Rentang dari query params, default 30 hari, WIB day boundaries. */
function resolveRange(from: string | undefined, to: string | undefined) {
  const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const today = nowWib.toISOString().slice(0, 10);
  const fallbackFrom = new Date(nowWib.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const iso = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  const f = from && iso.test(from) ? from : fallbackFrom;
  const t = to && iso.test(to) ? to : today;
  return { from: f, to: t, today };
}

async function loadReport(from: string, to: string) {
  const supabase = await createClient();
  await connection();
  // WIB day boundaries: [from 00:00, to+1d 00:00) in Jakarta → UTC.
  const fromUtc = new Date(`${from}T00:00:00+07:00`).toISOString();
  const toExclusive = new Date(
    new Date(`${to}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();

  const [summaryRes, reportRes] = await Promise.all([
    supabase.rpc("impact_summary", { p_from: fromUtc, p_to: toExclusive }),
    supabase.rpc("admin_report", { p_from: fromUtc, p_to: toExclusive }),
  ]);
  const s = (summaryRes.data as Array<Record<string, unknown>> | null)?.[0];
  const summary: ImpactSummary = {
    portionsSaved: Number(s?.portions_saved ?? 0),
    wasteKg: s && Number(s.waste_grams) > 0 ? Number(s.waste_grams) / 1000 : null,
    moneySaved: Number(s?.money_saved ?? 0),
    revenue: Number(s?.revenue ?? 0),
    percent: percentSold(Number(s?.portions_saved ?? 0), Number(s?.posted ?? 0)),
  };
  const rows: AdminReportRow[] = (
    (reportRes.data as Array<Record<string, unknown>> | null) ?? []
  ).map((r) => ({
    tenantName: String(r.tenant_name ?? ""),
    portionsPosted: Number(r.portions_posted ?? 0),
    portionsPickedUp: Number(r.portions_picked_up ?? 0),
    revenue: Number(r.revenue ?? 0),
    moneySaved: Number(r.money_saved ?? 0),
    wasteKg: Number(r.waste_grams) > 0 ? Number(r.waste_grams) / 1000 : null,
  }));
  return { summary, rows };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireRole("/admin", "admin");
  const sp = await searchParams;
  const { from, to } = resolveRange(sp.from, sp.to);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">DASBOR DAMPAK</p>
        <h1 className="text-3xl font-bold">Dampak penyelamatan</h1>
        <p className="text-muted-foreground">
          Halo {user.user.email ?? "Admin"}. Angka dari pickup yang discan — bukan estimasi. Berat =
          estimasi sampling per menu.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat laporan…</p>}>
        <ReportBody from={from} to={to} />
      </Suspense>
    </div>
  );
}

async function ReportBody({ from, to }: { from: string; to: string }) {
  const { summary, rows } = await loadReport(from, to);
  return <ImpactClient summary={summary} rows={rows} from={from} to={to} />;
}

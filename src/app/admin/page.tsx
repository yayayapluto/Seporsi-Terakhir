import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { requireRole } from "@/lib/auth";
import { percentSold } from "@/lib/domain/metrics";
import { wibDayRangeUtc } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ImpactClient } from "./impact-client";

export interface AdminDailyPoint {
  day: string;
  saved: number;
}

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
  const { fromUtc, toExclusive } = wibDayRangeUtc(from, to);

  const [summaryRes, reportRes, dailyRes] = await Promise.all([
    supabase.rpc("impact_summary", { p_from: fromUtc, p_to: toExclusive }),
    supabase.rpc("admin_report", { p_from: fromUtc, p_to: toExclusive }),
    supabase.rpc("impact_daily", { p_from: fromUtc, p_to: toExclusive }),
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
  const daily: AdminDailyPoint[] = (
    (dailyRes.data as Array<Record<string, unknown>> | null) ?? []
  ).map((d) => ({ day: String(d.day ?? ""), saved: Number(d.saved ?? 0) }));
  return { summary, rows, daily };
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
    <>
      <AppHeader title="Dampak" trail={[{ label: "Dampak" }]} />
      <Suspense fallback={<LoadingSkeleton variant="report" />}>
        <ReportBody from={from} to={to} email={user.user.email ?? "Admin"} />
      </Suspense>
    </>
  );
}
async function ReportBody({ from, to, email }: { from: string; to: string; email: string }) {
  const { summary, rows, daily } = await loadReport(from, to);
  return (
    <ImpactClient summary={summary} rows={rows} daily={daily} from={from} to={to} email={email} />
  );
}

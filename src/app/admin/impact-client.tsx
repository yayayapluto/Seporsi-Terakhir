"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { DateField } from "@/components/date-field";
import { GuidedTour } from "@/components/guided-tour";
import { SieraAlert, SieraCard, SieraEmpty } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { percentSold } from "@/lib/domain/metrics";
import { formatIDR } from "@/lib/format";
import { exportCsv } from "./actions";
import type { AdminDailyPoint, AdminReportRow } from "./page";

/** Bangun deret harian penuh dari from..to (hari kosong = 0). */
function fillDaily(from: string, to: string, points: AdminDailyPoint[]) {
  const byDay = new Map(points.map((p) => [p.day, p.saved]));
  const out: { day: string; saved: number }[] = [];
  const start = new Date(`${from}T00:00:00+07:00`).getTime();
  const end = new Date(`${to}T00:00:00+07:00`).getTime();
  for (let t = start; t <= end; t += 86_400_000) {
    const d = new Date(t);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    out.push({ day: key, saved: byDay.get(key) ?? 0 });
  }
  return out;
}

/** Rentang tanggal + sorotan angka + tren + tabulasi per-tenant + export CSV. */
export function ImpactClient({
  summary,
  rows,
  daily,
  from,
  to,
}: {
  summary: {
    portionsSaved: number;
    wasteKg: number | null;
    moneySaved: number;
    revenue: number;
    percent: number;
  };
  rows: AdminReportRow[];
  daily: AdminDailyPoint[];
  from: string;
  to: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [csvError, setCsvError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  function applyRange(fd: string, td: string) {
    const next = new URLSearchParams(params);
    next.set("from", fd);
    next.set("to", td);
    startTransition(() => router.push(`/admin?${next.toString()}`));
  }

  async function downloadCsv() {
    setExporting(true);
    setCsvError(null);
    const result = await exportCsv(from, to);
    setExporting(false);
    if (!result.ok) {
      setCsvError(result.error);
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const series = fillDaily(from, to, daily);
  const maxSaved = Math.max(1, ...series.map((d) => d.saved));
  const labelEvery = Math.max(1, Math.ceil(series.length / 8));
  const best = rows.length > 0 ? Math.max(...rows.map((r) => r.portionsPickedUp)) : 0;

  const secondary = [
    { label: "Uang hemat mahasiswa", value: formatIDR(summary.moneySaved) },
    { label: "Pendapatan tambahan tenant", value: formatIDR(summary.revenue) },
    {
      label: "Sampah makanan terhindar (estimasi)",
      value: summary.wasteKg == null ? "Belum ada data berat" : `${summary.wasteKg.toFixed(1)} kg`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div data-tour="rentang" className="flex flex-wrap items-end gap-3">
        <DateField
          id="from"
          label="Dari"
          value={from}
          onChange={(v) => applyRange(v, to)}
          max={to}
        />
        <DateField
          id="to"
          label="Sampai"
          value={to}
          onChange={(v) => applyRange(from, v)}
          min={from}
        />
      </div>

      <section
        aria-label="Sorotan dampak"
        className="overflow-hidden rounded-[20px] border border-line bg-gradient-to-br from-[#2E7D4F] to-[#1E5A36] p-5 text-white sm:p-6"
      >
        <p className="text-xs font-bold tracking-widest text-white/80">PORSI TERSELAMATKAN</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl">
          {summary.portionsSaved}
        </p>
        <p className="mt-2 text-sm text-white/90">
          Sell-through{" "}
          <strong className="tabular-nums">{Math.round(summary.percent * 100)}%</strong> porsi yang
          diunggah berhasil diambil.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {secondary.map((c) => (
            <div key={c.label} className="rounded-xl bg-white/10 p-3">
              <dt className="text-xs font-semibold text-white/80">{c.label}</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Tren harian" className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tren harian</h2>
        <SieraCard className="p-4">
          {series.every((d) => d.saved === 0) ? (
            <p className="text-sm text-muted-foreground">
              Belum ada pickup pada rentang ini. Tren muncul setelah tenant memindai serah terima.
            </p>
          ) : (
            <div data-tour="tren" className="overflow-x-auto">
              <div
                className="flex h-32 min-w-[480px] items-end gap-1"
                role="img"
                aria-label={`Tren pickup harian, tertinggi ${maxSaved} porsi dalam sehari`}
              >
                {series.map((d, i) => (
                  <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div
                      title={`${d.day}: ${d.saved} porsi`}
                      className="w-full max-w-6 rounded-t bg-[#2E7D4F]"
                      style={{
                        height: `${Math.max(d.saved > 0 ? 6 : 2, Math.round((d.saved / maxSaved) * 100))}%`,
                      }}
                    />
                    {i % labelEvery === 0 && (
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {Number(d.day.slice(8, 10))}/{Number(d.day.slice(5, 7))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SieraCard>
      </section>

      {csvError && <SieraAlert variant="error">{csvError}</SieraAlert>}

      {rows.length === 0 ? (
        <SieraEmpty
          title="Belum ada aktivitas pada rentang ini"
          hint="Coba rentang yang lebih panjang, atau tunggu tenant mengunggah porsi."
        />
      ) : (
        <SieraCard className="p-4">
          <div className="overflow-x-auto" data-tour="tabel-dampak">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Rekap per gerai pada rentang terpilih</caption>
              <thead>
                <tr className="border-b text-left text-xs font-semibold text-muted-foreground">
                  <th scope="col" className="sticky left-0 bg-card py-2 pr-3">
                    Gerai
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    Diunggah
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    Diambil
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    Sell-through
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right">
                    Revenue
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right">
                    Hemat
                  </th>
                  <th scope="col" className="py-2 text-right">
                    Estimasi kg
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-line">
                {rows.map((r) => (
                  <tr key={r.tenantName}>
                    <td className="sticky left-0 bg-card py-3 pr-3 font-semibold">
                      <Link
                        href="/admin/tenant"
                        className="rounded underline decoration-[#2E7D4F]/40 underline-offset-2 outline-none hover:text-[#1E5A36] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
                      >
                        {r.tenantName}
                      </Link>
                      {best > 0 && r.portionsPickedUp === best && (
                        <span className="ml-2 inline-block rounded-full bg-[#DCEBE0] px-2 py-0.5 align-middle text-[11px] font-bold text-[#1E5A36]">
                          Tertinggi
                        </span>
                      )}
                      {r.portionsPosted > 0 && r.portionsPickedUp === 0 && (
                        <span className="ml-2 inline-block rounded-full bg-[#FEF3C7] px-2 py-0.5 align-middle text-[11px] font-bold text-[#92400E]">
                          Belum diambil
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3">{r.portionsPosted}</td>
                    <td className="py-3 pr-3">{r.portionsPickedUp}</td>
                    <td className="py-3 pr-3">
                      {Math.round(percentSold(r.portionsPickedUp, r.portionsPosted) * 100)}%
                    </td>
                    <td className="py-3 pr-3 text-right">{formatIDR(r.revenue)}</td>
                    <td className="py-3 pr-3 text-right">{formatIDR(r.moneySaved)}</td>
                    <td className="py-3 text-right">
                      {r.wasteKg == null ? "—" : `${r.wasteKg.toFixed(2)} kg`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SieraCard>
      )}

      <Button
        type="button"
        variant="outline"
        data-tour="unduh"
        className="w-fit min-h-11"
        onClick={downloadCsv}
        disabled={exporting}
      >
        {exporting ? (
          <>
            <Spinner />
            Menyiapkan…
          </>
        ) : (
          "Unduh CSV"
        )}
      </Button>
      <GuidedTour
        tourKey="admin"
        steps={[
          {
            target: '[data-tour="rentang"]',
            title: "Atur rentang",
            body: "Default 30 hari. Terapkan untuk muat ulang laporan.",
          },
          {
            target: '[data-tour="tren"]',
            title: "Lihat tren",
            body: "Pickup per hari. Hari kosong = belum ada serah terima.",
          },
          {
            target: '[data-tour="tabel-dampak"]',
            title: "Baca per gerai",
            body: "Sell-through dan kg per gerai. Nama gerai bisa diklik ke Kelola mitra.",
          },
          {
            target: '[data-tour="unduh"]',
            title: "Unduh bukti",
            body: "CSV per gerai untuk laporan BEM/unit kampus.",
          },
        ]}
      />
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { DateField } from "@/components/date-field";
import { GuidedTour } from "@/components/guided-tour";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { percentSold } from "@/lib/domain/metrics";
import { formatIDR } from "@/lib/format";
import { exportCsv } from "./actions";
import type { AdminReportRow } from "./page";

/** Rentang tanggal + tabulasi per-tenant + export CSV (client island). */
export function ImpactClient({
  summary,
  rows,
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

  const cards = [
    { label: "Porsi terselamatkan", value: String(summary.portionsSaved) },
    {
      label: "Sampah makanan terhindar (estimasi)",
      value: summary.wasteKg == null ? "Belum ada data berat" : `${summary.wasteKg.toFixed(1)} kg`,
    },
    { label: "Uang hemat mahasiswa", value: formatIDR(summary.moneySaved) },
    { label: "Pendapatan tambahan tenant", value: formatIDR(summary.revenue) },
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Sell-through:{" "}
        <strong className="text-foreground">{Math.round(summary.percent * 100)}%</strong> porsi yang
        diunggah berhasil diambil.
      </p>

      {csvError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {csvError}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="border-b py-10 text-center">
          <p className="font-semibold">Belum ada aktivitas pada rentang ini</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba rentang yang lebih panjang, atau tunggu tenant mengunggah porsi.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto" data-tour="tabel-dampak">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Rekap per gerai pada rentang terpilih</caption>
            <thead>
              <tr className="border-b text-left text-xs font-semibold text-muted-foreground">
                <th scope="col" className="py-2 pr-3">
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
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.tenantName}>
                  <td className="py-3 pr-3 font-semibold">{r.tenantName}</td>
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
            target: '[data-tour="tabel-dampak"]',
            title: "Baca per gerai",
            body: "Sell-through dan kg per gerai.",
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

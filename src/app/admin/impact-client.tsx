"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [pending, startTransition] = useTransition();
  const [csvError, setCsvError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const defaultFrom = useMemo(() => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }, []);
  const defaultTo = useMemo(() => new Date().toISOString().slice(0, 10), []);

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
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          applyRange(String(form.get("from") ?? defaultFrom), String(form.get("to") ?? defaultTo));
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="from" className="font-semibold">
            Dari
          </Label>
          <Input id="from" name="from" type="date" defaultValue={from} max={defaultTo} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="to" className="font-semibold">
            Sampai
          </Label>
          <Input id="to" name="to" type="date" defaultValue={to} max={defaultTo} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Memuat…" : "Terapkan"}
        </Button>
      </form>

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
        <div className="overflow-x-auto">
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
        className="w-fit"
        onClick={downloadCsv}
        disabled={exporting}
      >
        {exporting ? "Menyiapkan…" : "Unduh CSV"}
      </Button>
    </div>
  );
}

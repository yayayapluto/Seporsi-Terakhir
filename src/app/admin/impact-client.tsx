"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { DateField } from "@/components/date-field";
import { GuidedTour } from "@/components/guided-tour";
import { SieraAlert, SieraCard, SieraEmpty, SieraRailPage, SieraSection } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import { percentSold } from "@/lib/domain/metrics";
import { formatIDR } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
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
  email,
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
  email: string;
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

  function DownloadButton({ tour = true }: { tour?: boolean }) {
    return (
      <Button
        type="button"
        variant="outline"
        data-tour={tour ? "unduh" : undefined}
        className="min-h-11 w-fit"
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
    );
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

  // Progres 12 bulan borang: hari aktif pickup pada rentang + rentang label.
  const activeDays = series.filter((d) => d.saved > 0).length;
  const borangTarget = Math.min(365, series.length);
  const borangPct = borangTarget > 0 ? Math.round((activeDays / borangTarget) * 100) : 0;
  // Top tenant: 3 teratas dari agregat halaman (tanpa query baru).
  const topTenants = [...rows].sort((a, b) => b.portionsPickedUp - a.portionsPickedUp).slice(0, 3);

  return (
    <SieraRailPage
      asideLabel="Siap borang"
      main={
        <>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold tracking-widest text-primary">DAMPAK KAMPUS</p>
            <h1 className="max-md:text-[28px] max-md:leading-[1.15] max-md:tracking-[-0.02em] text-3xl font-bold">
              Dampak penyelamatan
            </h1>
            <p className="text-muted-foreground max-md:text-sm max-md:leading-relaxed">
              Halo <span className="max-md:break-all">{email}</span>. Angka dari pickup yang discan,
              bukan estimasi. Berat = estimasi sampling per menu.
            </p>
          </div>
          <div
            data-tour="rentang"
            className="flex flex-wrap items-end gap-3 max-md:grid max-md:grid-cols-[minmax(0,1fr)] max-md:gap-3"
          >
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
              <strong className="tabular-nums">{Math.round(summary.percent * 100)}%</strong> porsi
              yang diunggah berhasil diambil.
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {secondary.map((c) => (
                <div key={c.label} className="min-w-0 rounded-xl bg-white/10 p-3">
                  <dt className="text-xs font-semibold text-white/80">{c.label}</dt>
                  <dd className="mt-0.5 text-lg font-bold tabular-nums break-words">{c.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label="Tren harian" className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">Tren harian</h2>
            <SieraCard className="p-4">
              {series.every((d) => d.saved === 0) ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada pickup pada rentang ini. Tren muncul setelah tenant memindai serah
                  terima.
                </p>
              ) : (
                <div
                  data-tour="tren"
                  className="overflow-x-auto max-md:overflow-visible max-md:min-w-0"
                >
                  <div
                    className="flex h-32 min-w-[480px] items-end gap-1 max-md:h-56 max-md:min-w-0"
                    role="img"
                    aria-label={`Tren pickup harian, tertinggi ${maxSaved} porsi dalam sehari`}
                  >
                    {series.map((d, i) => {
                      const isLabel = i % labelEvery === 0 || i === series.length - 1;
                      const labelIdx = Math.floor(i / labelEvery);
                      return (
                        <div
                          key={d.day}
                          className="flex h-full min-w-0 flex-1 flex-col items-center"
                        >
                          <div className="flex min-h-0 w-full min-w-0 flex-1 items-end">
                            <div
                              title={`${d.day}: ${d.saved} porsi`}
                              className="w-full max-w-6 rounded-t bg-[#2E7D4F]"
                              style={{
                                height: `${Math.max(d.saved > 0 ? 6 : 2, Math.round((d.saved / maxSaved) * 100))}%`,
                              }}
                            />
                          </div>
                          {isLabel && (
                            <span
                              className={`pt-1 text-[10px] tabular-nums text-muted-foreground max-md:text-xs ${
                                labelIdx % 2 === 1 && i !== series.length - 1 ? "max-md:hidden" : ""
                              }`}
                            >
                              {Number(d.day.slice(8, 10))}/{Number(d.day.slice(5, 7))}
                            </span>
                          )}
                        </div>
                      );
                    })}
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
            <SieraCard className="p-4 max-md:border-0 max-md:bg-transparent max-md:shadow-none max-md:p-0">
              <div className="overflow-x-auto max-md:overflow-visible" data-tour="tabel-dampak">
                <table className="w-full min-w-[640px] text-sm max-md:block max-md:min-w-0">
                  <caption className="sr-only">Rekap per gerai pada rentang terpilih</caption>
                  <thead className="max-md:hidden">
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
                  <tbody className="divide-y divide-dashed divide-line max-md:block max-md:space-y-3 max-md:divide-y-0">
                    {rows.map((r) => (
                      <tr
                        key={r.tenantName}
                        className="max-md:grid max-md:grid-cols-2 max-md:gap-2 max-md:rounded-xl max-md:border max-md:border-[#e3e9e5] max-md:bg-white max-md:p-4"
                      >
                        <td className="sticky left-0 bg-card py-3 pr-3 font-semibold max-md:static max-md:col-span-2 max-md:flex max-md:items-start max-md:gap-2 max-md:py-0 max-md:pr-0">
                          <Link
                            href={ROUTES.adminTenant}
                            className="rounded underline decoration-[#2E7D4F]/40 underline-offset-2 outline-none hover:text-[#1E5A36] focus-visible:ring-2 focus-visible:ring-[#2E7D4F] max-md:min-w-0 max-md:flex-1 max-md:break-words max-md:no-underline max-md:active:bg-muted"
                          >
                            {r.tenantName}
                          </Link>
                          {best > 0 && r.portionsPickedUp === best && (
                            <span className="ml-2 inline-block shrink-0 rounded-full bg-[#DCEBE0] px-2 py-0.5 align-middle text-[11px] font-bold text-[#1E5A36] max-md:ml-0">
                              Tertinggi
                            </span>
                          )}
                          {r.portionsPosted > 0 && r.portionsPickedUp === 0 && (
                            <span className="ml-2 inline-block shrink-0 rounded-full bg-[#FEF3C7] px-2 py-0.5 align-middle text-[11px] font-bold text-[#92400E] max-md:ml-0">
                              Belum diambil
                            </span>
                          )}
                        </td>
                        <td
                          data-label="Diunggah"
                          className="py-3 pr-3 max-md:flex max-md:flex-col max-md:gap-0.5 max-md:rounded-lg max-md:bg-muted max-md:p-2.5 max-md:py-2.5 max-md:pr-2.5 max-md:text-base max-md:font-medium max-md:tabular-nums max-md:break-words max-md:before:content-[attr(data-label)] max-md:before:text-xs max-md:before:font-semibold max-md:before:text-muted-foreground"
                        >
                          {r.portionsPosted}
                        </td>
                        <td
                          data-label="Diambil"
                          className="py-3 pr-3 max-md:flex max-md:flex-col max-md:gap-0.5 max-md:rounded-lg max-md:bg-muted max-md:p-2.5 max-md:py-2.5 max-md:pr-2.5 max-md:text-base max-md:font-medium max-md:tabular-nums max-md:break-words max-md:before:content-[attr(data-label)] max-md:before:text-xs max-md:before:font-semibold max-md:before:text-muted-foreground"
                        >
                          {r.portionsPickedUp}
                        </td>
                        <td
                          data-label="Sell-through"
                          className="py-3 pr-3 max-md:flex max-md:flex-col max-md:gap-0.5 max-md:rounded-lg max-md:bg-muted max-md:p-2.5 max-md:py-2.5 max-md:pr-2.5 max-md:text-base max-md:font-medium max-md:tabular-nums max-md:break-words max-md:before:content-[attr(data-label)] max-md:before:text-xs max-md:before:font-semibold max-md:before:text-muted-foreground"
                        >
                          {Math.round(percentSold(r.portionsPickedUp, r.portionsPosted) * 100)}%
                        </td>
                        <td
                          data-label="Revenue"
                          className="py-3 pr-3 text-right max-md:flex max-md:flex-col max-md:gap-0.5 max-md:rounded-lg max-md:bg-muted max-md:p-2.5 max-md:py-2.5 max-md:pr-2.5 max-md:text-left max-md:text-base max-md:font-medium max-md:tabular-nums max-md:break-words max-md:before:content-[attr(data-label)] max-md:before:text-xs max-md:before:font-semibold max-md:before:text-muted-foreground"
                        >
                          {formatIDR(r.revenue)}
                        </td>
                        <td
                          data-label="Hemat"
                          className="py-3 pr-3 text-right max-md:flex max-md:flex-col max-md:gap-0.5 max-md:rounded-lg max-md:bg-muted max-md:p-2.5 max-md:py-2.5 max-md:pr-2.5 max-md:text-left max-md:text-base max-md:font-medium max-md:tabular-nums max-md:break-words max-md:before:content-[attr(data-label)] max-md:before:text-xs max-md:before:font-semibold max-md:before:text-muted-foreground"
                        >
                          {formatIDR(r.moneySaved)}
                        </td>
                        <td
                          data-label="Estimasi kg"
                          className="py-3 text-right max-md:flex max-md:flex-col max-md:gap-0.5 max-md:rounded-lg max-md:bg-muted max-md:p-2.5 max-md:py-2.5 max-md:pr-2.5 max-md:text-left max-md:text-base max-md:font-medium max-md:tabular-nums max-md:break-words max-md:before:content-[attr(data-label)] max-md:before:text-xs max-md:before:font-semibold max-md:before:text-muted-foreground"
                        >
                          {r.wasteKg == null ? "—" : `${r.wasteKg.toFixed(2)} kg`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SieraCard>
          )}

          <DownloadButton />
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
        </>
      }
      aside={
        <div className="hidden min-w-0 flex-col gap-4 lg:gap-5 xl:flex">
          <SieraSection label="Progres periode 12 bulan">
            <SieraCard className="flex flex-col gap-2 p-4">
              <p className="text-2xl font-extrabold tabular-nums">
                {activeDays}
                <span className="text-sm font-bold text-muted-foreground">
                  {" "}
                  / {borangTarget} hari aktif
                </span>
              </p>
              <div
                className="h-2 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuenow={borangPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progres periode 12 bulan"
              >
                <div
                  className="h-full rounded-full bg-[#2E7D4F]"
                  style={{ width: `${borangPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {from} sampai {to}. Borang butuh 12 bulan bukti jalan.
              </p>
            </SieraCard>
          </SieraSection>
          <SieraSection label="Unduh laporan">
            <SieraCard className="flex flex-col gap-2 p-4">
              <p className="text-sm text-muted-foreground">
                CSV per gerai siap lampir borang periode ini.
              </p>
              <DownloadButton tour={false} />
            </SieraCard>
          </SieraSection>
          <SieraSection
            label={`Top tenant (${topTenants.length})`}
            action={
              <Link
                href={ROUTES.adminTenant}
                className={buttonVariants({ size: "sm", className: "shrink-0" })}
              >
                Kelola
              </Link>
            }
          >
            {topTenants.length === 0 ? (
              <SieraCard className="p-4">
                <p className="text-sm text-muted-foreground">Belum ada pickup pada rentang ini.</p>
              </SieraCard>
            ) : (
              <SieraCard className="flex flex-col divide-y divide-dashed divide-line px-4">
                {topTenants.map((t, i) => (
                  <div key={t.tenantName} className="flex items-center gap-3 py-3">
                    <span className="text-sm font-extrabold tabular-nums text-[#1E5A36]">
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate max-md:whitespace-normal max-md:[overflow-wrap:anywhere] text-sm font-bold text-[#1C2826]">
                        {t.tenantName}
                      </span>
                      <span className="truncate max-md:whitespace-normal max-md:[overflow-wrap:anywhere] text-xs text-muted-foreground">
                        {t.portionsPickedUp} diambil · {t.portionsPosted} diunggah
                      </span>
                    </span>
                  </div>
                ))}
              </SieraCard>
            )}
          </SieraSection>
        </div>
      }
    />
  );
}

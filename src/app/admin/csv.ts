/** CSV laporan per-tenant untuk dashboard admin. Pure — tanpa import server. */

export interface CsvRow {
  tenantName: string;
  portionsPosted: number;
  portionsPickedUp: number;
  revenue: number;
  moneySaved: number;
  wasteGrams: number;
}

export const CSV_HEADER = "Gerai,Diunggah,Diambil,Revenue,Hemat,EstimasiKg";

/**
 * Escape satu sel CSV:
 * - karakter formula (=, +, -, @) di awal → prefix `'` supaya Excel/Sheets
 *   tidak mengeksekusi `=CMD|...` dari nama tenant.
 * - nilai berisi koma/tanda kutip/baris baru → dibungkus kutip, kutip digandakan.
 */
export function escapeCsv(value: string): string {
  const escaped = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(escaped) ? `"${escaped.replaceAll('"', '""')}"` : escaped;
}

export function buildTenantCsv(rows: CsvRow[]): string {
  const lines = [CSV_HEADER];
  for (const r of rows) {
    lines.push(
      [
        escapeCsv(r.tenantName),
        r.portionsPosted,
        r.portionsPickedUp,
        r.revenue,
        r.moneySaved,
        (r.wasteGrams / 1000).toFixed(2),
      ].join(","),
    );
  }
  return lines.join("\n");
}

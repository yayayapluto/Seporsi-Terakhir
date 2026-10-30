import { APP_TIMEZONE } from "@/lib/domain/constants";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Format an integer IDR amount, e.g. 9000 -> "Rp9.000". */
export function formatIDR(amountIdr: number): string {
  return idr.format(amountIdr);
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: APP_TIMEZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Format a date in Asia/Jakarta, e.g. "27 Okt, 13.00". */
export function formatDateTimeWIB(date: Date): string {
  return dateTime.format(date);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Sekarang sebagai jam dinding WIB (tanpa offset, untuk default form). */
export function nowInWib(now: Date = new Date()): Date {
  return new Date(now.toLocaleString("en-US", { timeZone: APP_TIMEZONE }));
}

/** Batas hari WIB [from 00:00, to+1d 00:00) → UTC ISO untuk filter query. */
export function wibDayRangeUtc(
  fromLocal: string,
  toLocal: string,
): { fromUtc: string; toExclusive: string } {
  const fromUtc = new Date(`${fromLocal}T00:00:00+07:00`).toISOString();
  const toExclusive = new Date(
    new Date(`${toLocal}T00:00:00+07:00`).getTime() + 86_400_000,
  ).toISOString();
  return { fromUtc, toExclusive };
}

/** Rentang hari ini WIB: todayLocal + dayStartUtc + dayEndIso. */
export function wibTodayRange(now: Date = new Date()): {
  todayLocal: string;
  dayStartUtc: string;
  dayEndIso: string;
} {
  const w = nowInWib(now);
  const todayLocal = `${w.getFullYear()}-${pad2(w.getMonth() + 1)}-${pad2(w.getDate())}`;
  const { fromUtc: dayStartUtc, toExclusive: dayEndIso } = wibDayRangeUtc(todayLocal, todayLocal);
  return { todayLocal, dayStartUtc, dayEndIso };
}

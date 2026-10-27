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

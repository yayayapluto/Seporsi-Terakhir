import { SELL_WINDOW_MAX_MINUTES, SELL_WINDOW_MIN_MINUTES } from "@/lib/domain/constants";

export function isValidSellWindow(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= SELL_WINDOW_MIN_MINUTES &&
    minutes <= SELL_WINDOW_MAX_MINUTES
  );
}

/** Expiry = cookedAt + sellWindowMinutes. Returns null on invalid window. */
export function computeExpiry(cookedAt: Date, sellWindowMinutes: number): Date | null {
  if (!isValidSellWindow(sellWindowMinutes)) return null;
  if (Number.isNaN(cookedAt.getTime())) return null;
  return new Date(cookedAt.getTime() + sellWindowMinutes * 60_000);
}

export interface OrderabilityInput {
  cookedAt: Date;
  sellWindowMinutes: number;
  releaseAt: Date;
  now: Date;
  quantityRemaining: number;
}

/**
 * A portion is orderable when: valid window, released, not expired,
 * and quota remains. Never throws — invalid inputs return false.
 */
export function isPortionOrderable(input: OrderabilityInput): boolean {
  const { cookedAt, sellWindowMinutes, releaseAt, now, quantityRemaining } = input;
  if (!isValidSellWindow(sellWindowMinutes)) return false;
  if (!Number.isInteger(quantityRemaining) || quantityRemaining <= 0) return false;
  const expiry = computeExpiry(cookedAt, sellWindowMinutes);
  if (expiry === null) return false;
  if (now.getTime() < releaseAt.getTime()) return false;
  if (now.getTime() >= expiry.getTime()) return false;
  return true;
}

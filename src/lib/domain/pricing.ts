import { DISCOUNT_PRICE_RATIO_DEFAULT, PRICE_ROUNDING_IDR } from "@/lib/domain/constants";

/**
 * Suggest a discount price: 45% of normal price, rounded to nearest Rp500.
 * Returns null for non-positive, non-integer, or Rp1 input (no valid discount).
 */
export function suggestDiscountPrice(normalPriceIdr: number): number | null {
  if (!Number.isInteger(normalPriceIdr) || normalPriceIdr <= 1) return null;
  const rounded =
    Math.round((normalPriceIdr * DISCOUNT_PRICE_RATIO_DEFAULT) / PRICE_ROUNDING_IDR) *
    PRICE_ROUNDING_IDR;
  const floored = Math.max(PRICE_ROUNDING_IDR, rounded);
  if (floored < normalPriceIdr) return floored;
  // Normal price at or below the rounding step: stay strictly below it.
  const stepped = Math.floor((normalPriceIdr - 1) / PRICE_ROUNDING_IDR) * PRICE_ROUNDING_IDR;
  return stepped >= PRICE_ROUNDING_IDR ? stepped : normalPriceIdr - 1;
}

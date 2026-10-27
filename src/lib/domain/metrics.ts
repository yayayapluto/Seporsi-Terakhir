/**
 * Impact metrics per product brief. All counts are of scanned pickups.
 * Zero denominators yield 0; missing avg weight yields null for waste kg.
 */

/** Portions saved = count of scanned pickups. */
export function portionsSaved(pickedUpOrders: number): number {
  return Math.max(0, Math.floor(pickedUpOrders));
}

/** Food waste prevented (kg) = portions sold × avg weight per menu. */
export function wastePreventedKg(
  portionsSold: number,
  avgWeightGrams: number | null | undefined,
): number | null {
  if (avgWeightGrams == null || avgWeightGrams <= 0 || portionsSold <= 0) return null;
  if (avgWeightGrams <= 0) return null;
  return (portionsSold * avgWeightGrams) / 1000;
}

/** Student money saved = (normal − discount) × portions. */
export function moneySaved(
  portions: number,
  normalPriceIdr: number,
  discountPriceIdr: number,
): number {
  if (portions <= 0) return 0;
  return Math.max(0, portions * (normalPriceIdr - discountPriceIdr));
}

/** Extra tenant revenue = total transaction value of picked-up portions. */
export function extraTenantRevenue(portions: number, discountPriceIdr: number): number {
  if (portions <= 0 || discountPriceIdr <= 0) return 0;
  return portions * discountPriceIdr;
}

/** % of leftovers sold = portions sold / portions posted (0 when posted = 0). */
export function percentSold(portionsSold: number, portionsPosted: number): number {
  if (portionsPosted <= 0) return 0;
  return Math.min(1, Math.max(0, portionsSold / portionsPosted));
}

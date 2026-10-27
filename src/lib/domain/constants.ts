// Domain constants (BR-2, BR-6). Single source of truth — see docs/decisions.md.

/** Minimum sell window after cook time, in minutes (BR-2). */
export const SELL_WINDOW_MIN_MINUTES = 120;
/** Maximum sell window after cook time, in minutes (BR-2). */
export const SELL_WINDOW_MAX_MINUTES = 240;
/** Default sell window after cook time, in minutes (BR-2). */
export const SELL_WINDOW_DEFAULT_MINUTES = 180;

/** Discount price floor as fraction of normal price (BR-6: 40%). */
export const DISCOUNT_PRICE_RATIO_MIN = 0.4;
/** Discount price ceiling as fraction of normal price (BR-6: 50%). */
export const DISCOUNT_PRICE_RATIO_MAX = 0.5;
/** Default discount ratio; normalPrice * 0.45 rounded to nearest PRICE_ROUNDING_IDR. */
export const DISCOUNT_PRICE_RATIO_DEFAULT = 0.45;
/** Discount prices are rounded to the nearest Rp500. */
export const PRICE_ROUNDING_IDR = 500;

/** All dates/times are interpreted in Asia/Jakarta; expiry computed from timestamptz. */
export const APP_TIMEZONE = "Asia/Jakarta";

/** Max quantity per order [usulan — see docs/decisions.md]. */
export const MAX_QUANTITY_PER_ORDER = 2;

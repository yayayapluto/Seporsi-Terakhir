import { describe, expect, it } from "vitest";
import { PRICE_ROUNDING_IDR } from "@/lib/domain/constants";
import { suggestDiscountPrice } from "@/lib/domain/pricing";

describe("suggestDiscountPrice", () => {
  it("applies the 45% ratio rounded to nearest Rp500", () => {
    // 20000 * 0.45 = 9000
    expect(suggestDiscountPrice(20000)).toBe(9000);
    // 15000 * 0.45 = 6750 -> 7000
    expect(suggestDiscountPrice(15000)).toBe(7000);
    // 12000 * 0.45 = 5400 -> 5500
    expect(suggestDiscountPrice(12000)).toBe(5500);
  });

  it("is always strictly less than the normal price", () => {
    expect(suggestDiscountPrice(1)).toBeNull();
    for (const price of [2, 499, 500, 501, 999, 1000, 1100, 100000]) {
      const suggestion = suggestDiscountPrice(price);
      expect(suggestion).not.toBeNull();
      expect(suggestion as number).toBeLessThan(price);
      expect(suggestion as number).toBeGreaterThan(0);
    }
  });

  it("returns multiples of Rp500 for normal prices above the rounding step", () => {
    for (const price of [501, 1000, 7777, 25000, 99999]) {
      const suggestion = suggestDiscountPrice(price) as number;
      expect(suggestion % PRICE_ROUNDING_IDR).toBe(0);
    }
  });

  it("rejects non-positive and non-integer input", () => {
    expect(suggestDiscountPrice(0)).toBeNull();
    expect(suggestDiscountPrice(-5000)).toBeNull();
    expect(suggestDiscountPrice(12.5)).toBeNull();
    expect(suggestDiscountPrice(Number.NaN)).toBeNull();
  });
});

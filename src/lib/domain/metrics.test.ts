import { describe, expect, it } from "vitest";
import {
  extraTenantRevenue,
  moneySaved,
  percentSold,
  portionsSaved,
  wastePreventedKg,
} from "@/lib/domain/metrics";

describe("impact metrics", () => {
  it("counts portions saved", () => {
    expect(portionsSaved(7)).toBe(7);
    expect(portionsSaved(0)).toBe(0);
  });

  it("computes waste prevented in kg", () => {
    // 10 portions x 300g = 3kg
    expect(wastePreventedKg(10, 300)).toBe(3);
    expect(wastePreventedKg(10, null)).toBeNull();
    expect(wastePreventedKg(10, undefined)).toBeNull();
    expect(wastePreventedKg(0, 300)).toBeNull();
  });

  it("computes student money saved", () => {
    expect(moneySaved(4, 20000, 9000)).toBe(44000);
    expect(moneySaved(0, 20000, 9000)).toBe(0);
  });

  it("computes extra tenant revenue", () => {
    expect(extraTenantRevenue(4, 9000)).toBe(36000);
    expect(extraTenantRevenue(0, 9000)).toBe(0);
  });

  it("computes percent sold with zero-denominator guard", () => {
    expect(percentSold(8, 10)).toBeCloseTo(0.8);
    expect(percentSold(0, 0)).toBe(0);
    expect(percentSold(5, 0)).toBe(0);
  });
});

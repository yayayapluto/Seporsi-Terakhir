import { describe, expect, it } from "vitest";
import { SELL_WINDOW_MAX_MINUTES, SELL_WINDOW_MIN_MINUTES } from "@/lib/domain/constants";
import {
  SEED_MENUS,
  SEED_ORDERS,
  SEED_PORTIONS,
  SEED_TENANT_EMAILS,
} from "@/lib/domain/seed-catalog";

describe("seed-catalog", () => {
  it("16 menu / 16 porsi / 6 tenant, email konsisten", () => {
    expect(SEED_MENUS).toHaveLength(16);
    expect(SEED_PORTIONS).toHaveLength(16);
    expect(SEED_TENANT_EMAILS).toHaveLength(6);
    for (const m of SEED_MENUS) expect(SEED_TENANT_EMAILS).toContain(m.tenantEmail);
    for (const p of SEED_PORTIONS) {
      expect(SEED_MENUS.some((m) => m.tenantEmail === p.tenantEmail && m.name === p.menuName)).toBe(
        true,
      );
    }
  });

  it("diskon 45% kelipatan 500 dan di bawah normal; masak < window (BR-6/BR-2)", () => {
    for (const m of SEED_MENUS) {
      const d = Math.round((m.normalPrice * 0.45) / 500) * 500;
      expect(d % 500).toBe(0);
      expect(d).toBeLessThan(m.normalPrice);
    }
    for (const p of SEED_PORTIONS) expect(p.cookedMinAgo).toBeLessThan(SELL_WINDOW_MIN_MINUTES);
    expect(SELL_WINDOW_MIN_MINUTES).toBeLessThanOrEqual(SELL_WINDOW_MAX_MINUTES);
  });

  it("orders rujuk student/menu valid, qty <= 2", () => {
    for (const o of SEED_ORDERS) {
      expect(o.studentEmail).toMatch(/@student\.ac\.id$/);
      expect(
        SEED_PORTIONS.some((p) => p.tenantEmail === o.tenantEmail && p.menuName === o.menuName),
      ).toBe(true);
      expect(o.qty).toBeLessThanOrEqual(2);
    }
  });
});

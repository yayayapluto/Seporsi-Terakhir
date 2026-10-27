import { describe, expect, it } from "vitest";
import { computeExpiry, isPortionOrderable } from "@/lib/domain/expiry";

const COOKED = new Date("2026-10-27T10:00:00+07:00");

describe("computeExpiry", () => {
  it("adds the sell window to cook time", () => {
    expect(computeExpiry(COOKED, 180)?.toISOString()).toBe("2026-10-27T06:00:00.000Z");
  });

  it("rejects windows outside 120-240 minutes", () => {
    expect(computeExpiry(COOKED, 119)).toBeNull();
    expect(computeExpiry(COOKED, 241)).toBeNull();
    expect(computeExpiry(COOKED, 180.5)).toBeNull();
  });

  it("rejects invalid dates", () => {
    expect(computeExpiry(new Date(Number.NaN), 180)).toBeNull();
  });
});

describe("isPortionOrderable", () => {
  const base = {
    cookedAt: COOKED,
    sellWindowMinutes: 180,
    releaseAt: new Date("2026-10-27T10:05:00+07:00"),
    now: new Date("2026-10-27T11:00:00+07:00"),
    quantityRemaining: 3,
  };

  it("is orderable inside the window with quota", () => {
    expect(isPortionOrderable(base)).toBe(true);
  });

  it("is false when expired", () => {
    expect(isPortionOrderable({ ...base, now: new Date("2026-10-27T13:00:01+07:00") })).toBe(false);
  });

  it("is false before release", () => {
    expect(isPortionOrderable({ ...base, now: new Date("2026-10-27T10:04:00+07:00") })).toBe(false);
  });

  it("is false when quota is zero", () => {
    expect(isPortionOrderable({ ...base, quantityRemaining: 0 })).toBe(false);
  });

  it("is false for an invalid window", () => {
    expect(isPortionOrderable({ ...base, sellWindowMinutes: 60 })).toBe(false);
  });
});

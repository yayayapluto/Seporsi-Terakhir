import { describe, expect, it } from "vitest";
import { nowInWib, wibDayRangeUtc, wibTodayRange } from "./format";

describe("wibDayRangeUtc", () => {
  it("memetakan batas hari WIB ke UTC", () => {
    expect(wibDayRangeUtc("2026-10-30", "2026-10-30")).toEqual({
      fromUtc: "2026-10-29T17:00:00.000Z",
      toExclusive: "2026-10-30T17:00:00.000Z",
    });
  });
  it("rentang multi-hari memakai to+1d", () => {
    const r = wibDayRangeUtc("2026-10-01", "2026-10-30");
    expect(r.fromUtc).toBe("2026-09-30T17:00:00.000Z");
    expect(r.toExclusive).toBe("2026-10-30T17:00:00.000Z");
  });
});

describe("wibTodayRange", () => {
  it("konsisten dengan batas manual", () => {
    const now = new Date("2026-10-30T10:00:00Z");
    const { todayLocal, dayStartUtc, dayEndIso } = wibTodayRange(now);
    expect(todayLocal).toBe("2026-10-30");
    expect({ fromUtc: dayStartUtc, toExclusive: dayEndIso }).toEqual(
      wibDayRangeUtc(todayLocal, todayLocal),
    );
  });
});

describe("nowInWib", () => {
  it("menggeser ke jam dinding Jakarta", () => {
    expect(nowInWib(new Date("2026-10-30T10:00:00Z")).getHours()).toBe(17);
  });
});

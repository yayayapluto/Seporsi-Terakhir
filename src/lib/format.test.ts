import { describe, expect, it } from "vitest";
import { formatSisaMenit, namaToInitials, nowInWib, wibDayRangeUtc, wibTodayRange } from "./format";

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

describe("namaToInitials", () => {
  it("ambil 2 huruf depan kapital", () => {
    expect(namaToInitials("Ayu Lestari Putri")).toBe("AL");
    expect(namaToInitials("  budi ")).toBe("B");
    expect(namaToInitials("")).toBe("");
  });
});

describe("formatSisaMenit", () => {
  it("menit < 60 tetap menit", () => {
    expect(formatSisaMenit(0)).toBe("0 mnt");
    expect(formatSisaMenit(5)).toBe("5 mnt");
    expect(formatSisaMenit(59)).toBe("59 mnt");
  });
  it("60 ditampilkan sebagai jam", () => {
    expect(formatSisaMenit(60)).toBe("1 jam");
    expect(formatSisaMenit(120)).toBe("2 jam");
  });
  it("campuran jam dan menit", () => {
    expect(formatSisaMenit(70)).toBe("1 jam 10 mnt");
    expect(formatSisaMenit(90)).toBe("1 jam 30 mnt");
    expect(formatSisaMenit(125)).toBe("2 jam 5 mnt");
  });
  it("batas negatif/NaN aman", () => {
    expect(formatSisaMenit(-10)).toBe("0 mnt");
    expect(formatSisaMenit(NaN)).toBe("0 mnt");
  });
});

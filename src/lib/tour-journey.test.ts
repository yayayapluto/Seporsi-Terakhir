import { describe, expect, it } from "vitest";
import { getJourneyNext, parseTourParams, shouldAutoChain } from "@/lib/tour-journey";

describe("parseTourParams", () => {
  it("starts nothing without params", () => {
    expect(parseTourParams({})).toEqual({ forced: false, journey: false, entryStep: null });
  });

  it("replays a single tour on mode=onboarding", () => {
    expect(parseTourParams({ mode: "onboarding" })).toEqual({
      forced: true,
      journey: false,
      entryStep: null,
    });
  });

  it("starts the chain on panduan=rantai", () => {
    expect(parseTourParams({ panduan: "rantai" })).toEqual({
      forced: true,
      journey: true,
      entryStep: null,
    });
  });

  it("reads langkah as entry index", () => {
    expect(parseTourParams({ panduan: "rantai", langkah: "2" })).toEqual({
      forced: true,
      journey: true,
      entryStep: 2,
    });
    expect(parseTourParams({ panduan: "rantai", langkah: "x" }).entryStep).toBeNull();
  });

  it("still honors legacy chaining=true", () => {
    expect(parseTourParams({ mode: "onboarding", chaining: "true" }).journey).toBe(true);
  });
});

describe("getJourneyNext", () => {
  it("chains with pretty params", () => {
    expect(getJourneyNext("/beranda")).toBe("/katalog?panduan=rantai&langkah=0");
    expect(getJourneyNext("/katalog")).toBe("/pesanan?panduan=rantai&langkah=0");
    expect(getJourneyNext("/pesanan")).toBe("/profil?panduan=rantai&langkah=0");
    expect(getJourneyNext("/profil")).toBeNull();
  });

  it("returns null outside the chain", () => {
    expect(getJourneyNext("/")).toBeNull();
    expect(getJourneyNext("/tenant")).toBeNull();
    expect(getJourneyNext("/katalog/abc")).toBeNull();
  });
});

describe("shouldAutoChain", () => {
  it("true only for new users on clean URLs", () => {
    expect(shouldAutoChain(true, false)).toBe(true);
    expect(shouldAutoChain(true, true)).toBe(false);
    expect(shouldAutoChain(false, false)).toBe(false);
  });
});

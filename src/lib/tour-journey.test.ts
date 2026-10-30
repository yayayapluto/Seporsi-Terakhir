import { describe, expect, it } from "vitest";
import { getJourneyNext, parseTourParams, shouldAutoChain } from "@/lib/tour-journey";

describe("parseTourParams", () => {
  it("starts nothing without params", () => {
    expect(parseTourParams({})).toEqual({
      forced: false,
      journey: false,
      chaining: false,
      entryStep: null,
    });
  });

  it("replays a single tour on mode=onboarding", () => {
    expect(parseTourParams({ mode: "onboarding" })).toEqual({
      forced: true,
      journey: false,
      chaining: false,
      entryStep: null,
    });
  });

  it("runs the chained tour on mode=onboarding&chaining=true", () => {
    expect(parseTourParams({ mode: "onboarding", chaining: "true" })).toEqual({
      forced: true,
      journey: true,
      chaining: true,
      entryStep: null,
    });
  });

  it("reads lastStep as entry index", () => {
    expect(parseTourParams({ mode: "onboarding", chaining: "true", lastStep: "2" })).toEqual({
      forced: true,
      journey: true,
      chaining: true,
      entryStep: 2,
    });
    expect(parseTourParams({ mode: "onboarding", lastStep: "x" }).entryStep).toBeNull();
  });
});

describe("shouldAutoChain", () => {
  it("true hanya untuk new user di URL bersih", () => {
    expect(shouldAutoChain(true, false)).toBe(true);
    expect(shouldAutoChain(true, true)).toBe(false);
    expect(shouldAutoChain(false, false)).toBe(false);
  });
});

describe("getJourneyNext", () => {
  it("chains beranda -> katalog -> pesanan -> profil -> end", () => {
    expect(getJourneyNext("/beranda")).toBe("/katalog?mode=onboarding&chaining=true&lastStep=0");
    expect(getJourneyNext("/katalog")).toBe("/pesanan?mode=onboarding&chaining=true&lastStep=0");
    expect(getJourneyNext("/pesanan")).toBe("/profil?mode=onboarding&chaining=true&lastStep=0");
    expect(getJourneyNext("/profil")).toBeNull();
  });

  it("returns null outside the journey", () => {
    expect(getJourneyNext("/")).toBeNull();
    expect(getJourneyNext("/tenant")).toBeNull();
    expect(getJourneyNext("/katalog/abc")).toBeNull();
  });
});

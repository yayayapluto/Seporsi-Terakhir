import { describe, expect, it } from "vitest";
import { getJourneyNext, getReplayNext, parseTourParams } from "@/lib/tour-journey";

describe("parseTourParams", () => {
  it("starts nothing without params", () => {
    expect(parseTourParams({})).toEqual({ forced: false, journey: false });
  });

  it("replays a single tour on mode=onboarding", () => {
    expect(parseTourParams({ mode: "onboarding" })).toEqual({ forced: true, journey: false });
  });

  it("runs the chained journey on tour=journey", () => {
    expect(parseTourParams({ tour: "journey" })).toEqual({ forced: true, journey: true });
  });
});

describe("getJourneyNext", () => {
  it("chains beranda -> katalog -> pesanan -> profil -> end", () => {
    expect(getJourneyNext("/beranda")).toBe("/katalog?tour=journey");
    expect(getJourneyNext("/katalog")).toBe("/pesanan?tour=journey");
    expect(getJourneyNext("/pesanan")).toBe("/profil?tour=journey");
    expect(getJourneyNext("/profil")).toBeNull();
  });

  it("returns null outside the journey", () => {
    expect(getJourneyNext("/")).toBeNull();
    expect(getJourneyNext("/tenant")).toBeNull();
    expect(getJourneyNext("/katalog/abc")).toBeNull();
  });
});

describe("getReplayNext", () => {
  it("chains replays with mode=onboarding", () => {
    expect(getReplayNext("/beranda")).toBe("/katalog?mode=onboarding");
    expect(getReplayNext("/katalog")).toBe("/pesanan?mode=onboarding");
    expect(getReplayNext("/pesanan")).toBe("/profil?mode=onboarding");
    expect(getReplayNext("/profil")).toBeNull();
    expect(getReplayNext("/tenant")).toBeNull();
  });
});

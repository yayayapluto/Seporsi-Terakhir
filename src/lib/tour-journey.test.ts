import { beforeEach, describe, expect, it } from "vitest";
import {
  getChainLabel,
  getJourneyNext,
  isChainActive,
  parseTourParams,
  setChainActive,
  shouldAutoChain,
} from "@/lib/tour-journey";

function fakeStorage() {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe("parseTourParams", () => {
  it("starts nothing without params", () => {
    expect(parseTourParams({})).toEqual({ forced: false, journey: false });
  });

  it("replays a single tour on mode=onboarding", () => {
    expect(parseTourParams({ mode: "onboarding" })).toEqual({ forced: true, journey: false });
  });

  it("starts the chain on panduan=rantai", () => {
    expect(parseTourParams({ panduan: "rantai" })).toEqual({ forced: true, journey: true });
  });

  it("replays once on panduan=mulai", () => {
    expect(parseTourParams({ panduan: "mulai" })).toEqual({ forced: true, journey: false });
  });

  it("still honors legacy tour=journey and chaining=true", () => {
    expect(parseTourParams({ tour: "journey" })).toEqual({ forced: true, journey: true });
    expect(parseTourParams({ mode: "onboarding", chaining: "true" }).journey).toBe(true);
  });
});

describe("getJourneyNext", () => {
  it("chains with clean URLs (no params)", () => {
    expect(getJourneyNext("/beranda")).toBe("/katalog");
    expect(getJourneyNext("/katalog")).toBe("/pesanan");
    expect(getJourneyNext("/pesanan")).toBe("/profil");
    expect(getJourneyNext("/profil")).toBeNull();
  });

  it("returns null outside the chain", () => {
    expect(getJourneyNext("/")).toBeNull();
    expect(getJourneyNext("/tenant")).toBeNull();
    expect(getJourneyNext("/katalog/abc")).toBeNull();
  });
});

describe("getChainLabel", () => {
  it("labels each chain page", () => {
    expect(getChainLabel("/beranda")).toBe("Bagian 1 dari 4 · Beranda");
    expect(getChainLabel("/katalog")).toBe("Bagian 2 dari 4 · Katalog");
    expect(getChainLabel("/pesanan")).toBe("Bagian 3 dari 4 · Pesanan");
    expect(getChainLabel("/profil")).toBe("Bagian 4 dari 4 · Akun");
    expect(getChainLabel("/tenant")).toBeUndefined();
  });
});

describe("shouldAutoChain", () => {
  it("true only for new users on clean URLs", () => {
    expect(shouldAutoChain(true, false)).toBe(true);
    expect(shouldAutoChain(true, true)).toBe(false);
    expect(shouldAutoChain(false, false)).toBe(false);
  });
});

describe("chain session", () => {
  beforeEach(() => {
    fakeStorage();
  });

  it("inactive by default, active after set, cleared after unset", () => {
    expect(isChainActive()).toBe(false);
    setChainActive(true);
    expect(isChainActive()).toBe(true);
    setChainActive(false);
    expect(isChainActive()).toBe(false);
  });

  it("expires stale chains", () => {
    setChainActive(true);
    const eightDays = 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem("seporsi-tour-chain", String(Date.now() - eightDays));
    expect(isChainActive()).toBe(false);
  });
});

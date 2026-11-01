import { describe, expect, it } from "vitest";
import { emptyCatalogHint } from "@/lib/domain/catalog-hint";

describe("emptyCatalogHint", () => {
  it("follows the operational rhythm across the day", () => {
    expect(emptyCatalogHint(9)).toMatch(/15\.30–16\.30 nanti/);
    expect(emptyCatalogHint(14)).toMatch(/sebentar lagi/);
    expect(emptyCatalogHint(16)).toMatch(/lagi posting/);
    expect(emptyCatalogHint(18)).toMatch(/hampir tutup/);
    expect(emptyCatalogHint(21)).toMatch(/besok/);
  });

  it("falls back on invalid hour", () => {
    expect(emptyCatalogHint(Number.NaN)).toMatch(/15\.30–16\.30/);
    expect(emptyCatalogHint(-1)).toMatch(/15\.30–16\.30/);
  });
});

import { describe, expect, it } from "vitest";
import { buildTenantCsv, CSV_HEADER, escapeCsv } from "./csv";

describe("escapeCsv", () => {
  it("prefixes formula-like leading characters", () => {
    expect(escapeCsv("=CMD|'!A0")).toBe("'=CMD|'!A0");
    expect(escapeCsv("+1+2")).toBe("'+1+2");
    expect(escapeCsv("-1-1")).toBe("'-1-1");
    expect(escapeCsv("@SUM(1)")).toBe("'@SUM(1)");
  });

  it("leaves normal text untouched", () => {
    expect(escapeCsv("Warteg Barokah")).toBe("Warteg Barokah");
    expect(escapeCsv("Nasi ayam — pedas")).toBe("Nasi ayam — pedas");
  });

  it("quotes cells containing commas, quotes, newlines", () => {
    expect(escapeCsv('Kantin "A", blok B')).toBe('"Kantin ""A"", blok B"');
    expect(escapeCsv("baris\nbaru")).toBe('"baris\nbaru"');
  });

  it("prefixes formula char AND quotes when both apply", () => {
    expect(escapeCsv("=1,2")).toBe('"\'=1,2"');
  });

  it("blocks tab- and CR-prefixed formula injection", () => {
    expect(escapeCsv("\t=1+1")).toBe("'\t=1+1");
    // \r triggers quote-wrapping too — prefix still neutralizes the formula.
    expect(escapeCsv("\r=1+1")).toBe(`"'\r=1+1"`);
  });
});

describe("buildTenantCsv", () => {
  it("writes header then one row per tenant", () => {
    const csv = buildTenantCsv([
      {
        tenantName: "Warteg Barokah",
        portionsPosted: 10,
        portionsPickedUp: 8,
        revenue: 96000,
        moneySaved: 48000,
        wasteGrams: 2800,
      },
    ]);
    expect(csv).toBe(`${CSV_HEADER}\nWarteg Barokah,10,8,96000,48000,2.80`);
  });

  it("converts waste grams to kg with 2 decimals", () => {
    const csv = buildTenantCsv([
      {
        tenantName: "T",
        portionsPosted: 1,
        portionsPickedUp: 1,
        revenue: 0,
        moneySaved: 0,
        wasteGrams: 500,
      },
    ]);
    expect(csv.split("\n")[1]).toContain("0.50");
  });

  it("escapes tenant name with formula prefix", () => {
    const csv = buildTenantCsv([
      {
        tenantName: "=Korban",
        portionsPosted: 1,
        portionsPickedUp: 0,
        revenue: 0,
        moneySaved: 0,
        wasteGrams: 0,
      },
    ]);
    expect(csv.split("\n")[1]).toContain("'=Korban");
  });
});

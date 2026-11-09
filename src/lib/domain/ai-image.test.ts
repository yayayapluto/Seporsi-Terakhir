import { describe, expect, it } from "vitest";
import { buildMenuPrompt } from "./ai-image";

describe("buildMenuPrompt", () => {
  it("menyertakan nama menu apa adanya", () => {
    expect(buildMenuPrompt("Mie Ayam")).toContain("Mie Ayam");
  });

  it("menerjemahkan hidangan Indonesia yang dikenal ke deskriptor visual", () => {
    const p = buildMenuPrompt("Mie Ayam").toLowerCase();
    expect(p).toContain("chicken noodle");
    expect(p).toContain("mustard greens");
  });

  it("mengenali nama menu yang mengandung kata kunci (tidak peka huruf besar)", () => {
    expect(buildMenuPrompt("NASI GORENG SPESIAL").toLowerCase()).toContain("fried rice");
    expect(buildMenuPrompt("bakso urat").toLowerCase()).toContain("meatball");
  });

  it("tetap memakai nama menu untuk hidangan yang tidak dikenal", () => {
    const p = buildMenuPrompt("Rendang Sapi Spesial");
    expect(p).toContain("Rendang Sapi Spesial");
    expect(p).toContain("no text");
  });

  it("selalu di bawah 500 karakter agar lolos validasi body", () => {
    const long = `Menu ${"sangat ".repeat(70)}panjang`;
    expect(buildMenuPrompt(long).length).toBeLessThanOrEqual(500);
  });
});

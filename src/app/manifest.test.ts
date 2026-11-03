import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("pwa manifest", () => {
  it("installable: standalone, start di root, tema hijau primer", () => {
    const m = manifest();
    expect(m.name).toBe("Seporsi Terakhir");
    expect(m.short_name).toBe("Seporsi");
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#2E7D4F");
    expect(m.background_color).toBe("#ffffff");
    expect(m.lang).toBe("id");
  });

  it("sediakan ikon 192, 512, dan maskable 512", () => {
    const icons = manifest().icons ?? [];
    const bySrc: Record<string, (typeof icons)[number]> = {};
    for (const i of icons) bySrc[i.src] = i;
    expect(bySrc["/icons/icon-192.png"]?.sizes).toBe("192x192");
    expect(bySrc["/icons/icon-512.png"]?.sizes).toBe("512x512");
    const maskable = bySrc["/icons/icon-maskable-512.png"];
    expect(maskable?.sizes).toBe("512x512");
    expect(maskable?.purpose).toBe("maskable");
  });
});

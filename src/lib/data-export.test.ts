import { describe, expect, it } from "vitest";
import { buildDataExport } from "@/lib/data-export";

describe("buildDataExport", () => {
  it("membentuk paket JSON tanpa field sensitif", () => {
    const out = buildDataExport({
      profile: { id: "u1", email: "a@b.c", full_name: "Ayu", role: "student" },
      orders: [{ id: "o1", status: "picked_up", quantity: 2, discount_price_snapshot: 5000 }],
      tenant: null,
    });
    expect(out.exportedAt).toBeTypeOf("string");
    expect(out.profile.email).toBe("a@b.c");
    expect(out.orders).toHaveLength(1);
    expect(JSON.stringify(out)).not.toContain("password");
    expect(JSON.stringify(out)).not.toContain("access_token");
  });

  it("menyertakan data kantin bila tenant", () => {
    const out = buildDataExport({
      profile: { id: "u2", email: "t@b.c", full_name: "Tono", role: "tenant" },
      orders: [],
      tenant: { name: "Warteg", menus: [{ name: "Nasi", normal_price: 10000 }] },
    });
    expect(out.tenant?.name).toBe("Warteg");
  });
});

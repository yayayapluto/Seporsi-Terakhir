import { describe, expect, it } from "vitest";
import { normalizeTenantProfile, TenantProfileSchema } from "@/lib/tenant-profile";

describe("TenantProfileSchema", () => {
  it("menerima nama + lokasi valid", () => {
    expect(
      TenantProfileSchema.safeParse({ name: "Warteg Barokah", locationNote: "Gedung A lt 1" })
        .success,
    ).toBe(true);
  });

  it("menolak nama kosong", () => {
    expect(TenantProfileSchema.safeParse({ name: "   ", locationNote: null }).success).toBe(false);
  });

  it("lokasi boleh kosong/null, maksimal 200 karakter", () => {
    expect(TenantProfileSchema.safeParse({ name: "X", locationNote: "" }).success).toBe(true);
    expect(
      TenantProfileSchema.safeParse({ name: "X", locationNote: "a".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("normalizeTenantProfile", () => {
  it("merapikan spasi dan mengosongkan lokasi blank", () => {
    expect(normalizeTenantProfile({ name: "  Warteg  ", locationNote: "   " })).toEqual({
      name: "Warteg",
      locationNote: null,
    });
  });
});

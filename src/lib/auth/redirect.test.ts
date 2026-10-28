import { describe, expect, it } from "vitest";
import { homeForRole } from "@/lib/auth";
import { isSafeNext, resolveNext } from "@/lib/auth/redirect";

describe("isSafeNext", () => {
  it("accepts internal paths", () => {
    expect(isSafeNext("/katalog")).toBe(true);
    expect(isSafeNext("/tenant/porsi/baru?x=1")).toBe(true);
  });

  it("rejects external, protocol-relative, and escaped targets", () => {
    expect(isSafeNext("https://evil.test")).toBe(false);
    expect(isSafeNext("//evil.test/x")).toBe(false);
    expect(isSafeNext("/\\evil")).toBe(false);
    expect(isSafeNext("/x\ny")).toBe(false);
    expect(isSafeNext("")).toBe(false);
    expect(isSafeNext(null)).toBe(false);
    expect(isSafeNext(undefined)).toBe(false);
  });
});

describe("resolveNext", () => {
  it("prefers a safe next over the role home", () => {
    expect(resolveNext("/profil", "/katalog")).toBe("/profil");
  });

  it("falls back to the role home for unsafe next", () => {
    expect(resolveNext("https://evil.test", "/katalog")).toBe("/katalog");
    expect(resolveNext(null, "/tenant")).toBe("/tenant");
  });
});

describe("homeForRole", () => {
  it("maps each role to its home", () => {
    expect(homeForRole("student")).toBe("/katalog");
    expect(homeForRole("tenant")).toBe("/tenant");
    expect(homeForRole("admin")).toBe("/admin");
  });

  it("resolves post-login targets through the role home", () => {
    expect(resolveNext(null, homeForRole("tenant"))).toBe("/tenant");
    expect(resolveNext("/pesanan", homeForRole("tenant"))).toBe("/pesanan");
    expect(resolveNext("https://evil.test", homeForRole("admin"))).toBe("/admin");
  });
});

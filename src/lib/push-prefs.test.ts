import { describe, expect, it } from "vitest";
import { permissionLabel, pushPrefKey, readPushPref } from "@/lib/push-prefs";

describe("push-prefs", () => {
  it("namespaced per user", () => {
    expect(pushPrefKey("u1")).toBe("notif-push:u1");
  });

  it("reads on/off, aman bila storage rusak", () => {
    expect(readPushPref(() => "1", "u1")).toBe(true);
    expect(readPushPref(() => "0", "u1")).toBe(false);
    expect(
      readPushPref(() => {
        throw new Error("blocked");
      }, "u1"),
    ).toBe(false);
  });

  it("labels jelas tiap status izin", () => {
    expect(permissionLabel("granted")).toContain("Aktif");
    expect(permissionLabel("denied")).toContain("Diblokir");
    expect(permissionLabel("default")).toContain("Belum diminta");
    expect(permissionLabel("unsupported")).toContain("tidak mendukung");
  });
});

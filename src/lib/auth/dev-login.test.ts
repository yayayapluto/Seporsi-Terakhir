import { describe, expect, it } from "vitest";
import { isDevLoginAllowed, isDevLoginEmail } from "./dev-login";

describe("dev-login guard", () => {
  it("menolak email di luar seed allowlist", () => {
    expect(isDevLoginEmail("admin1793198479@yopmail.com")).toBe(true);
    expect(isDevLoginEmail("rafi1793198479@yopmail.com")).toBe(true);
    expect(isDevLoginEmail("penyerang@gmail.com")).toBe(false);
    expect(isDevLoginEmail("")).toBe(false);
  });

  it("hanya mengizinkan di non-production", () => {
    expect(isDevLoginAllowed("development")).toBe(true);
    expect(isDevLoginAllowed("test")).toBe(true);
    expect(isDevLoginAllowed("production")).toBe(false);
    expect(isDevLoginAllowed(undefined)).toBe(false);
  });
});

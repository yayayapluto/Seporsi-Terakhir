import { describe, expect, it } from "vitest";
import { classifyPickupInput } from "./pickup-code";

describe("classifyPickupInput", () => {
  it("mengenali uuid token QR", () => {
    expect(classifyPickupInput("123e4567-e89b-42d3-a456-426614174000")).toEqual({
      kind: "token",
      value: "123e4567-e89b-42d3-a456-426614174000",
    });
  });
  it("mengenali kode 4 digit", () => {
    expect(classifyPickupInput("4821")).toEqual({ kind: "code", value: "4821" });
  });
  it("menolak input selain uuid / 4 digit", () => {
    expect(classifyPickupInput("482")).toBeNull();
    expect(classifyPickupInput("48210")).toBeNull();
    expect(classifyPickupInput("abcd")).toBeNull();
    expect(classifyPickupInput("")).toBeNull();
  });
  it("memangkas spasi dan menurunkan huruf uuid", () => {
    expect(classifyPickupInput("  550E8400-E29B-41D4-A716-446655440000  ")?.kind).toBe("token");
  });
});

import { describe, expect, it } from "vitest";
import { isMissingColumnError, shouldLogPortionLoadError } from "@/lib/domain/portion-detail";

describe("isMissingColumnError", () => {
  it("matches missing-column messages", () => {
    expect(isMissingColumnError("column menu_items_1.ingredients does not exist")).toBe(true);
    expect(isMissingColumnError("Could not find the 'allergen_note' column")).toBe(true);
  });

  it("rejects unrelated errors", () => {
    expect(isMissingColumnError("permission denied for table portions")).toBe(false);
    expect(isMissingColumnError(null)).toBe(false);
    expect(isMissingColumnError(undefined)).toBe(false);
  });
});

describe("shouldLogPortionLoadError", () => {
  it("stays silent when maybeSingle returns zero rows (no error object)", () => {
    expect(shouldLogPortionLoadError(null)).toBe(false);
    expect(shouldLogPortionLoadError(undefined)).toBe(false);
  });

  it("logs real errors", () => {
    expect(shouldLogPortionLoadError({ message: "connection failed" })).toBe(true);
  });
});

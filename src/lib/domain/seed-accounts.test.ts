import { describe, expect, it } from "vitest";
import { SEED_ACCOUNTS } from "@/lib/domain/seed-accounts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("seed-accounts", () => {
  it("9 akun: 1 admin, 6 tenant, 2 student", () => {
    expect(SEED_ACCOUNTS).toHaveLength(9);
    const roles = SEED_ACCOUNTS.map((a) => a.role);
    expect(roles.filter((r) => r === "admin")).toHaveLength(1);
    expect(roles.filter((r) => r === "tenant")).toHaveLength(6);
    expect(roles.filter((r) => r === "student")).toHaveLength(2);
  });

  it("email unik, placeholder UUID valid", () => {
    const emails = SEED_ACCOUNTS.map((a) => a.email);
    const seen: Record<string, true> = {};
    for (const e of emails) {
      expect(seen[e]).toBeUndefined();
      seen[e] = true;
    }
    for (const a of SEED_ACCOUNTS) {
      expect(a.email).toMatch(/@kampus\.ac\.id$|@student\.ac\.id$/);
      expect(a.placeholderId).toMatch(UUID_RE);
    }
  });
});

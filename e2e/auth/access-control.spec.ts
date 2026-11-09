import { expect, test } from "../support/fixtures";

const PROTECTED = [
  "/beranda",
  "/beranda/pesanan",
  "/profil",
  "/tenant",
  "/tenant/pesanan",
  "/admin",
  "/admin/tenant",
];

test.describe("Access control (anon ditolak)", () => {
  for (const route of PROTECTED) {
    test(`anon ${route} -> /masuk`, async ({ page }) => {
      await page.goto(route);
      await expect.poll(() => page.url(), { timeout: 10_000 }).toContain("/masuk");
    });
  }
});

test.describe("Batas peran", () => {
  test("buyer ditolak dari Mitra dan admin", async ({ buyerPage: page }) => {
    await page.goto("/tenant");
    await expect.poll(() => page.url(), { timeout: 10_000 }).not.toContain("/tenant");
    await page.goto("/admin");
    await expect.poll(() => page.url(), { timeout: 10_000 }).not.toContain("/admin");
  });

  test("mitra ditolak dari admin", async ({ mitraPage: page }) => {
    await page.goto("/admin");
    await expect.poll(() => page.url(), { timeout: 10_000 }).not.toContain("/admin");
  });
});

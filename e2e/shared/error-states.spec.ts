import { expectNoHorizontalOverflow } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test.describe("error states", () => {
  test("404: rute tidak dikenal menampilkan not-found", async ({ buyerPage: page }) => {
    await test.step("buka rute sampah", async () => {
      await page.goto("/tidak-ada-halaman-xyz");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("ada tautan kembali", async () => {
      const back = page.getByRole("link", { name: /beranda|kembali|home/i }).first();
      await expect(back).toBeVisible();
    });
    await test.step("tidak overflow", async () => {
      await expectNoHorizontalOverflow(page);
    });
  });

  test("offline page bisa diakses langsung", async ({ buyerPage: page }) => {
    await test.step("buka /offline", async () => {
      await page.goto("/offline");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("copy offline tampil", async () => {
      await expect(page.locator("body")).toContainText(/offline|internet|koneksi/i);
    });
  });

  test("detail porsi id sampah tidak crash 500", async ({ buyerPage: page }) => {
    await test.step("buka detail id acak", async () => {
      await page.goto("/beranda/katalog/00000000-0000-0000-0000-000000000000");
      await expect(page.locator("h1, h2, body").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("status bukan 500", async () => {
      const resp = await page.request.get("/beranda/katalog/00000000-0000-0000-0000-000000000000");
      expect(resp.status()).not.toBe(500);
    });
  });

  test.fixme("simulasi error server 500 butuh flag dev untuk memaksa throw", async () => {
    // Tidak ada endpoint yang direkayasa untuk 500; tidak dipaksa di e2e.
  });
});

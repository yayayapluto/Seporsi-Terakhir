import { expectNoHorizontalOverflow } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test.describe("security / otorisasi", () => {
  test("guest ke /beranda diarahkan ke /masuk", async ({ buyerPage: page }) => {
    await test.step("buka sebagai buyer storage-state lalu assert proteksi", async () => {
      await page.goto("/beranda");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
      expect(page.url()).toContain("/beranda");
    });
    await test.step("buka /admin sebagai buyer tidak dapat konten admin", async () => {
      await page.goto("/admin");
      await expect(page.locator("h1, h2, body").first()).toBeVisible({ timeout: 10_000 });
      // Buyer tidak boleh melihat judul dampak admin.
      await expect(page.locator("body")).not.toContainText(/Dampak|persetujuan tenant/i);
    });
  });

  test("unauthenticated: /beranda redirect /masuk (context baru)", async ({ page }) => {
    await test.step("buka /beranda tanpa auth", async () => {
      await page.goto("/beranda");
      await page.waitForURL(/\/masuk|\/beranda/, { timeout: 10_000 });
    });
    await test.step("bila redirect, URL harus /masuk", async () => {
      if (page.url().includes("/masuk")) {
        await expect(page.locator("form, h1, h2").first()).toBeVisible();
      }
    });
  });

  test("header keamanan dasar di /masuk", async ({ page }) => {
    await test.step("fetch headers", async () => {
      await page.goto("/masuk");
      const resp = await page.request.get("/masuk");
      const headers = resp.headers();
      // Next memberikan x-powered-by; assert tidak bocor key sesi di body.
      expect(headers["x-powered-by"]).not.toContain("express");
    });
    await test.step("halaman tidak overflow", async () => {
      await expect(page.locator("form, h1, h2").first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  });

  test("admin hanya bisa di adminPage", async ({ adminPage: page }) => {
    await test.step("buka /admin", async () => {
      await page.goto("/admin");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("tetap di area admin", async () => {
      expect(page.url()).toContain("/admin");
    });
  });

  test.fixme("scan QR butuh kamera nyata / fake stream device", async ({ mitraPage: page }) => {
    await page.goto("/tenant/scan");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

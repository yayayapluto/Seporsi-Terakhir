import { expect, test } from "@playwright/test";
import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  expectNoSkeletonLeft,
  expectNoSpinnerText,
} from "../support/assertions";

test.describe("loading states", () => {
  test("landing: selesai memuat tanpa skeleton tersisa", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await test.step("buka landing dan tunggu hidrasi", async () => {
      await page.goto("/");
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("[data-slot=skeleton], .animate-pulse")).toHaveCount(0);
    });
    await test.step("tidak ada teks memuat + console bersih", async () => {
      await expectNoSkeletonLeft(page);
      await expectNoSpinnerText(page);
      await expectNoConsoleErrors(page, errors);
    });
  });

  test("katalog publik: skeleton hilang setelah data tiba", async ({ page }) => {
    await test.step("buka katalog (publik tetap bisa diakses)", async () => {
      await page.goto("/beranda/katalog");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("poll sampai skeleton 0", async () => {
      await expectNoSkeletonLeft(page);
      await expectNoSpinnerText(page);
    });
  });

  test("transisi rute: konten baru swap tanpa flash loading", async ({ page }) => {
    await test.step("navigasi landing -> masuk", async () => {
      await page.goto("/");
      await expect(page.locator("h1").first()).toBeVisible();
      await page.getByRole("link", { name: /masuk/i }).first().click();
      await page.waitForURL(/\/masuk/);
      await expect(page.locator("h1, h2, form").first()).toBeVisible();
    });
    await test.step("poll sampai bersih", async () => {
      await expectNoSkeletonLeft(page);
    });
  });
});

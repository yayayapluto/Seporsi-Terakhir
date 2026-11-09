import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectTapTargets } from "../support/assertions";

const VIEWPORTS = [
  { width: 360, height: 740, name: "360x740" },
  { width: 390, height: 844, name: "390x844" },
  { width: 768, height: 1024, name: "768x1024" },
  { width: 1024, height: 768, name: "1024x768" },
  { width: 1440, height: 900, name: "1440x900" },
] as const;

test.describe("responsive sweep", () => {
  for (const v of VIEWPORTS) {
    test(`landing ${v.name}: no overflow`, async ({ page }) => {
      await test.step(`set viewport ${v.width}x${v.height}`, async () => {
        await page.setViewportSize({ width: v.width, height: v.height });
        await page.goto("/");
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
      });
      await test.step("assert tidak overflow", async () => {
        await expectNoHorizontalOverflow(page);
      });
    });

    test(`beranda ${v.name}: no overflow @mobile`, async ({ page }) => {
      await test.step(`set viewport ${v.width}x${v.height}`, async () => {
        await page.setViewportSize({ width: v.width, height: v.height });
        await page.goto("/beranda");
        // Publik akan redirect ke /masuk bila belum login; tetap assert tanpa overflow.
        await expect(page.locator("h1, h2, form").first()).toBeVisible({ timeout: 10_000 });
      });
      await test.step("assert tidak overflow + tap target", async () => {
        await expectNoHorizontalOverflow(page);
        if (v.width < 768) await expectTapTargets(page);
      });
    });
  }
});

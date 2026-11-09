import { expectNoHorizontalOverflow, expectTapTargets } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test.describe("notifikasi", () => {
  test("daftar notifikasi tampil tanpa overflow @smoke", async ({ buyerPage: page }) => {
    await test.step("buka /notifikasi", async () => {
      await page.goto("/notifikasi");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("konten atau empty-state ter-render", async () => {
      const body = await page.locator("main, [role=main]").first().textContent();
      expect(body?.trim().length ?? 0).toBeGreaterThan(0);
    });
    await test.step("mobile helpers", async () => {
      await expectNoHorizontalOverflow(page);
      await expectTapTargets(page);
    });
  });

  test("push toggle terlihat di pengaturan notifikasi", async ({ buyerPage: page }) => {
    await test.step("buka /akun/notifikasi", async () => {
      await page.goto("/akun/notifikasi");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("toggle switch ter-render", async () => {
      await expect(
        page.locator("[role=switch], input[type=checkbox], button[aria-pressed]").first(),
      ).toBeVisible();
    });
  });

  test.fixme("notifikasi push realtime butuh service worker + permission", async () => {
    // Push realtime tidak deterministik di CI tanpa kredensial device.
  });
});

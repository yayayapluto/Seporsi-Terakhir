import { expectNoHorizontalOverflow } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("tour beranda: buka, lanjut, lewati, tidak muncul lagi", async ({ buyerPage: page }) => {
  await test.step("buka beranda (tur forced onboarding pertama)", async () => {
    await page.goto("/beranda?mode=onboarding");
  });
  const popover = page.locator('[data-tour-card="beranda"]');
  await test.step("popover intro muncul", async () => {
    await expect(popover).toBeVisible({ timeout: 15_000 });
    await expect(popover.getByText(/dari 4/i)).toBeVisible();
  });
  await test.step("spotlight + konten dalam viewport", async () => {
    const spot = page.locator('[data-testid="tour-spotlight"]');
    await expect(spot).toBeVisible();
    const target = page.locator('[data-tour="filter"]');
    if (await target.count()) {
      const box = await target.first().boundingBox();
      expect(box).toBeTruthy();
    }
    await expectNoHorizontalOverflow(page);
  });
  await test.step("Lewati panduan menutup", async () => {
    await popover.getByRole("button", { name: /Lewati/i }).click();
    const confirm = page.getByRole("button", { name: /Lewati panduan/i });
    if (await confirm.count().catch(() => 0)) {
      await confirm.first().click();
    }
    await expect(popover).toHaveCount(0, { timeout: 10_000 });
  });
  await test.step("tidak muncul lagi setelah selesai", async () => {
    await page.reload();
    await expect(popover).toHaveCount(0, { timeout: 10_000 });
  });
});

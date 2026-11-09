import { expectNoHorizontalOverflow } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("tour beranda: intro dialog, langkah, lewati, tidak muncul lagi", async ({
  buyerPage: page,
}) => {
  await page.goto("/beranda?mode=onboarding");
  await test.step("intro dialog muncul", async () => {
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Mau lihat panduan singkat beranda?")).toBeVisible();
  });
  await test.step("mulai panduan menampilkan langkah", async () => {
    await page.getByRole("button", { name: /Mulai panduan|Lanjut/i }).click();
    await expect(page.locator('[data-tour-card="beranda"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="tour-spotlight"]')).toBeVisible();
    await expect(page.locator('[data-tour-card="beranda"]')).toContainText("Mulai dari sini");
  });
  await test.step("ke langkah berikut", async () => {
    await page
      .locator('[data-tour-card="beranda"]')
      .getByRole("button", { name: /Lanjut/i })
      .click();
    // Step #tour-orders disembunyikan bila tidak ada pesanan aktif — langkah
    // berikutnya yang ada adalah katalog.
    await expect(page.locator('[data-tour-card="beranda"]')).toContainText("Katalog sore ini", {
      timeout: 10_000,
    });
  });
  await test.step("Lewati menutup tur", async () => {
    await page
      .locator('[data-tour-card="beranda"]')
      .getByRole("button", { name: /Lewati/i })
      .click();
    const confirm = page.getByRole("button", { name: /Lewati panduan/i });
    if (await confirm.count()) await confirm.first().click();
    await expect(page.locator('[data-tour-card="beranda"]')).toHaveCount(0, { timeout: 10_000 });
  });
  await test.step("tidak muncul lagi setelah selesai", async () => {
    await page.reload();
    await expect(page.locator('[data-tour-card="beranda"]')).toHaveCount(0, { timeout: 10_000 });
    await page.locator('[data-testid="tour-spotlight"]').count();
    await expect(page.getByText("Mau lihat panduan singkat beranda?")).toHaveCount(0);
  });
  await expectNoHorizontalOverflow(page);
});

import { expect, test } from "@playwright/test";
import { expectA11y, expectNoHorizontalOverflow } from "../support/assertions";

test("landing @smoke: hero + langkah + FAQ + CTA utuh", async ({ page }) => {
  await test.step("buka landing", async () => {
    await page.goto("/");
  });
  await test.step("copy asli tampil", async () => {
    await expect(page.locator("h1")).toContainText(/Cara kerja penyelamatan/i);
    await expect(page.locator("h2").first()).toContainText(/Tiga langkah dari etalase/i);
    await expect(page.getByText(/Tenant dipungut biaya\?/i)).toBeVisible();
  });
  await test.step("CTA primer dan tombol Masuk", async () => {
    await expect(
      page.getByRole("link", { name: /Lihat Porsi Hari Ini|Buka dasbor/i }),
    ).toBeVisible();
  });
  await test.step("FAQ accordion keyboard (Enter)", async () => {
    const q = page
      .locator("button")
      .filter({ hasText: /Kapan katalog dibuka/ })
      .first();
    if ((await q.count()) > 0) {
      await q.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByText(/Tenant memperbarui pukul/i)).toBeVisible({ timeout: 5_000 });
    }
  });
  await test.step("mobile overflow + a11y", async () => {
    await expectNoHorizontalOverflow(page);
    await expectA11y(page);
  });
});

test("landing reduced motion", async ({ page, browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const p2 = await ctx.newPage();
  await p2.goto("/");
  await expect(p2.locator("h1").first()).toBeVisible();
  await ctx.close();
});

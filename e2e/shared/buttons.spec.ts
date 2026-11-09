import {
  expectA11y,
  expectButtonsOutlined,
  expectFontsAtLeast,
  expectInputs16px,
  expectTapTargets,
} from "../support/assertions";
import { expect, test } from "../support/fixtures";

test.describe("buttons / primer", () => {
  test("landing CTA utama visible + outline", async ({ buyerPage: page }) => {
    await test.step("buka landing", async () => {
      await page.goto("/");
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("CTA primer visible", async () => {
      await expect(
        page.getByRole("link", { name: /Lihat Porsi|Masuk|Buka dasbor/i }).first(),
      ).toBeVisible();
    });
    await test.step("outline + tap target", async () => {
      await expectButtonsOutlined(page);
      await expectTapTargets(page);
    });
  });

  test("form masuk: submit ter-outline dan input 16px (mobile)", async ({ buyerPage: page }) => {
    await test.step("buka /masuk", async () => {
      await page.goto("/masuk");
      await expect(page.locator("form, h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("input >=16px + tombol outline", async () => {
      await expectInputs16px(page);
      await expectButtonsOutlined(page);
    });
  });

  test("a11y + font minimum di beranda", async ({ buyerPage: page }) => {
    await test.step("buka beranda", async () => {
      await page.goto("/beranda");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("axe + font", async () => {
      await expectA11y(page);
      await expectFontsAtLeast(page, 12);
    });
  });
});

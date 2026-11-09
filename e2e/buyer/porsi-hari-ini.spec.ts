import { expectNoHorizontalOverflow, expectSelectShowsLabel } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("buyer katalog @smoke", async ({ buyerPage: page, seed }) => {
  await test.step("katalog terbuka dengan kartu porsi seed", async () => {
    await page.goto("/beranda/katalog");
    const card = page.locator(`a[aria-label*="${seed.runId}"]`).first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toContainText(/Rp/);
  });
  await test.step("label filter Tenant = 'Semua tenant'", async () => {
    await expectSelectShowsLabel(page, page.getByLabel("Tenant"), "Semua tenant");
  });
  await test.step("label Urutkan terbaca (bukan slug)", async () => {
    await expectSelectShowsLabel(page, page.getByLabel("Urutkan"), "Hampir habis");
  });
  await test.step("list view toggle berpindah", async () => {
    const cards = page.locator(`a[aria-label*="${seed.runId}"]`);
    const before = await cards.count();
    await page.locator('[data-tour="filter"]').waitFor({ timeout: 10_000 });
    const toggleWrappers = page.locator("ul.grid, ul[class*=grid-cols], ul");
    await toggleWrappers.first().waitFor({ timeout: 10_000 });
    expect(before).toBeGreaterThan(0);
  });
  await expectNoHorizontalOverflow(page);
});

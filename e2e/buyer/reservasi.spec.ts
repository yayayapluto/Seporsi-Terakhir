import { expect, test } from "../support/fixtures";

test("reservasi @smoke: dari katalog ke pesanan", async ({ buyerPage: page, seed }) => {
  await test.step("buka kartu porsi seed", async () => {
    await page.goto("/beranda/katalog");
    await page.locator(`a[aria-label*="${seed.runId}"]`).first().click();
    await page.waitForURL(/\/beranda\/katalog\/[0-9a-f-]{36}/);
  });
  await test.step("syarat penjualan tampil di detail", async () => {
    await expect(page.getByText("Syarat:")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("h1")).toContainText(seed.runId);
  });
  await test.step("pesan 1 porsi", async () => {
    await page.locator("text=1 porsi").first().click();
    await page.getByRole("button", { name: /Pesan/i }).first().click();
    await page.waitForURL(/\/beranda\/pesanan\/[0-9a-f-]{36}/, { timeout: 20_000 });
  });
  await test.step("QR tampil di detail pesanan", async () => {
    await expect(page.locator("h1")).toContainText(seed.runId);
    await expect(
      page.locator("#qr-heading + * ~ * svg, section[aria-labelledby=qr-heading] svg").first(),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});

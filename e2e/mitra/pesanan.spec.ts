import type { Page } from "@playwright/test";
import { expect, test } from "../support/fixtures";

async function countBadge(page: Page): Promise<number> {
  const label = await page
    .getByText(/Menunggu pickup/)
    .textContent()
    .catch(() => null);
  const match = label?.match(/\((\d+)\)/);
  return match?.[1] ? Number(match[1]) : 0;
}

test("pesanan @smoke: daftar kosong sebelum reservasi", async ({ mitraPage: page }) => {
  await test.step("buka daftar pesanan", async () => {
    await page.goto("/tenant/pesanan");
  });
  await test.step("empty state tampil", async () => {
    await expect(page.getByText("Belum ada pesanan")).toBeVisible({ timeout: 15_000 });
  });
});

test("pesanan @smoke: badge konsisten dan detail bisa dibuka", async ({
  buyerPage,
  mitraPage: page,
  seed,
}) => {
  await test.step("buyer memesan porsi seed", async () => {
    await buyerPage.goto("/beranda/katalog");
    await buyerPage.locator(`a[aria-label*="${seed.runId}"]`).first().click();
    await buyerPage.waitForURL(/\/beranda\/katalog\/[0-9a-f-]{36}/);
    await buyerPage.locator("text=1 porsi").first().click();
    await buyerPage.getByRole("button", { name: /Pesan/i }).first().click();
    await buyerPage.waitForURL(/\/beranda\/pesanan\/[0-9a-f-]{36}/, { timeout: 20_000 });
  });
  await test.step("daftar pesanan mitra tampil", async () => {
    await page.goto("/tenant/pesanan");
    await expect(page.getByText(/Menunggu pickup/)).toBeVisible({ timeout: 15_000 });
  });
  await test.step("badge counter konsisten dengan baris menunggu", async () => {
    const badge = await countBadge(page);
    const rows = page.locator('[aria-labelledby="menunggu-heading"] li');
    await expect(rows).toHaveCount(badge, { timeout: 10_000 });
    expect(badge).toBeGreaterThan(0);
  });
  await test.step("baris menunggu punya aksi Scan pickup", async () => {
    const row = page.locator('[aria-labelledby="menunggu-heading"] li').first();
    await expect(row.getByRole("link", { name: /Scan pickup/i })).toBeVisible();
  });
  await test.step("detail pesanan terbuka dengan tombol batal", async () => {
    await page.locator('[aria-labelledby="menunggu-heading"] li a').first().click();
    await page.waitForURL(/\/tenant\/pesanan\/[0-9a-f-]{36}/);
    await expect(page.getByRole("button", { name: /Batalkan pesanan/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});

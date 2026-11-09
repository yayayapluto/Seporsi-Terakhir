import { expectNoHorizontalOverflow, expectNoSkeletonLeft } from "../support/assertions";
import { expect, test } from "../support/fixtures";

type OrderResponse = { ok?: boolean; orderId?: string; error?: string };

test("riwayat pesanan @smoke: kartu + filter status", async ({ seedBuyerPage: page, seed }) => {
  await test.step("pastikan ada 1 pesanan menunggu (POST /api/orders)", async () => {
    const response = await page.request.post("/api/orders", {
      data: { portionId: seed.mitra.portionId, quantity: 1 },
    });
    const body = (await response.json()) as OrderResponse;
    expect(response.ok(), `POST /api/orders gagal: ${body.error ?? response.status()}`).toBe(true);
    expect(body.ok).toBe(true);
  });

  await test.step("buka daftar pesanan", async () => {
    await page.goto("/beranda/pesanan");
    await expect(page.locator("h1")).toContainText("Pesanan saya");
    await expectNoSkeletonLeft(page);
  });

  await test.step("kartu pesanan: nama + total + badge status", async () => {
    const list = page.locator('[data-tour="order-list"]');
    await expect(list).toContainText(seed.runId, { timeout: 15_000 });
    await expect(list).toContainText(/Rp\s?[\d.]+/);
    await expect(list).toContainText("Menunggu pickup");
  });

  await test.step("filter Semua -> daftar tetap tampil", async () => {
    const button = page.getByRole("button", { name: /Semua/i });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-tour="order-list"]')).toContainText(seed.runId);
  });

  await test.step("filter Menunggu pickup -> pesanan terpilih", async () => {
    const button = page.getByRole("button", { name: /Menunggu pickup/i });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-tour="order-list"]')).toContainText(seed.runId);
  });

  await test.step("filter Selesai + Dibatalkan -> pindah list (kosong atau kartu)", async () => {
    for (const label of ["Selesai", "Dibatalkan"]) {
      const button = page.getByRole("button", { name: new RegExp(label, "i") });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('[data-tour="order-list"]')).toHaveCount(0);
      await expect(page.getByText("Tidak ada pesanan dengan status ini")).toBeVisible();
    }
  });

  await test.step("360px: tidak overflow", async () => {
    await page.getByRole("button", { name: /Semua/i }).click();
    await page.setViewportSize({ width: 360, height: 800 });
    await expectNoHorizontalOverflow(page);
  });
});

test.fixme("filter Selesai/Dibatalkan data terisi butuh aksi batal/ambil (di luar skenario read-only)", () => {});

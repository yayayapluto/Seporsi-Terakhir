import { expectNoHorizontalOverflow, expectNoSkeletonLeft } from "../support/assertions";
import { expect, test } from "../support/fixtures";

type OrderResponse = { ok?: boolean; orderId?: string; error?: string };

test("qr pickup @smoke: dari POST /api/orders ke QR di detail pesanan", async ({
  buyerPage: page,
  seed,
}) => {
  let orderId = "";

  await test.step("POST /api/orders sebagai buyer (cookie sesi buyerPage)", async () => {
    const response = await page.request.post("/api/orders", {
      data: { portionId: seed.mitra.portionId, quantity: 1 },
    });
    const body = (await response.json()) as OrderResponse;
    expect(response.ok(), `POST /api/orders gagal: ${body.error ?? response.status()}`).toBe(true);
    expect(body.ok).toBe(true);
    expect(body.orderId).toMatch(/[0-9a-f-]{36}/);
    orderId = body.orderId ?? "";
  });

  await test.step("buka detail pesanan", async () => {
    await page.goto(`/beranda/pesanan/${orderId}`);
    await page.waitForURL(new RegExp(`/beranda/pesanan/${orderId}`));
  });

  await test.step("QR svg tampil", async () => {
    const qr = page.locator("section[aria-labelledby=qr-heading] svg").first();
    await expect(qr).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Tunjukkan layar ini ke tenant")).toBeVisible();
  });

  await test.step("jendela pickup tampil", async () => {
    await expect(page.getByLabel("Batas waktu ambil")).toBeVisible();
    await expect(page.getByText(/Ambil dalam/i)).toBeVisible();
    await expect(page.getByText(/Lewat batas ini pesanan ditandai telat diambil/i)).toBeVisible();
  });

  await test.step("ringkasan: nama menu + status menunggu", async () => {
    await expect(page.locator("h1")).toContainText(seed.runId);
    await expect(page.getByText("Menunggu pickup")).toBeVisible();
  });

  await test.step("360px: tidak overflow", async () => {
    await page.setViewportSize({ width: 360, height: 800 });
    await expectNoHorizontalOverflow(page);
    await expectNoSkeletonLeft(page);
  });
});

test.fixme("qr token tidak dirender sebagai teks (butuh akses token server, tidak tersedia di e2e)", () => {});

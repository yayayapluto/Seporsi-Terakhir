import { expect, test } from "../support/fixtures";

test("scan pickup @smoke: halaman scanner dan kode manual", async ({ seedMitraPage: page }) => {
  await test.step("buka scanner", async () => {
    await page.goto("/tenant/scan");
    // Lewatkan panduan onboarding yang mungkin menutup layar (loop sampai hilang).
    for (let i = 0; i < 4; i++) {
      const dialog = page.getByRole("dialog");
      if ((await dialog.count()) === 0) break;
      const skip = page.getByRole("button", { name: /^Lewati$/i });
      if (await skip.count()) {
        await skip.first().click();
        continue;
      }
      const confirm = page.getByRole("button", { name: /Lewati panduan/i });
      if (await confirm.count()) {
        await confirm.first().click();
        continue;
      }
      await page.keyboard.press("Escape");
    }
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 10_000 });
  });
  await test.step("scanner dan sapaan tampil", async () => {
    await expect(page.locator("[data-tour=scanner]")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Selamat (pagi|siang|sore|malam)/).first()).toBeVisible();
  });
  await test.step("buka form kode manual", async () => {
    await page.getByRole("button", { name: /Masukkan kode manual/i }).click();
    await expect(page.getByLabel(/Kode pickup 4 digit/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /Cari pesanan/i })).toBeVisible();
  });
  await test.step("tombol Cari pesanan full width", async () => {
    const button = page.getByRole("button", { name: /Cari pesanan/i });
    const box = await button.boundingBox();
    const formBox = await page.locator("form").last().boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan((formBox?.width ?? 0) * 0.9);
  });
  await test.step("kode tidak dikenal menampilkan error", async () => {
    const otp = page.getByLabel(/Kode pickup 4 digit/);
    await otp.click();
    await otp.pressSequentially("0000", { delay: 20 });
    await page.getByRole("button", { name: /Cari pesanan/i }).click();
    await expect(page.getByText("Kode tidak dikenali.")).toBeVisible({ timeout: 15_000 });
  });
});

test("scan pickup @smoke: dekode QR dan konfirmasi", async ({ seedMitraPage: page }) => {
  test.fixme(true, "dekode QR kamera butuh perangkat fisik, tidak bisa diuji headless");
  await page.goto("/tenant/scan");
  await expect(page.locator("[data-tour=scanner]")).toBeVisible({ timeout: 15_000 });
});

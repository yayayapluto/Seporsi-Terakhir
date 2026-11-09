import { expect, test } from "../support/fixtures";

test("porsi aktif @smoke: sisa porsi seed tampil", async ({ seedMitraPage: page, seed }) => {
  await test.step("buka dasbor", async () => {
    await page.goto("/tenant");
  });
  await test.step("sisa porsi seed tampil", async () => {
    await expect(page.getByText(/sisa 5\/5/i).first()).toHaveCount(1, { timeout: 15_000 });
  });
  await test.step("menu seed ada di Menu saya", async () => {
    await page.goto("/tenant/menu-saya");
    await expect(page.getByText(seed.runId).first()).toBeVisible({ timeout: 15_000 });
  });
});

test("porsi @smoke: validasi tambah porsi", async ({ seedMitraPage: page, seed }) => {
  await test.step("buka form tambah porsi", async () => {
    await page.goto("/tenant/porsi/tambah");
  });
  await test.step("pilih menu seed", async () => {
    await page.locator("#portion-menu").click();
    await page.getByRole("option").first().click();
    await expect(page.locator("#portion-menu")).toContainText(seed.runId);
  });
  await test.step("harga diskon tidak boleh di atas harga normal", async () => {
    await page.locator("#portion-discount").fill("999999");
    await expect(page.getByText("Harga diskon harus di bawah harga normal.")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: /Posting porsi/i })).toBeDisabled();
  });
  await test.step("jumlah kosong ditolak saat submit", async () => {
    await page.locator("#portion-discount").fill("5000");
    await page.locator("#portion-qty").fill("");
    await page.getByRole("button", { name: /Posting porsi/i }).click();
    await expect(page.getByText("Jumlah wajib diisi.")).toBeVisible({ timeout: 10_000 });
  });
});

test("porsi @smoke: edit porsi terbuka", async ({ seedMitraPage: page, seed }) => {
  await test.step("buka halaman ubah porsi seed", async () => {
    await page.goto(`/tenant/porsi/${seed.mitra.portionId}/ubah`);
  });
  await test.step("form edit tampil dengan sisa dan tombol simpan", async () => {
    await expect(page.getByText(/Sisa \d+ dari \d+ porsi/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Simpan perubahan/i })).toBeVisible();
  });
});

test("porsi @smoke: tambah porsi happy path", async ({ seedMitraPage: page }) => {
  test.fixme(
    true,
    "form porsi kompleks (Select menu, DateField/TimeField, accordion jendela jual)",
  );
  await page.goto("/tenant/porsi/tambah");
  await expect(page.getByRole("button", { name: /Posting porsi/i })).toBeVisible();
});

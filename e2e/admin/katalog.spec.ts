import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  expectNoHorizontalOverflow,
} from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("admin katalog @smoke: toggle visibilitas dan dialog ubah email", async ({
  adminPage: page,
  seed,
}) => {
  const consoleErrors = collectConsoleErrors(page);
  const tenantName = `e2e-${seed.runId}-tenant`;
  const row = page.locator("li", { has: page.locator(`h2:text-is("${tenantName}")`) });

  await test.step("daftar tenant disetujui tampil dengan baris email", async () => {
    await page.goto("/admin/tenant");
    await expect(page.getByRole("heading", { name: /Visibilitas di katalog/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(row).toBeVisible();
    await expect(row.getByText(seed.mitra.email)).toBeVisible();
    await expect(row.getByText(/Tampil di katalog/)).toBeVisible();
  });

  await test.step("toggle Sembunyikan <-> Tampilkan mengubah status", async () => {
    await row.getByRole("button", { name: /Sembunyikan/i }).click();
    await expect(row.getByText(/Disembunyikan dari katalog/)).toBeVisible();
    await expect(row.getByRole("button", { name: /Tampilkan/i })).toBeVisible();

    await row.getByRole("button", { name: /Tampilkan/i }).click();
    await expect(row.getByText(/Tampil di katalog/)).toBeVisible();
    await expect(row.getByRole("button", { name: /Sembunyikan/i })).toBeVisible();
  });

  await test.step("dialog Ubah email membuka dengan judul dan baris email", async () => {
    await row.getByRole("button", { name: /Ubah email/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Ubah email tenant")).toBeVisible();
    await expect(dialog.getByText(/Email saat ini:/)).toContainText(seed.mitra.email);
    await expect(dialog.getByLabel(/Email baru/i)).toBeVisible();
    await dialog.getByRole("button", { name: /^Batal$/i }).click();
    await expect(dialog).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  await test.step("tanpa error console", async () => {
    await expectNoConsoleErrors(page, consoleErrors);
  });
});

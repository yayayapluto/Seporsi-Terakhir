import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  expectNoHorizontalOverflow,
} from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("admin profil @smoke: profil render dan keluar mengakhiri sesi", async ({
  adminPage: page,
  seed,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await test.step("profil admin render dengan label Admin dan email", async () => {
    await page.goto("/profil");
    await expect(page.locator('[aria-label="Identitas"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[aria-label="Identitas"] h1')).toBeVisible();
    await expect(page.getByText(seed.admin.email).first()).toBeVisible();
    await expect(page.getByText("Admin", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Persetujuan tenant/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Dampak$/i })).toBeVisible();
  });

  await test.step("keluar lewat dialog konfirmasi menuju / atau /masuk", async () => {
    await page.getByRole("button", { name: /^Keluar$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Keluar dari akun\?/)).toBeVisible();
    await dialog.getByRole("button", { name: /^Keluar$/i }).click();
    await expect.poll(() => page.url()).not.toContain("/profil");
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/$|^\/masuk$/);
  });

  await test.step("tanpa overflow dan error console", async () => {
    await expectNoHorizontalOverflow(page);
    await expectNoConsoleErrors(page, consoleErrors);
  });
});

import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  expectNoHorizontalOverflow,
  expectNoSkeletonLeft,
} from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("admin dampak @smoke: angka hero, rentang grafik, filter tanggal, kartu tenant", async ({
  adminPage: page,
  seed,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await test.step("buka /admin dan hero numbers render", async () => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Dampak penyelamatan/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('section[aria-label="Sorotan dampak"]')).toBeVisible();
    await expect(page.getByText("PORSI TERSELAMATKAN")).toBeVisible();
    await expect(page.getByText(/Sell-through/)).toBeVisible();
    await expect(page.getByText("Uang hemat mahasiswa")).toBeVisible();
    await expect(page.getByText("Pendapatan tambahan tenant")).toBeVisible();
    await expect(page.getByText(/Sampah makanan terhindar/)).toBeVisible();
    await expectNoSkeletonLeft(page);
  });

  await test.step("siklus tombol rentang grafik, grafik tetap terlihat", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const ranges = ["24 jam", "3 hari", "7 hari", "Sebulan"];
    const fieldset = page.getByRole("group", { name: /Rentang tren/i });
    await expect(fieldset).toBeVisible({ timeout: 10_000 });
    for (const label of ranges) {
      await fieldset.getByRole("button", { name: label, exact: true }).click();
      await expect(fieldset.getByRole("button", { name: label, exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.getByRole("slider", { name: /Tren pickup harian/i })).toBeVisible();
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole("heading", { name: /Tren harian/i })).toBeVisible();
  });

  await test.step("input tanggal Dari/Sampai ada dan menerima rentang valid", async () => {
    await expect(page.locator("#from")).toBeVisible();
    await expect(page.locator("#to")).toBeVisible();

    await page.locator("#from").click();
    const fromCalendar = page.locator("button.rdp-day_button:not([disabled])").first();
    await expect(fromCalendar).toBeVisible();
    await fromCalendar.click();
    await expect.poll(() => page.url()).toContain("from=");

    await page.locator("#to").click();
    const toCalendar = page.locator("button.rdp-day_button:not([disabled])").last();
    await expect(toCalendar).toBeVisible();
    await toCalendar.click();
    await expect.poll(() => page.url()).toContain("to=");

    await expect(page.locator('section[aria-label="Sorotan dampak"]')).toBeVisible();
  });

  await test.step("kartu tenant terlihat dengan badge, tanpa overflow", async () => {
    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: 20_000 });
    // Tenant seed punya porsi terunggah tanpa pickup -> badge "Belum diambil".
    await expect(page.locator(`text=e2e-${seed.runId}`).first()).toBeVisible();
    await expect(page.getByText("Belum diambil").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  await test.step("tanpa error console", async () => {
    await expectNoConsoleErrors(page, consoleErrors);
  });
});

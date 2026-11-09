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
    // Lepaskan panduan yang mengunci layar (tour inert background).
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(300);
      const skip = page.getByRole("button", { name: /^Lewati$/i });
      if (await skip.count()) {
        await skip.first().click();
        continue;
      }
      if ((await page.getByRole("dialog").count()) === 0) break;
    }
    await expect(page.getByRole("heading", { name: /Dampak penyelamatan/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('section[aria-label="Sorotan dampak"]')).toBeVisible();
    await expect(page.getByText("PORSI TERSELAMATKAN")).toBeVisible();
    // Tabel menjadi kartu di mobile — cukup buktikan data dampak hadir di halaman.
    const zones = await page
      .getByText(/^Sell-through|Sell-through 6%|Sell-through \d+%|PORSI TERSELAMATKAN/)
      .all();
    expect(zones.length).toBeGreaterThan(0);
    await expect(page.getByText("Uang hemat mahasiswa")).toBeVisible();
    await expect(page.getByText("Pendapatan tambahan tenant")).toBeVisible();
    await expect(page.getByText(/Sampah makanan terhindar/)).toBeVisible();
    await expectNoSkeletonLeft(page);
  });

  await test.step("rentang grafik: grafik atau empty state wajar (seed tanpa pickup)", async () => {
    const fieldset = page.getByRole("group", { name: /Rentang tren/i });
    const empty = page.getByText("Belum ada pickup pada rentang ini.");
    await expect(empty).toBeVisible({ timeout: 10_000 });
    expect(await fieldset.count()).toBe(0);
    // Empty state berarti chart belum ada data; tidak apa-apa untuk smoke.
    expect(await empty.isVisible()).toBe(true);
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

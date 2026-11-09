import {
  expectNoHorizontalOverflow,
  expectNoOverlap,
  expectNoSkeletonLeft,
} from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("dasbor mitra @smoke: statistik konsisten", async ({ mitraPage: page, seed }) => {
  await test.step("buka dasbor", async () => {
    await page.goto("/tenant");
  });
  await test.step("statistik tampil dan konsisten", async () => {
    const pickup = page.getByText("Pickup", { exact: true });
    const omzet = page.getByText("Omzet", { exact: true });
    const porsiAktif = page.getByText("Porsi aktif", { exact: true }).first();
    const menunggu = page.getByText(/Menunggu pickup/);
    await expect(pickup).toBeVisible({ timeout: 15_000 });
    await expect(omzet).toBeVisible();
    await expect(porsiAktif).toBeVisible();
    await expect(menunggu).toBeVisible();
    await expect(page.locator("h1").first()).toContainText(seed.runId);
  });
  await test.step("format Rupiah tampil", async () => {
    await expect(page.getByText(/Rp/).first()).toBeVisible();
  });
  await test.step("statistik tidak saling tumpang tindih", async () => {
    await expectNoOverlap([
      { name: "Porsi aktif", locator: page.getByText("Porsi aktif", { exact: true }) },
      { name: "Pickup", locator: page.getByText("Pickup", { exact: true }) },
      { name: "Omzet", locator: page.getByText("Omzet", { exact: true }) },
    ]);
  });
  await test.step("tidak ada overflow horizontal", async () => {
    await expectNoSkeletonLeft(page);
    await expectNoHorizontalOverflow(page);
  });
});

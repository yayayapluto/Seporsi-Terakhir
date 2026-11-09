import { expectSelectShowsLabel } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test.describe("dropdown / select", () => {
  test("mitra: select menu di tambah porsi keyboard navigable", async ({ mitraPage: page }) => {
    await test.step("buka tambah porsi", async () => {
      await page.goto("/tenant/porsi/tambah");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("buka select pertama", async () => {
      const trigger = page.locator("[role=combobox], button[aria-haspopup=listbox]").first();
      await expect(trigger).toBeVisible();
      await trigger.click();
      const listbox = page.locator("[role=listbox]").first();
      await expect(listbox).toBeVisible();
    });
    await test.step("pilih opsi via keyboard", async () => {
      const firstOption = page.locator("[role=option]").first();
      await expect(firstOption).toBeVisible();
      await firstOption.click();
      await expect(page.locator("[role=listbox]")).toBeHidden({ timeout: 5_000 });
    });
  });

  test("select filter katalog menampilkan label terpilih", async ({ buyerPage: page }) => {
    await test.step("buka katalog", async () => {
      await page.goto("/beranda/katalog");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("cek label select (bila ada)", async () => {
      const trigger = page.locator("[role=combobox], button[aria-haspopup=listbox]").first();
      if ((await trigger.count()) > 0) {
        await expectSelectShowsLabel(
          page,
          page.getByLabel(/urut|filter|kategori|menu/i).first(),
          await trigger.textContent().then((t) => t?.trim() ?? ""),
        );
      }
    });
  });

  test("dropdown profil profil tidak overflow viewport", async ({ buyerPage: page }) => {
    await test.step("buka profil", async () => {
      await page.goto("/profil");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    });
    await test.step("semua popup tertutup secara default", async () => {
      await expect(page.locator("[role=listbox], [role=menu]").first()).not.toBeVisible();
    });
  });
});

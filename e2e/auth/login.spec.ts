import { expect, test } from "@playwright/test";

test.describe("Login UI (tanpa storageState)", () => {
  test("happy path: semua peran masuk ke home-nya masing-masing", async ({ page }) => {
    const cases: Array<[string, string]> = [
      ["admin", "/admin"],
      ["tenant", "/tenant"],
      ["student", "/beranda"],
    ];
    for (const [roleArg, home] of cases) {
      await test.step(`masuk sebagai ${roleArg}`, async () => {
        await page.goto("/masuk");
        await page
          .getByRole("link", { name: new RegExp(roleArg, "i") })
          .first()
          .click();
        await expect.poll(() => page.url(), { timeout: 15_000 }).toContain(home);
        await expect(page.locator("h1").first()).toBeVisible();
      });
      await page.context().clearCookies();
      await page.goto("/masuk");
    }
  });

  test("email kosong divalidasi", async ({ page }) => {
    await page.goto("/masuk");
    await page.getByLabel(/email/i).fill("e2e-tidakada@yopmail.com");
    await page.locator("input[type=password]").fill("salah-kamera-123");
    await page.getByRole("button", { name: /kirim|masuk|lanjut/i }).click();
    await expect(page.locator("body")).toContainText(/salah|tidak valid|gagal/i, {
      timeout: 10_000,
    });
    expect(page.url()).toContain("/masuk");
  });
});

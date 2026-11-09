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
        await expect.poll(() => page.url(), { timeout: 60_000 }).toContain(home);
        await expect(page.locator("h1").first()).toBeVisible();
      });
      await page.context().clearCookies();
      await page.goto("/masuk");
    }
  });

  test("email invalid divalidasi", async ({ page }) => {
    await page.goto("/masuk");
    await page.getByLabel(/email/i).fill("bukan-email");
    await page
      .getByRole("button", { name: /kirim tautan|kirim|lanjut/i })
      .first()
      .click();
    await expect(page.locator("body")).toContainText(/tidak valid/i, { timeout: 10_000 });
    expect(page.url()).toContain("/masuk");
  });
});

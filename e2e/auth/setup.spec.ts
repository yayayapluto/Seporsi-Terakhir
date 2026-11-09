import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const AUTH = path.join(process.cwd(), "e2e", ".auth");

/**
 * Setup project: buat storageState per peran lewat UI login dev
 * (pintasan tanpa email — SATU-satunya cara yang aman di dev).
 */
for (const role of ["admin", "tenant", "student"] as const) {
  test(`setup ${role} storageState`, async ({ browser }) => {
    const page = await browser
      .newContext({ locale: "id-ID", timezoneId: "Asia/Jakarta" })
      .then(async (c) => c.newPage());
    await page.goto("/masuk");
    await page
      .locator("text=Khusus development")
      .waitFor({ timeout: 10_000 })
      .catch(() => test.skip(true, "dev login tidak aktif di environment ini"));
    await page
      .getByRole("link", { name: new RegExp(role === "tenant" ? "tenant" : role, "i") })
      .first()
      .click();
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain("/masuk");
    const file = role === "student" ? "buyer" : role === "tenant" ? "mitra" : "admin";
    await page.context().storageState({ path: path.join(AUTH, `${file}.json`) });
    expect(fs.existsSync(path.join(AUTH, `${file}.json`))).toBe(true);
  });
}

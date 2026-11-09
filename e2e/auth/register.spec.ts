import { expect, test } from "../support/fixtures";

test.describe("Registrasi", () => {
  test("Daftar jadi tenant (existing applicant)", async ({ buyerPage: page }) => {
    test.fixme(
      true,
      "registrasi buyer -> tenant belum di-cover E2E end-to-end (approval butuh admin window)",
    );
    await page.goto("/profil");
    const link = page.getByRole("link", {
      name: /daftar jadi tenant|daftar tenant|ajukan tenant/i,
    });
    await expect(link).toBeVisible();
    await link.click();
    await expect.poll(() => page.url()).toContain("/tenant/pendaftaran");
  });
});

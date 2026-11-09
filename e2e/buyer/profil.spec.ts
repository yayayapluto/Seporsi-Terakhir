import { expectNoHorizontalOverflow, expectNoSkeletonLeft } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("profil @smoke: /profil tampil + edit nama tersimpan", async ({ buyerPage: page, seed }) => {
  const nextName = `Buyer ${seed.runId}`;

  await test.step("/profil: nama + email terlihat", async () => {
    await page.goto("/profil");
    const identity = page.getByLabel("Identitas", { exact: true });
    await expect(identity).toBeVisible({ timeout: 15_000 });
    await expect(identity.locator("h1")).not.toBeEmpty();
    await expect(identity.getByText(/.+@.+\..+/)).toBeVisible();
    await expectNoSkeletonLeft(page);
  });

  await test.step("profile-form: ubah nama lalu simpan", async () => {
    await page.goto("/profil/pengaturan/profil");
    const nameInput = page.locator("#my-name");
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    await nameInput.fill(nextName);
    await page.getByRole("button", { name: /Simpan profil/i }).click();
    await expect(page.getByText(/Tersimpan\. Profilmu sudah diperbarui\./)).toBeVisible({
      timeout: 15_000,
    });
  });

  await test.step("nama baru persisten setelah reload", async () => {
    await page.reload();
    await expect(page.locator("#my-name")).toHaveValue(nextName, { timeout: 15_000 });
  });

  await test.step("/profil menampilkan nama baru", async () => {
    await page.goto("/profil");
    await expect(page.getByLabel("Identitas", { exact: true }).locator("h1")).toContainText(
      seed.runId,
    );
  });

  await test.step("360px: tidak overflow", async () => {
    await page.setViewportSize({ width: 360, height: 800 });
    await expectNoHorizontalOverflow(page);
  });
});

test.fixme("upload foto profil (file chooser/storage) di luar alur ubah nama", () => {});

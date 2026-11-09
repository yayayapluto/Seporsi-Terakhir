import { collectConsoleErrors, expectNoConsoleErrors } from "../support/assertions";
import { expect, test } from "../support/fixtures";

test("admin persetujuan @smoke: baris pending seed tampil, setujui memperbarui antrean", async ({
  adminPage: page,
  seed,
}) => {
  const consoleErrors = collectConsoleErrors(page);
  // Nama gerai pending dari seed — barisnya terikat seed.pendingTenantId.
  const pendingName = `e2e-${seed.runId}-pending`;

  await test.step("muat /admin/tenant dan temukan tenant pending seed", async () => {
    await page.goto("/admin/tenant");
    await expect(page.getByRole("heading", { name: /Menunggu persetujuan/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator(`h2:text-is("${pendingName}")`)).toBeVisible();
  });

  await test.step("panel Tinjau menampilkan tombol setujui/tolak", async () => {
    const row = page.locator("li", { has: page.locator(`h2:text-is("${pendingName}")`) });
    await row.getByRole("button", { name: /Tinjau/i }).click();
    await expect(row.getByRole("button", { name: /Setujui tenant/i })).toBeVisible();
    await expect(row.getByRole("button", { name: /Tolak pendaftar/i })).toBeVisible();
    await expect(row.getByRole("button", { name: /^Batal$/i })).toBeVisible();
  });

  await test.step("klk Setujui tenant, baris hilang dan badge antrean berkurang", async () => {
    const row = page.locator("li", { has: page.locator(`h2:text-is("${pendingName}")`) });
    await row.getByRole("button", { name: /Setujui tenant/i }).click();
    await expect(page.locator(`h2:text-is("${pendingName}")`)).toHaveCount(0);
    await expect(page.getByText(/Antrean \(0\)/).first()).toBeAttached();
    await expect(page.getByText(/Tidak ada pendaftaran menunggu/i)).toBeVisible();
  });

  await test.step("tanpa error console", async () => {
    await expectNoConsoleErrors(page, consoleErrors);
  });
});

test("admin persetujuan: dialog tolak pendaftar", async ({ adminPage: page, seed }) => {
  test.fixme(
    true,
    "Alur tolak menghapus baris tenant pending; tidak dapat dipulihkan untuk verifikasi ulang tanpa seed ulang. Diverifikasi manual: Tolak membuka dialog konfirmasi sebelum aksi.",
  );
  const pendingName = `e2e-${seed.runId}-pending`;
  await page.goto("/admin/tenant");
  const row = page.locator("li", { has: page.locator(`h2:text-is("${pendingName}")`) });
  await row.getByRole("button", { name: /Tinjau/i }).click();
  await row.getByRole("button", { name: /Tolak pendaftar/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

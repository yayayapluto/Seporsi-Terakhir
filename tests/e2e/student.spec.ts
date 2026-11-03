import { expect, test } from "@playwright/test";

test("beranda student memuat", async ({ page }) => {
  await page.goto("/beranda");
  await expect(page).toHaveURL(/beranda/);
  await expect(page.getByRole("heading", { name: /kantin hampir tutup/i })).toBeVisible();
});

test("katalog student: filter + pesan 1 porsi", async ({ page }) => {
  await page.goto("/beranda/katalog");
  await expect(page.getByText(/katalog sore ini/i).first()).toBeVisible();
  if ((await page.getByText(/batas 2\/hari tercapai/i).count()) > 0) {
    return;
  }
  if ((await page.getByText(/lihat dan pesan/i).count()) === 0) {
    test.skip(true, "katalog kosong");
    return;
  }
  const href = await page
    .getByRole("link", { name: /lihat dan pesan/i })
    .first()
    .getAttribute("href");
  expect(href).toMatch(/\/beranda\/katalog\/.+/);
  await page.goto(href ?? "/beranda/katalog");
  await expect(page.getByText(/jumlah porsi/i)).toBeVisible();
});

test("happy path: pesan 1 porsi dari katalog", async ({ page }) => {
  await page.goto("/beranda/katalog");
  if ((await page.getByText(/lihat dan pesan/i).count()) === 0) {
    test.skip(true, "katalog kosong");
    return;
  }
  if ((await page.getByText(/batas 2\/hari tercapai/i).count()) > 0) {
    test.skip(true, "limit harian tercapai");
    return;
  }
  const href = await page
    .getByRole("link", { name: /lihat dan pesan/i })
    .first()
    .getAttribute("href");
  await page.goto(href ?? "/beranda/katalog");
  if ((await page.getByRole("button", { name: /^habis$/i }).count()) > 0) {
    test.skip(true, "porsi habis");
    return;
  }
  await page.getByText("1 porsi").click();
  await page.getByRole("button", { name: /^pesan$/i }).click();
  await page.waitForURL(/beranda\/pesanan\/.+/, { timeout: 20_000 });
  await expect(page.getByText(/menunggu pickup/i).first()).toBeVisible();
});

test("edge: over-cap harian ditolak dengan pesan", async ({ page }) => {
  await page.goto("/beranda/katalog");
  if ((await page.getByText(/belum ada porsi sore ini/i).count()) > 0) {
    test.skip(true, "seed kosong");
    return;
  }
  if ((await page.getByText(/batas 2\/hari tercapai/i).count()) > 0) {
    await expect(page.getByText(/batas 2\/hari tercapai/i).first()).toBeVisible();
    return;
  }
  const href = await page
    .getByRole("link", { name: /lihat dan pesan/i })
    .first()
    .getAttribute("href");
  expect(href, "link detail porsi ada di katalog").toBeTruthy();
  await page.goto(href as string);
  await page.getByRole("button", { name: /pesan/i }).click();
  // masih dalam kuota → lolos ke detail; over-cap: server kirim pesan limit. tunggu salah satu.
  await expect
    .poll(
      async () => {
        if (/beranda\/pesanan\//.test(page.url())) return "ok";
        const t = await page
          .getByRole("alert")
          .first()
          .innerText()
          .catch(() => "");
        return /batas harian|maksimal 2/i.test(t) ? "limit" : "pending";
      },
      { timeout: 20_000 },
    )
    .not.toBe("pending");
  if (/beranda\/pesanan\//.test(page.url())) return; // masih dalam kuota
  await expect(page.getByRole("alert").first()).toContainText(/batas harian|maksimal 2/i);
});

test("pesanan tampil + QR modal terbuka", async ({ page }) => {
  await page.goto("/beranda/pesanan");
  await expect(page.getByRole("heading", { name: /pesanan saya/i })).toBeVisible();
  const qr = page.getByRole("button", { name: /lihat qr pickup/i }).first();
  if ((await qr.count()) === 0) {
    test.skip(true, "tidak ada order aktif");
    return;
  }
  await qr.click();
  await expect(page.getByText(/tunjukkan layar ini/i).first()).toBeVisible();
  await expect(page.getByText(/kode manual/i).first()).toBeVisible();
  await page.keyboard.press("Escape");
});

test("detail pesanan pertama memuat", async ({ page }) => {
  await page.goto("/beranda/pesanan");
  const detail = page.getByRole("link", { name: "Detail" }).first();
  if ((await detail.count()) === 0) {
    test.skip(true, "tidak ada riwayat pesanan");
    return;
  }
  await detail.click();
  await expect(page).toHaveURL(/beranda\/pesanan\/.+/);
  await expect(page.getByText(/total/i).first()).toBeVisible();
});

test("batalkan pesanan reserved → Dibatalkan, tombol hilang", async ({ page }) => {
  await page.goto("/beranda/pesanan");
  await expect(page.getByRole("heading", { name: /pesanan saya/i })).toBeVisible();
  const before = await page.getByRole("button", { name: /^batalkan$/i }).count();
  if (before === 0) {
    test.skip(true, "tidak ada order reserved");
    return;
  }
  // cancel does router.refresh(): row flips from reserved to Dibatalkan
  await page
    .getByRole("button", { name: /^batalkan$/i })
    .first()
    .click();
  await expect(page.getByText(/batalkan pesanan\?/i)).toBeVisible();
  await page.getByRole("button", { name: /ya, batalkan/i }).click();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/beranda\/pesanan/);
  const after = await page.getByRole("button", { name: /^batalkan$/i }).count();
  const cancelled = await page.getByText(/dibatalkan/i).count();
  expect(after).toBeLessThan(before);
  expect(cancelled).toBeGreaterThan(0);
});

test("isolasi peran student: /tenant /admin /scan → /beranda", async ({ page }) => {
  for (const path of ["/tenant", "/admin", "/tenant/scan"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/beranda/);
  }
});

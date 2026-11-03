import { expect, test } from "@playwright/test";
import { loginViaMagicLink } from "./helpers/magic-link";

const STUDENT = "rafi1793198479@yopmail.com";

test("landing memuat + CTA katalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /sisa layak makan/i })).toBeVisible();
  const cta = page.getByRole("link", { name: /lihat porsi hari ini/i }).first();
  await expect(cta).toHaveAttribute("href", "/beranda/katalog");
  await cta.click();
  await expect(page).toHaveURL(/masuk\?next=%2Fberanda%2Fkatalog/);
});

test("cara-kerja publik", async ({ page }) => {
  await page.goto("/cara-kerja");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("rute tenant tanpa login dialihkan ke masuk", async ({ page }) => {
  await page.goto("/tenant");
  await expect(page).toHaveURL(/masuk\?next=%2Ftenant/);
});

test("form magic link tampil dan validasi email", async ({ page }) => {
  await page.goto("/masuk");
  const input = page.getByRole("textbox", { name: /email/i });
  await input.fill("bukan-email");
  await input.evaluate((el) => el.setAttribute("type", "text")); // SETELAH fill: React reset type saat fill
  await page.getByRole("button", { name: /kirim tautan masuk/i }).click();
  await expect(page.locator("#email-error")).toContainText(/email tidak valid/i);
});

test("katalog + detail proteksi login → redirect masuk", async ({ page }) => {
  await page.goto("/beranda/katalog");
  await expect(page).toHaveURL(/masuk\?next=%2Fberanda%2Fkatalog/);
  await page.goto("/beranda/katalog/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/masuk\?next=/);
});

test("RBAC anon: rute privat redirect ke masuk?next=", async ({ page }) => {
  for (const path of ["/beranda", "/beranda/pesanan", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`masuk\\?next=${path.replace(/\//g, "%2F")}`));
  }
});

test("kirim magic link valid → kirim ulang + ganti email", async ({ page }) => {
  await page.goto("/masuk");
  await page.getByRole("textbox", { name: /email/i }).fill(STUDENT);
  await page.getByRole("button", { name: /kirim tautan masuk/i }).click();
  const rateLimited = await page.getByText(/terlalu sering/i).count();
  if (rateLimited > 0) return; // pass parsial, jangan kena ban
  await expect(page.getByText(/tautan masuk terkirim ke/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /kirim ulang/i })).toBeVisible();
  await page.getByRole("button", { name: /ganti email/i }).click();
  await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
});

// Live inbox needs a real browser session; headless fetch gets bot-blocked
// (empty body). Gate behind LIVE_INBOX=1, run headed locally.
test("buka magic link asli → mendarat beranda student", async ({ page }) => {
  test.skip(!process.env.LIVE_INBOX, "needs LIVE_INBOX=1 with real Yopmail session");
  await loginViaMagicLink(page, STUDENT);
  await expect(page).toHaveURL(/beranda/);
  await expect(page.getByRole("heading", { name: /kantin hampir tutup/i })).toBeVisible();
  await page.goto("/tenant");
  await expect(page).toHaveURL(/beranda/);
});

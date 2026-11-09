import fs from "node:fs";
import path from "node:path";
import { type Browser, test as base, expect, type Page } from "@playwright/test";
import { createTestData, type E2ESeed, teardownData } from "./seed";
import { sessionCookies } from "./session";

const AUTH_DIR = path.join(process.cwd(), "e2e", ".auth");

type Fixtures = {
  seed: E2ESeed;
  buyerPage: Page;
  mitraPage: Page;
  adminPage: Page;
  seedBuyerPage: Page;
  seedMitraPage: Page;
  autoDismissTour: void;
};

/** Tutup tour onboarding yang auto-muncul (auto=true) di setiap navigasi. */
export async function skipTour(page: Page): Promise<void> {
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(250);
    const skip = page.getByRole("button", { name: /^Lewati$/i });
    if (await skip.count()) {
      await skip.first().click();
      continue;
    }
    if ((await page.getByRole("dialog").count()) === 0) return;
  }
}

function patchGotoToSkipTour(page: Page) {
  const orig = page.goto.bind(page);
  page.goto = async (...args) => {
    const r = await orig(...args);
    await skipTour(page);
    return r;
  };
}

async function storageStateOf(browser: Browser, email: string, password: string, baseURL: string) {
  const cookies = await sessionCookies(email, password, baseURL);
  const ctx = await browser.newContext();
  await ctx.addCookies(cookies);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

export const test = base.extend<Fixtures>({
  seed: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture wajib destructure objek
    async ({}, use) => {
      const seed = await createTestData();
      await use(seed);
      await teardownData();
    },
    { auto: true },
  ],
  // Setiap test yang memakai fixture page (buyer/mitra/admin/seed*): navigasi
  // apa pun otomatis melewatkan tour yang muncul. Spec onboarding TOUR
  // menonaktifkan ini sendiri bila butuh membuktikan adanya tur.
  autoDismissTour: [
    async ({ page }, use) => {
      patchGotoToSkipTour(page);
      await use();
    },
    { auto: true },
  ],
  buyerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, "buyer.json"),
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
    });
    const page = await ctx.newPage();
    patchGotoToSkipTour(page);
    await use(page);
    await ctx.close();
  },
  mitraPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, "mitra.json"),
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
    });
    const page = await ctx.newPage();
    patchGotoToSkipTour(page);
    await use(page);
    await ctx.close();
  },
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, "admin.json"),
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
    });
    const page = await ctx.newPage();
    patchGotoToSkipTour(page);
    await use(page);
    await ctx.close();
  },
  // Sesi segar dari akun seed (untuk test yang memesan: akun storageState
  // bersama menghabiskan limit 2/hari).
  seedBuyerPage: async ({ browser, seed }, use) => {
    const state = await storageStateOf(
      browser,
      seed.buyer.email,
      seed.buyer.password,
      process.env.BASE_URL ?? "http://localhost:3001",
    );
    const ctx = await browser.newContext({
      storageState: state,
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
    });
    const page = await ctx.newPage();
    patchGotoToSkipTour(page);
    await use(page);
    await ctx.close();
    // tidak perlu logout; teardown menghapus akun+data
    void seed.buyer;
    void seed.mitra;
  },
  seedMitraPage: async ({ browser, seed }, use) => {
    const state = await storageStateOf(
      browser,
      seed.mitra.email,
      seed.mitra.password,
      process.env.BASE_URL ?? "http://localhost:3001",
    );
    const ctx = await browser.newContext({
      storageState: state,
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
    });
    const page = await ctx.newPage();
    patchGotoToSkipTour(page);
    await use(page);
    await ctx.close();
    void seed.buyer;
  },
});

test.afterEach(async ({ page }) => {
  expect(page).toBeTruthy();
});

export async function storageStateFor(email: string, password: string, page: Page) {
  await page.goto("/masuk");
  await page.getByLabel(/email/i).fill(email);
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: /masuk|lanjut/i }).click();
  await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain("/masuk");
}

export async function loginViaDevShortcut(page: Page, role: "admin" | "tenant" | "student") {
  await page.goto("/masuk");
  const card = page.locator("text=Khusus development", { hasText: "development" }).first();
  if (await card.count()) {
    await page
      .getByRole("link", { name: new RegExp(role, "i") })
      .first()
      .click();
    return;
  }
}

export { expect };

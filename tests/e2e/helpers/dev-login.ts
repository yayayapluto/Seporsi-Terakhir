import type { Page } from "@playwright/test";

/** Login dev 1 langkah tanpa Yopmail/Google. Butuh dev server + SEED_PASSWORD di server. */
export async function loginAsDev(page: Page, email: string, next = "/"): Promise<void> {
  await page.goto(
    `/api/dev/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
  );
  await page.waitForURL((url) => !url.pathname.startsWith("/masuk"), { timeout: 15_000 });
}

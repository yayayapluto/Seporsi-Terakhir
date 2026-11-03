import type { Page } from "@playwright/test";

/** Klik aman: dismiss tour dulu (bisa muncul telat), lalu DOM-click (overlay-proof). */
export async function act(page: Page, name: RegExp) {
  await dismissTour(page);
  const btn = page.getByRole("button", { name }).first();
  await btn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
}

/** Tutup overlay GuidedTour bila muncul (tombol "Lewati panduan"), tanpa gagal bila tidak ada. */
export async function dismissTour(page: Page) {
  for (let i = 0; i < 4; i++) {
    const skip = page.getByRole("button", { name: /^lewati$/i });
    const skipAll = page.getByRole("button", { name: /lewati panduan/i });
    if ((await skipAll.count()) > 0) {
      await skipAll
        .first()
        .evaluate((el) => (el as HTMLElement).click())
        .catch(() => {});
      await page.waitForTimeout(600);
      continue;
    }
    if ((await skip.count()) === 0) break;
    await skip
      .first()
      .evaluate((el) => (el as HTMLElement).click())
      .catch(() => {});
    await page.waitForTimeout(600);
  }
}

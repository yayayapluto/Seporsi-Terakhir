import type { Page } from "@playwright/test";
import { getMagicLink } from "./yopmail";

/** Isi form /masuk, kirim tautan, buka magic link dari Yopmail. */
export async function loginViaMagicLink(page: Page, email: string): Promise<void> {
  const localPart = email.split("@")[0] ?? email;
  await page.goto("/masuk");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("button", { name: /kirim tautan masuk/i }).click();
  await page.getByText(/tautan masuk terkirim ke/i).waitFor();
  const link = await getMagicLink(localPart);
  await page.goto(link);
  await page.waitForURL((url) => !url.pathname.startsWith("/masuk"), { timeout: 30_000 });
  if (await page.getByText(/tautan tidak valid atau kedaluwarsa/i).count()) {
    throw new Error("magic-link expired/used");
  }
}

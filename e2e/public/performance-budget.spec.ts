import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/masuk", "/offline", "/beranda/katalog"];

test.describe("Budget performa (tanpa Error 1102)", () => {
  for (const route of ROUTES) {
    test(`route ${route} 20x tanpa 5xx / 1102`, async ({ page }) => {
      for (let i = 0; i < 20; i++) {
        const res = await page.request.get(route);
        expect(res.status()).toBeLessThan(500);
        const text = await res.text();
        expect(text).not.toContain("1102");
        expect(text).not.toContain("Worker exceeded resource limits");
      }
    });
  }

  test("landing transfer JS dalam budget", async ({ page }) => {
    let jsBytes = 0;
    page.on("response", async (r) => {
      if (r.url().endsWith(".js")) {
        try {
          jsBytes += (await r.body()).length;
        } catch {
          // ignore
        }
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(jsBytes).toBeLessThan(3 * 1024 * 1024);
  });
});

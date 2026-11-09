import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3001";

// Jangan pernah jalan ke production (kuota Worker free + data iklan di prod).
const PROD_HOSTS = ["seporsi-terakhir.my.id", "re.seporsi-terakhir.my.id"];
const host = (() => {
  try {
    return new URL(baseURL).hostname;
  } catch {
    return "";
  }
})();
if (PROD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
  throw new Error(`menolak jalan terhadap host production: ${baseURL}`);
}

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? undefined : 2,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testDir: "e2e/auth",
      testMatch: /setup\.spec\.ts/,
      retries: 0,
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        timezoneId: "Asia/Jakarta",
        launchOptions: {
          args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
      },
    },
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 13"], timezoneId: "Asia/Jakarta" },
    },
  ],
  webServer: {
    command: "bun run dev -- --port 3001",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
});

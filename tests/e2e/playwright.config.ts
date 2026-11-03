import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  globalSetup: "./global-setup.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  retries: 1,
  expect: { timeout: 10_000 },
  use: { baseURL: "http://localhost:3001", trace: "retain-on-failure" },
  projects: [
    { name: "guest", testMatch: "guest.spec.ts" },
    {
      name: "student",
      testMatch: "student.spec.ts",
      use: { storageState: "tests/.auth/student.json" },
    },
    {
      name: "tenant",
      testMatch: "tenant.spec.ts",
      use: {
        storageState: "tests/.auth/tenant.json",
        permissions: ["camera"],
        launchOptions: {
          args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
      },
    },
    {
      name: "admin",
      testMatch: "admin.spec.ts",
      use: { storageState: "tests/.auth/admin.json" },
    },
  ],
});

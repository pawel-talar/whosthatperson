import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run e2e:server",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});

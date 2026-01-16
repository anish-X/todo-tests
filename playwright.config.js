import { defineConfig, devices } from "@playwright/test";

// Configuration - works both locally and in Docker
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BASE_URL = process.env.BASE_URL || FRONTEND_URL;

export default defineConfig({
  testDir: "./",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "json" : "html",
  outputDir: "test-results",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Only start web server if not in CI/Docker (where it's already running)
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: "cd ../frontend && npm run dev",
          url: FRONTEND_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }),
});

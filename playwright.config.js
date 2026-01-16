import { defineConfig, devices } from "@playwright/test";

// Configuration - works both locally and in Docker
// In Docker/Nomad: frontend runs on http://127.0.0.1:5173 or http://localhost:5173
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BASE_URL = process.env.BASE_URL || FRONTEND_URL;

// Detect if running in CI/Docker environment
// In Nomad/Docker, we don't want to start the web server (it's already running)
const isCI = process.env.CI === "true" || process.env.NOMAD_JOB_NAME || process.env.DOCKER_ENV;

export default defineConfig({
  // Allow testDir to be overridden, default to current directory
  testDir: process.env.TEST_DIR || "./",
  fullyParallel: true,
  forbidOnly: !!isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "json" : "html",
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

  // Only start web server if NOT in CI/Docker (where it's already running)
  // In Nomad, the frontend server is started separately before tests run
  ...(isCI
    ? {}
    : {
        webServer: {
          command: "cd ../frontend && npm run dev",
          url: FRONTEND_URL,
          reuseExistingServer: !isCI,
          timeout: 120000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }),
});

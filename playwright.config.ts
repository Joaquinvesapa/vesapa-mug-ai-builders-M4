import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    // WebKit needs host libraries that are missing locally; enable with PW_WEBKIT=1 where available.
    ...(process.env.PW_WEBKIT
      ? [{ name: "mobile-webkit", use: { ...devices["iPhone 15"], viewport: { width: 375, height: 812 } } }]
      : []),
  ],
  webServer: {
    command: `npm run build && E2E_PORT=${port} npx tsx scripts/e2e-server.mts`,
    // 401 without session counts as ready; independent of which pages exist.
    url: `http://localhost:${port}/api/time`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});

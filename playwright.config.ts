import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a real Next.js dev server and the Firestore project
 * in .env.local, with the DEVELOPMENT-ONLY mock pronunciation provider.
 * Uses the locally installed Chrome and its fake microphone, so no browser
 * download and no real speech is needed.
 */
const PORT = 3210;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/support/globalSetup.ts",
  globalTeardown: "./e2e/support/globalTeardown.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    permissions: ["microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  projects: [
    { name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  webServer: {
    command: `npx next dev --turbopack --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: { PRONUNCIATION_PROVIDER: "mock", PRONUNCIATION_MOCK_SLOW_MS: "2500" },
  },
});

import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";
const url = new URL(process.env.DATABASE_URL!);
url.pathname = "/soultoy_e2e";
process.env.TEST_DATABASE_URL = url.href;
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 360000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    actionTimeout: 30000,
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  webServer: {
    command: "npm run build && npm start -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL: url.href,
      BETTER_AUTH_URL: "http://localhost:3001",
      NEXT_PUBLIC_APP_URL: "http://localhost:3001",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
